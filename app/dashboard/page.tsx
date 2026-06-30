"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Camera, CheckCircle2, ChevronRight, Droplets, FileText, Flame, Footprints, HeartPulse, Loader2, Moon, Settings, Shirt, Sparkles, Sprout, Target, Trophy, Utensils, Users, TrendingUp, Volume2, X } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import HealthScoreSheet from "@/components/dashboard/HealthScoreSheet";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateLifestyleScore } from "@/lib/lifestyleScore";
import { calculateWalkingCalories } from "@/lib/activity";
import { calculatePointBalance } from "@/lib/rewards";
import { getHealthDayKey } from "@/lib/healthDay";
import { getCustomAvatarSource, getHeaderAvatarSource } from "@/lib/avatarProfile";
import { defaultAiCoach, getAiCoachById } from "@/lib/coachData";
import {
  getLocalNudgeMessage,
  resolveNudgeCoachId,
  type NudgeMessage,
} from "@/lib/nudgeMessages";
import { sampleUser, sampleCheckup, sampleDailyLog, sampleChallenges } from "@/lib/sampleData";
import {
  getRandomCoachMessage,
  type CoachId,
} from "@/lib/coachMessages";
import type { UserProfile } from "@/types/user";
import type { HealthCheckup, DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import type { AvatarViewMode } from "@/types/avatar";
import type { AiCoach } from "@/types/coach";
import type { PointTransaction } from "@/types/reward";
import type { Challenge } from "@/types/challenge";

const quickMenus = [
  { href: "/avatar", icon: Camera, label: "내 사진·아바타\n변경" },
  { href: "/avatar-shop", icon: Shirt, label: "아바타\n꾸미기" },
  { href: "/meals", icon: Utensils, label: "식사\n기록" },
  { href: "/report", icon: FileText, label: "건강\n리포트" },
];

type ScoreStatus = "low" | "medium" | "high";
type TodayCoachMessage = {
  message: string;
  date: string;
  coachId: string;
  visibleUntil?: number;
};
type DailyFeedbackResponse = {
  message: string;
};

const FINAL_COACHING_AVAILABLE_HOUR = 21;
const PRIORITY_AI_COACHING_VISIBLE_MS = 60 * 1000;
const medicalDisclaimerPattern =
  /\s*[※*]*\s*이\s*코칭은\s*의료\s*진단이\s*아닌\s*건강\s*습관\s*가이드입니다\.?\s*/g;

const scoreCoachMessages: Record<ScoreStatus, string> = {
  low: "오늘은 무리하지 않아도 괜찮아요. 작은 실천 하나부터 시작해볼까요?",
  medium: "좋아요. 한 가지만 더 실천해볼까요?",
  high: "아주 좋아요. 오늘의 건강 습관이 잘 이어지고 있어요.",
};

function getScoreStatus(score: number): ScoreStatus {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function interpolateColor(from: string, to: string, amount: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const channel = (fromValue: number, toValue: number) =>
    Math.round(fromValue + (toValue - fromValue) * clampedAmount);

  return `rgb(${channel(start.r, end.r)}, ${channel(start.g, end.g)}, ${channel(start.b, end.b)})`;
}

function getScoreGaugeColor(score: number) {
  const stops = [
    { score: 0, color: "#DC5A4E" },
    { score: 25, color: "#EA8B35" },
    { score: 50, color: "#D9A900" },
    { score: 75, color: "#6FBF3B" },
    { score: 100, color: "#087A35" },
    { score: 110, color: "#00A86B" },
  ];
  const clampedScore = Math.max(0, Math.min(110, score));

  for (let index = 0; index < stops.length - 1; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];

    if (clampedScore >= current.score && clampedScore <= next.score) {
      return interpolateColor(
        current.color,
        next.color,
        (clampedScore - current.score) / (next.score - current.score)
      );
    }
  }

  return stops[stops.length - 1].color;
}

function resolveCoachMessageId(selectedCoach: AiCoach): CoachId {
  if (selectedCoach.id === "haru") return "haru";
  if (selectedCoach.id === "taeo") return "taeo";
  if (selectedCoach.id === "rumi") return "rumi";
  if (selectedCoach.id === "onyu") return "onyu";
  if (selectedCoach.id === "lumi") return "rumi";
  if (selectedCoach.id === "onyou") return "onyu";

  if (selectedCoach.name?.includes("하루")) return "haru";
  if (selectedCoach.name?.includes("태오")) return "taeo";
  if (selectedCoach.name?.includes("루미")) return "rumi";
  if (selectedCoach.name?.includes("온유")) return "onyu";

  return "onyu";
}

function isTodayCoachMessage(value: unknown): value is TodayCoachMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.message === "string" && typeof record.date === "string" && typeof record.coachId === "string";
}

function isPriorityCoachMessageVisible(message: TodayCoachMessage | null, healthDayKey: string) {
  return Boolean(
    message?.message &&
    message.date === healthDayKey &&
    typeof message.visibleUntil === "number" &&
    message.visibleUntil > Date.now()
  );
}

function cleanCoachBubbleMessage(message: string) {
  return message.replace(medicalDisclaimerPattern, " ").replace(/\s{2,}/g, " ").trim();
}

function createEmptyDailyLog(logDate: string): DailyLog {
  return {
    id: `daily-empty-${logDate}`,
    logDate,
    steps: 0,
    sleepHours: 0,
    waterCups: 0,
    mealsCount: 0,
    medicationTaken: false,
    exerciseDone: false,
    conditionScore: 0,
    memo: "",
  };
}

function getDailyLogForHealthDay(logs: DailyLog[], healthDayKey: string) {
  return [...logs].reverse().find((log) => log.logDate === healthDayKey) || createEmptyDailyLog(healthDayKey);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function countConsecutiveMissedDays(logs: DailyLog[]) {
  const loggedDates = new Set(logs.map((log) => log.logDate));
  let missed = 0;

  for (let offset = 0; offset < 30; offset += 1) {
    const dateKey = getLocalDateKey(addDays(new Date(), -offset));
    if (loggedDates.has(dateKey)) break;
    missed += 1;
  }

  return missed;
}

function resolveNotificationCoachIcon(coachId?: string | null) {
  const normalizedCoachId =
    coachId === "onyu"
      ? "onyou"
      : coachId === "rumi"
        ? "lumi"
        : coachId === "kangtaeo"
          ? "taeo"
          : coachId;
  const coach = getAiCoachById(normalizedCoachId);
  return coach.faceImageUrl || coach.imageUrl || "/icons/icon-192x192.png";
}

function getMealReminderForTime(date: Date) {
  const hour = date.getHours();

  if (hour >= 6 && hour <= 10) {
    return {
      title: "아침을 챙길 시간이에요",
      message: "아침 메뉴와 채소 포함 여부를 가볍게 기록해보세요.",
    };
  }

  if (hour >= 11 && hour <= 13) {
    return {
      title: "점심 기록을 남겨볼까요",
      message: "오늘 점심 메뉴와 식사 상태를 간단히 기록해보세요.",
    };
  }

  if (hour >= 14 && hour <= 16) {
    return {
      title: "오후 식사 흐름을 확인해요",
      message: "간식이나 점심 이후 식사 흐름을 짧게 남겨보세요.",
    };
  }

  if (hour >= 17 && hour <= 20) {
    return {
      title: "저녁 식사를 기록해요",
      message: "저녁 메뉴와 과식 여부를 체크하면 분석이 더 좋아져요.",
    };
  }

  if (hour >= 21 || hour <= 4) {
    return {
      title: "오늘 식사 흐름을 정리해요",
      message: "야식 여부와 오늘 먹은 메뉴를 정리해보세요.",
    };
  }

  return {
    title: "식사 기록을 가볍게 남겨요",
    message: "오늘 먹은 메뉴와 채소 포함 여부를 기록해 건강 흐름을 확인해보세요.",
  };
}

function isDailyFeedbackResponse(value: unknown): value is DailyFeedbackResponse {
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).message === "string";
}

function getChallengeBadgeProgress(challenges: Challenge[]) {
  if (!challenges.length) return 0;

  return Math.max(
    ...challenges.map((challenge) => {
      if (challenge.status === "completed") return 100;
      if (!challenge.targetValue) return 0;
      return Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100));
    })
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [checkup, setCheckup] = useState<HealthCheckup>(sampleCheckup);
  const [dailyLog, setDailyLog] = useState<DailyLog>(sampleDailyLog);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  const [avatarViewMode, setAvatarViewMode] = useState<AvatarViewMode>("portrait");
  const [selectedCoach, setSelectedCoach] = useState<AiCoach>(defaultAiCoach);
  const [todayCoachMessage, setTodayCoachMessage] = useState<TodayCoachMessage | null>(null);
  const [showPriorityCoachMessage, setShowPriorityCoachMessage] = useState(false);
  const [nudgeBanner, setNudgeBanner] = useState<NudgeMessage | null>(null);
  const [scoreSheetOpen, setScoreSheetOpen] = useState(false);
  const [finalCoachingLoading, setFinalCoachingLoading] = useState(false);
  const [finalCoachingError, setFinalCoachingError] = useState("");
  const [avatarFocusMode, setAvatarFocusMode] = useState(false);
  const [avatarDragX, setAvatarDragX] = useState(0);
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [challengeBadgeProgress, setChallengeBadgeProgress] = useState(0);
  const avatarSwipeStartX = useRef<number | null>(null);
  const avatarSwipeStartY = useRef<number | null>(null);

  useEffect(() => {
    const savedUser = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const savedCheckup = getFromStorage<HealthCheckup>(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const savedChallenges = getFromStorage<Challenge[]>(STORAGE_KEYS.CHALLENGES, sampleChallenges);
    const healthDayKey = getHealthDayKey();
    const latestLog = getDailyLogForHealthDay(logs, healthDayKey);
    const savedCoachId = getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, defaultAiCoach.id);
    setUser(savedUser);
    setCheckup(savedCheckup);
    const savedMeals = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    setDailyLog(latestLog);
    setScore(calculateLifestyleScore(latestLog, savedMeals));
    setMeals(savedMeals);
    setChallengeBadgeProgress(getChallengeBadgeProgress(savedChallenges));
    setAvatarViewMode(getFromStorage<AvatarViewMode>(STORAGE_KEYS.AVATAR_VIEW_MODE, "portrait"));
    setSelectedCoach(getAiCoachById(savedCoachId));
    const savedTodayCoachMessage = getFromStorage<unknown>(STORAGE_KEYS.TODAY_COACH_MESSAGE, null);
    if (isTodayCoachMessage(savedTodayCoachMessage)) {
      setTodayCoachMessage(savedTodayCoachMessage);
      setShowPriorityCoachMessage(isPriorityCoachMessageVisible(savedTodayCoachMessage, healthDayKey));
    }

    const checkNudge = async () => {
      const todayKey = getLocalDateKey();
      const dismissedDate = getFromStorage<string | null>(STORAGE_KEYS.LAST_NUDGE_BANNER_DISMISSED, null);
      const lastSentDate = getFromStorage<string | null>(STORAGE_KEYS.LAST_NUDGE_SENT, null);
      const daysMissed = countConsecutiveMissedDays(logs);

      if (daysMissed < 3 || dismissedDate === todayKey || lastSentDate === todayKey) return;

      const result = getLocalNudgeMessage(savedCoachId, daysMissed);

      if ("Notification" in window && Notification.permission === "granted") {
        const coachIcon = resolveNotificationCoachIcon(savedCoachId);
        new Notification(result.title, {
          body: result.message,
          icon: new URL(coachIcon, window.location.origin).toString(),
          badge: "/icons/icon-192x192.png",
        });
        saveToStorage(STORAGE_KEYS.LAST_NUDGE_SENT, todayKey);
      } else {
        setNudgeBanner(result);
      }
    };

    void checkNudge();

    const updatePoints = () => {
      const txs = getFromStorage<PointTransaction[]>(
        STORAGE_KEYS.POINT_TRANSACTIONS,
        []
      );
      setPoints(calculatePointBalance(txs));
    };
    updatePoints();
    window.addEventListener("storage", updatePoints);
    window.addEventListener("pointsUpdated", updatePoints);
    return () => {
      window.removeEventListener("storage", updatePoints);
      window.removeEventListener("pointsUpdated", updatePoints);
    };
  }, []);

  const closeNudgeBanner = () => {
    saveToStorage(STORAGE_KEYS.LAST_NUDGE_BANNER_DISMISSED, getLocalDateKey());
    setNudgeBanner(null);
  };

  const currentHealthDayKey = getHealthDayKey(currentTime);

  useEffect(() => {
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const savedMeals = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    const currentLog = getDailyLogForHealthDay(logs, currentHealthDayKey);

    setDailyLog(currentLog);
    setMeals(savedMeals);
    setScore(calculateLifestyleScore(currentLog, savedMeals));
  }, [currentHealthDayKey]);

  useEffect(() => {
    if (!showPriorityCoachMessage || todayCoachMessage?.date !== currentHealthDayKey || !todayCoachMessage.message) return;

    const remainingMs =
      typeof todayCoachMessage.visibleUntil === "number"
        ? todayCoachMessage.visibleUntil - Date.now()
        : PRIORITY_AI_COACHING_VISIBLE_MS;

    if (remainingMs <= 0) {
      setShowPriorityCoachMessage(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPriorityCoachMessage(false);
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [currentHealthDayKey, showPriorityCoachMessage, todayCoachMessage]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const changeAvatarViewMode = (mode: AvatarViewMode) => {
    setAvatarViewMode(mode);
    saveToStorage(STORAGE_KEYS.AVATAR_VIEW_MODE, mode);
  };

  const handleAvatarSwipeStart = (event: PointerEvent<HTMLElement>) => {
    avatarSwipeStartX.current = event.clientX;
    avatarSwipeStartY.current = event.clientY;
    setIsAvatarDragging(true);
    setAvatarDragX(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const resetAvatarSwipe = () => {
    avatarSwipeStartX.current = null;
    avatarSwipeStartY.current = null;
    setIsAvatarDragging(false);
    setAvatarDragX(0);
  };

  const handleAvatarSwipeMove = (event: PointerEvent<HTMLElement>) => {
    if (avatarSwipeStartX.current === null || avatarSwipeStartY.current === null) return;

    const deltaX = event.clientX - avatarSwipeStartX.current;
    const deltaY = event.clientY - avatarSwipeStartY.current;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 18) {
      resetAvatarSwipe();
      return;
    }

    const boundedDelta = Math.max(-172, Math.min(172, deltaX));
    setAvatarDragX(boundedDelta);
  };

  const handleAvatarSwipeEnd = (event: PointerEvent<HTMLElement>) => {
    if (avatarSwipeStartX.current === null || avatarSwipeStartY.current === null) return;

    const deltaX = event.clientX - avatarSwipeStartX.current;
    const deltaY = event.clientY - avatarSwipeStartY.current;
    resetAvatarSwipe();

    if (Math.abs(deltaX) < 70 || Math.abs(deltaY) > 70) {
      return;
    }

    setAvatarFocusMode(deltaX < 0);
  };

  const handleCoachMessageClick = () => {
    console.log("코치 음성 안내는 추후 제공될 예정입니다.");
  };

  const handleCreateFinalCoaching = async () => {
    const confirmed = window.confirm(
      "오늘의 코칭은 입력한 걸음, 수면, 수분, 식사 기록을 기준으로 생성돼요.\n건강상태나 검진 수치가 입력되어 있다면 함께 참고해요.\n입력을 모두 마친 뒤 코칭을 받으세요.\n\n지금 오늘의 최종 코칭을 생성할까요?"
    );
    if (!confirmed) return;

    const coachId = resolveNudgeCoachId(selectedCoach.id);
    setFinalCoachingLoading(true);
    setFinalCoachingError("");

    try {
      const response = await fetch("/api/daily-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          steps: dailyLog.steps,
          sleepHours: dailyLog.sleepHours,
          waterCups: dailyLog.waterCups,
          mealsCount: dailyLog.mealsCount,
          exerciseDone: dailyLog.exerciseDone,
          conditionScore: dailyLog.conditionScore,
          score,
          healthCheckup: {
            bmi: checkup.bmi,
            waist: checkup.waist,
            systolicBp: checkup.systolicBp,
            diastolicBp: checkup.diastolicBp,
            fastingGlucose: checkup.fastingGlucose,
            totalCholesterol: checkup.totalCholesterol,
            hdl: checkup.hdl,
            ast: checkup.ast,
            alt: checkup.alt,
            gammaGtp: checkup.gammaGtp,
          },
          currentHour: currentTime.getHours(),
          mode: "final",
        }),
      });
      const result = (await response.json()) as unknown;

      if (!response.ok || !isDailyFeedbackResponse(result)) {
        throw new Error("오늘의 최종 코칭을 만들지 못했어요.");
      }

      const nextMessage = {
        message: cleanCoachBubbleMessage(result.message),
        date: currentHealthDayKey,
        coachId,
        visibleUntil: Date.now() + PRIORITY_AI_COACHING_VISIBLE_MS,
      };

      saveToStorage(STORAGE_KEYS.TODAY_COACH_MESSAGE, nextMessage);
      setTodayCoachMessage(nextMessage);
      setShowPriorityCoachMessage(true);
    } catch (error) {
      console.error("Final daily coaching failed", error);
      setFinalCoachingError("최종 코칭 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setFinalCoachingLoading(false);
    }
  };

  const calories = calculateWalkingCalories(dailyLog.steps, checkup.weight);
  const displayName = user.name?.trim() || "사용자";
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const headerAvatar = getHeaderAvatarSource(user, avatarGender);
  const customAvatarImage = getCustomAvatarSource(user, avatarViewMode);
  const formattedCurrentTime = currentTime.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const today = currentHealthDayKey;
  const todayMeals = meals.filter((meal) => meal.mealDate === today);
  const mealCalories = todayMeals.reduce((sum, meal) => sum + meal.estimatedCalories, 0);
  const scoreStatus = getScoreStatus(score);
  const coachMessage = scoreCoachMessages[scoreStatus];
  const selectedCoachId = useMemo(() => resolveCoachMessageId(selectedCoach), [selectedCoach]);
  const selectedCoachMessage = useMemo(() => {
    return getRandomCoachMessage(selectedCoachId);
  }, [selectedCoachId]);
  const activeTodayCoachMessage =
    todayCoachMessage?.date === today && todayCoachMessage.message ? todayCoachMessage : null;
  const bubbleMessageText = cleanCoachBubbleMessage(
    showPriorityCoachMessage && activeTodayCoachMessage ? activeTodayCoachMessage.message : selectedCoachMessage.message.text
  );
  const finalCoachingText = activeTodayCoachMessage ? cleanCoachBubbleMessage(activeTodayCoachMessage.message) : "";
  const finalCoachingDisclaimer = "※ 이 코칭은 의료 진단이 아닌 건강 습관 가이드입니다.";
  const canCreateFinalCoaching = currentTime.getHours() >= FINAL_COACHING_AVAILABLE_HOUR;
  const hasTodayRecord = dailyLog.steps > 0 || dailyLog.sleepHours > 0 || dailyLog.waterCups > 0 || dailyLog.mealsCount > 0 || todayMeals.length > 0;
  const mealReminder = getMealReminderForTime(currentTime);
  const statusVideoUrl = `/avatars/status/avatar_${scoreStatus}.mp4`;
  const activeStatusVideoUrl = avatarViewMode === "fullbody" ? statusVideoUrl : undefined;
  const clampedScore = Math.max(0, Math.min(110, score));
  const avatarFocusOffset = avatarFocusMode ? -172 : 0;
  const avatarDragOffset = isAvatarDragging ? Math.max(-172, Math.min(172, avatarDragX)) : 0;
  const avatarPanelX = Math.max(-172, Math.min(0, avatarFocusOffset + avatarDragOffset));
  const avatarPanelProgress = Math.min(1, Math.abs(avatarPanelX) / 172);
  const avatarPanelStyle = {
    transform: `translateX(${avatarPanelX}px)`,
    opacity: 1 - avatarPanelProgress,
    transition: isAvatarDragging ? "none" : "transform 280ms ease-out, opacity 280ms ease-out",
    pointerEvents: avatarPanelProgress > 0.96 ? "none" : "auto",
  } as const;
  const avatarTopUiStyle = {
    transform: `translateY(${-20 * avatarPanelProgress}px)`,
    opacity: 1 - avatarPanelProgress,
    transition: isAvatarDragging ? "none" : "transform 280ms ease-out, opacity 280ms ease-out",
    pointerEvents: avatarPanelProgress > 0.96 ? "none" : "auto",
  } as const;
  const avatarChallengeStyle = {
    transform: `translateX(${20 * avatarPanelProgress}px)`,
    opacity: 1 - avatarPanelProgress,
    transition: isAvatarDragging ? "none" : "transform 280ms ease-out, opacity 280ms ease-out",
    pointerEvents: avatarPanelProgress > 0.96 ? "none" : "auto",
  } as const;
  const challengeBadgePercent = Math.max(0, Math.min(100, challengeBadgeProgress));
  const challengeBadgeComplete = challengeBadgePercent >= 100;
  const challengeBadgeFillStyle = {
    height: `${challengeBadgePercent}%`,
  };
  const gaugePercent = Math.min(1, clampedScore / 110);
  const scoreGaugeColor = getScoreGaugeColor(clampedScore);
  const scoreGaugeStyle = {
    background: `conic-gradient(from 0deg, #DC5A4E 0deg, ${scoreGaugeColor} ${gaugePercent * 360}deg, transparent ${gaugePercent * 360}deg 360deg)`,
    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
    mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
    transition: "background 500ms ease, filter 500ms ease",
  };
  const scoreGlassStyle = {
    background:
      "radial-gradient(circle at 34% 18%, rgba(255,255,255,0.46), rgba(255,255,255,0.18) 30%, rgba(186,255,220,0.13) 58%, rgba(31,90,58,0.1) 100%)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 18px 34px rgba(255,255,255,0.16), inset 0 -18px 28px rgba(31,90,58,0.11), 0 16px 36px rgba(10,66,40,0.16)",
  };
  const scoreCircleEffect =
    clampedScore >= 110
      ? "border-transparent bg-transparent shadow-[0_0_0_1px_rgba(16,185,129,0.42),0_0_46px_rgba(34,197,94,0.48),0_0_72px_rgba(250,204,21,0.22),0_18px_34px_rgba(31,90,58,0.24)] ring-[#BBF7D0]/65 score-celebration-glow"
      : clampedScore >= 100
      ? "border-transparent bg-transparent shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_0_34px_rgba(34,197,94,0.28),0_18px_34px_rgba(31,90,58,0.22)] ring-[#86EFAC]/45 score-health-glow"
      : clampedScore >= 90
        ? "border-transparent bg-transparent shadow-[0_0_0_1px_rgba(74,222,128,0.2),0_0_28px_rgba(74,222,128,0.24),0_16px_32px_rgba(31,90,58,0.2)] ring-[#BBF7D0]/40 score-health-glow"
        : scoreStatus === "high"
          ? "border-transparent bg-transparent shadow-[0_0_20px_rgba(163,230,53,0.18),0_14px_28px_rgba(31,90,58,0.18)] ring-white/25"
          : scoreStatus === "medium"
            ? "border-transparent bg-transparent shadow-[0_0_18px_rgba(250,204,21,0.14),0_14px_28px_rgba(31,90,58,0.18)] ring-white/24"
            : "border-transparent bg-transparent shadow-[0_14px_28px_rgba(31,90,58,0.18)] ring-white/22";
  const dashboardMetricItems = [
    { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]", achieved: dailyLog.steps >= 7000, href: "/habits?type=steps" },
    { icon: Flame, label: "소모 칼로리", value: `${calories} kcal`, color: "text-[#F59E0B]", achieved: calories >= 300 },
    { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]", achieved: dailyLog.sleepHours >= 7 && dailyLog.sleepHours <= 9, href: "/habits?type=sleep" },
    { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]", achieved: dailyLog.waterCups >= 6, href: "/habits?type=water" },
    { icon: Utensils, label: "식사", value: `${todayMeals.filter((meal) => meal.mealType !== "snack").length || dailyLog.mealsCount}/3회`, color: "text-[#E58A2B]", achieved: todayMeals.filter((meal) => meal.mealType !== "snack").length >= 3 || dailyLog.mealsCount >= 3, href: "/habits?type=meal" },
  ];

  const summaryItems = [
    { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]" },
    { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]" },
    { icon: Flame, label: "소모 칼로리", value: `${calories}kcal`, color: "text-[#F59E0B]" },
    { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]" },
    { icon: HeartPulse, label: "혈압", value: `${checkup.systolicBp}/${checkup.diastolicBp}`, color: "text-[#E34D59]" },
    { icon: Utensils, label: "오늘 식단", value: `${todayMeals.filter((meal) => meal.mealType !== "snack").length}/3회`, color: "text-[#E58A2B]" },
  ];

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-1">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-[#BDE8CA] bg-[#EAF7EF] shadow-sm ring-1 ring-white">
              <Image src={headerAvatar} alt="내 아바타" fill priority unoptimized={headerAvatar.startsWith("data:")} className="scale-[1.18] rounded-full object-cover object-[center_18%]" />
            </span>
            <span className="truncate text-base font-bold text-[#1F5A3A]">내일의건강</span>
          </Link>
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#EAF7EF]/80 px-2.5 py-1 text-xs font-bold text-[#1F5A3A]" aria-label={`현재 시간 ${formattedCurrentTime}`}>
          {formattedCurrentTime}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/points" className="flex items-center gap-1 rounded-full bg-[#EAF7EF] px-3 py-1">
            <Sprout size={14} className="text-[#4CAF6A]" />
            <span className="text-sm font-bold text-[#1F5A3A]">{points.toLocaleString()}</span>
            <span className="text-xs text-[#4CAF6A]">P</span>
          </Link>
          <Link href="/settings" className="text-gray-400 hover:text-gray-600" aria-label="설정">
            <Settings size={20} />
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {nudgeBanner && (
          <section className="mx-4 mt-3 rounded-2xl border border-green-100 bg-[#EAF7EF] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 shrink-0 text-[#4CAF6A]" size={19} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#1F5A3A]">{nudgeBanner.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#1F2937]">{nudgeBanner.message}</p>
              </div>
              <button type="button" onClick={closeNudgeBanner} aria-label="이탈 알림 닫기" className="rounded-full p-1 text-gray-400 transition hover:bg-white/70 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </section>
        )}
        <section
          className="relative h-[clamp(700px,178vw,760px)] overflow-hidden bg-[#1F5A3A] touch-pan-y"
          onPointerDown={handleAvatarSwipeStart}
          onPointerMove={handleAvatarSwipeMove}
          onPointerUp={handleAvatarSwipeEnd}
          onPointerCancel={resetAvatarSwipe}
        >
          <div className="absolute inset-0"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode={avatarViewMode} mood={dailyLog.steps >= 7000 ? "happy" : "idle"} customImageUrl={customAvatarImage} statusVideoUrl={activeStatusVideoUrl} fill cover priority showWindEffect showLeaves showLightTrails alt={`${displayName}님의 마이 아바타`} /></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/55 to-transparent" />

          <div
            className="absolute left-2 right-2 top-2 z-30 flex items-start gap-2"
            style={avatarTopUiStyle}
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#EAF7EF] shadow-md ring-1 ring-[#BDE8CA]">
              <Image src={selectedCoach.faceImageUrl || selectedCoach.imageUrl} alt={`${selectedCoach.name} 코치`} fill className="object-cover" />
            </div>
            <button type="button" onClick={handleCoachMessageClick} aria-label="코치 음성 안내 준비중" title="코치 음성 안내 준비중" className="relative flex-1 rounded-2xl border border-[#BDE8CA] bg-white/92 px-3.5 py-2 text-left shadow-[0_10px_24px_rgba(31,90,58,0.16)] backdrop-blur-md transition duration-150 hover:bg-white/95 active:scale-[0.98] active:bg-white before:absolute before:left-[-6px] before:top-3.5 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-[#BDE8CA] before:bg-white/92">
              <span className="flex items-start gap-2">
                <span className="flex-1 text-sm font-medium leading-5 text-[#173425]">{bubbleMessageText}</span>
                <Volume2 size={15} className="mt-0.5 shrink-0 text-[#4CAF6A]/55" aria-hidden="true" />
              </span>
            </button>
          </div>

          <Link
            href="/challenges"
            aria-label="챌린지로 이동"
            title={`챌린지 진행률 ${challengeBadgePercent}%`}
            className={`absolute right-3 top-[12%] z-30 flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-black text-[#1F5A3A] shadow-[0_12px_28px_rgba(10,66,40,0.16),inset_0_1px_0_rgba(255,255,255,0.76)] ring-1 backdrop-blur-[18px] backdrop-saturate-150 transition active:scale-95 ${challengeBadgeComplete ? "border-yellow-100/90 bg-[#FEF9C3]/56 ring-yellow-100/70 shadow-[0_0_22px_rgba(250,204,21,0.32),0_12px_28px_rgba(10,66,40,0.16),inset_0_1px_0_rgba(255,255,255,0.84)]" : "border-white/68 bg-white/30 ring-white/25"}`}
            style={avatarChallengeStyle}
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/46 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FACC15] via-[#D9F99D] to-[#86EFAC] transition-all duration-500" style={challengeBadgeFillStyle} />
              {challengeBadgeComplete && <span className="absolute inset-0 animate-ping rounded-full bg-yellow-200/30" />}
              <Trophy size={17} className={`relative z-10 ${challengeBadgeComplete ? "text-[#B7791F]" : "text-[#4CAF6A]"}`} />
            </span>
            <span className="text-xs leading-tight">
              챌린지
              <span className="block text-[10px] font-extrabold text-[#1F5A3A]/70">{challengeBadgePercent}%</span>
            </span>
          </Link>

          <div
            className="absolute inset-0 z-20"
            style={avatarPanelStyle}
          >
            <div className="absolute left-[3%] top-[52.5%] space-y-1.5">
              {dashboardMetricItems.map(({ icon: Icon, label, value, color, achieved, href }) => {
                const metricClassName = `relative block h-14 w-[142px] overflow-hidden rounded-[21px] border px-3 shadow-[0_14px_34px_rgba(10,66,40,0.14),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-12px_22px_rgba(31,90,58,0.08)] backdrop-blur-[18px] backdrop-saturate-150 ${href ? "transition duration-150 active:scale-[0.98] active:border-[#86EFAC] active:shadow-[0_0_0_2px_rgba(134,239,172,0.46),0_0_24px_rgba(74,222,128,0.38),0_14px_34px_rgba(10,66,40,0.14),inset_0_1px_0_rgba(255,255,255,0.78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86EFAC]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" : ""} ${achieved ? "border-white/70 bg-[#EAF7EF]/36 ring-1 ring-white/45" : "border-white/58 bg-white/24 ring-1 ring-white/25"}`;
                const metricContent = (
                  <>
                    {achieved && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#4CAF6A] text-white"><CheckCircle2 size={11} /></span>}
                    <span className="pointer-events-none absolute inset-x-3 top-1 h-px bg-white/70" />
                    <span className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-white/18 blur-xl" />
                    <div className="flex h-full items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]"><Icon size={20} className={color} /></span><div><p className="whitespace-nowrap text-[11px] font-semibold text-[#1F2937]/70">{label}</p><p className="whitespace-nowrap text-base font-black leading-5 text-[#102D20]">{value}</p></div></div>
                  </>
                );

                return href ? (
                  <Link key={label} href={href} aria-label={`${label} 입력하기`} className={metricClassName}>
                    {metricContent}
                  </Link>
                ) : (
                  <div key={label} className={metricClassName}>
                    {metricContent}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (finalCoachingText) {
                  document.getElementById("today-final-coaching")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                void handleCreateFinalCoaching();
              }}
              disabled={finalCoachingLoading || (!finalCoachingText && (!canCreateFinalCoaching || !hasTodayRecord))}
              className={`absolute left-[3%] top-[34%] flex h-14 w-[142px] flex-col justify-center overflow-hidden rounded-[21px] rounded-bl-md border px-3 text-left shadow-[0_14px_34px_rgba(10,66,40,0.14),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-12px_22px_rgba(31,90,58,0.08)] backdrop-blur-[18px] backdrop-saturate-150 transition active:scale-[0.98] ${
                finalCoachingText
                  ? "border-white/70 bg-[#EAF7EF]/38 ring-1 ring-white/45"
                  : canCreateFinalCoaching && hasTodayRecord
                    ? "border-white/64 bg-white/28 ring-1 ring-white/30"
                    : "border-white/50 bg-white/18 ring-1 ring-white/20"
              }`}
            >
              <span className="pointer-events-none absolute inset-x-3 top-1 h-px bg-white/70" />
              <span className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-white/18 blur-xl" />
              <p className="text-xs font-bold text-[#16743B]">✨ 오늘의 코칭</p>
              <p className="mt-0.5 whitespace-nowrap text-[12px] font-extrabold text-[#163D29]">
                {finalCoachingText
                  ? "오늘 코칭 완료"
                  : finalCoachingLoading
                    ? "생성 중..."
                    : canCreateFinalCoaching && hasTodayRecord
                      ? "결과 코칭 받기"
                      : "밤 9시 이후 가능"}
              </p>
            </button>

            <div className="absolute left-[3%] top-[43%] flex h-14 w-[142px] flex-col justify-center overflow-hidden rounded-[21px] rounded-bl-md border border-white/62 bg-white/25 px-3 shadow-[0_14px_34px_rgba(10,66,40,0.14),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-12px_22px_rgba(31,90,58,0.08)] ring-1 ring-white/25 backdrop-blur-[18px] backdrop-saturate-150">
              <span className="pointer-events-none absolute inset-x-3 top-1 h-px bg-white/70" />
              <span className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-white/18 blur-xl" />
              <p className="text-xs font-bold text-[#16743B]">🌿 건강한 습관이</p><p className="mt-0.5 whitespace-nowrap text-[13px] font-extrabold text-[#163D29]">내일의 나를 만듭니다!</p>
            </div>

            <button type="button" onClick={() => setScoreSheetOpen(true)} className={`absolute left-[3%] top-[13.5%] flex h-36 w-36 flex-col items-center justify-center overflow-visible rounded-full border-[5px] text-center ring-2 backdrop-blur-[18px] backdrop-saturate-150 transition active:scale-95 ${scoreCircleEffect}`} aria-label="오늘 내 점수 분석 열기">
              {clampedScore >= 100 && <span className="score-complete-wave pointer-events-none absolute -inset-3 rounded-full border border-[#86EFAC]/70" />}
              {clampedScore >= 110 && <span className="score-celebration-wave pointer-events-none absolute -inset-5 rounded-full border border-[#FDE68A]/70" />}
              <span className="pointer-events-none absolute -inset-[8px] rounded-full" style={scoreGaugeStyle} />
              <span className="pointer-events-none absolute inset-0 rounded-full border border-white/30 backdrop-blur-[20px] backdrop-saturate-150" style={scoreGlassStyle} />
              <span className="pointer-events-none absolute inset-[10px] rounded-full border border-white/20 bg-white/5 shadow-[inset_0_1px_14px_rgba(255,255,255,0.18)]" />
              {clampedScore >= 90 && <span className="pointer-events-none absolute inset-y-[-20%] left-[-70%] w-12 rotate-12 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent blur-sm animate-[scoreShimmer_5.5s_ease-in-out_infinite]" />}
              {clampedScore >= 100 && (
                <>
                  <span className="score-leaf-particle pointer-events-none absolute left-4 top-4">🌿</span>
                  <span className="score-spark-particle pointer-events-none absolute right-5 top-5">✦</span>
                  <span className="absolute -right-1 top-1 rounded-full bg-[#F7C948] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">완료</span>
                </>
              )}
              {clampedScore >= 110 && (
                <>
                  <span className="score-spark-particle score-spark-delay pointer-events-none absolute left-8 bottom-5">✦</span>
                  <span className="score-leaf-particle score-leaf-delay pointer-events-none absolute right-8 bottom-4">🌿</span>
                  <span className="absolute -left-2 top-7 rounded-full bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">110</span>
                </>
              )}
              <span className="relative mt-2 flex flex-col items-center leading-none">
                <span className="text-[13px] font-extrabold leading-[1.15] text-[#14251B] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)]">오늘의 건강관리</span>
                <span className="mt-0.5 text-[13px] font-bold leading-[1.15] text-[#263F31] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)]">{clampedScore >= 110 ? "완벽 달성!" : clampedScore >= 100 ? "루틴 완료!" : "참고 점수"}</span>
              </span>
              <p className="relative mt-1 text-5xl font-black leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,0.42)]" style={{ color: scoreGaugeColor }}>{score}</p><p className="relative text-base font-extrabold leading-tight text-[#087A35] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">/ 110</p>
            </button>
          </div>
          {avatarPanelProgress > 0.92 && (
            <button
              type="button"
              onClick={() => setAvatarFocusMode(false)}
              aria-label="대시보드 UI 다시 보기"
              className="absolute left-2 top-[46%] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/28 text-[#1F5A3A] shadow-[0_12px_28px_rgba(10,66,40,0.18),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[18px] backdrop-saturate-150 transition active:scale-95"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </section>

        <section className="relative z-30 px-4 pt-3">
          <div className="mx-auto flex w-fit rounded-full border border-gray-100 bg-white p-1 shadow-sm">
            <button onClick={() => changeAvatarViewMode("portrait")} className={`rounded-full px-5 py-2 text-xs font-bold ${avatarViewMode === "portrait" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>상반신 보기</button>
            <button onClick={() => changeAvatarViewMode("fullbody")} className={`rounded-full px-5 py-2 text-xs font-bold ${avatarViewMode === "fullbody" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>전신 보기</button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_14px_35px_rgba(31,41,55,0.12)]">
            {quickMenus.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#F2FAF4] to-[#E8F5EC] px-1 text-center active:scale-95">
                <Icon size={28} className="text-[#24944E]" /><span className="whitespace-pre-line text-xs font-bold leading-relaxed text-[#1F2937]">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 pt-5">
          <div className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#4CAF6A]">최근 건강검진 요약</p><h3 className="mt-1 text-lg font-black text-[#1F2937]">관리 방향을 생활습관으로 연결해요</h3></div><HeartPulse className="text-[#4CAF6A]" /></div>
            <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">혈압 좋음</span><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">혈당 좋음</span><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">LDL 관리 참고</span></div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">건강이가 추천하는 오늘의 루틴: 식후 10분 걷기 · 물 충분히 마시기 · 가공식품 줄이기</p>
            <div className="mt-4 grid grid-cols-2 gap-2"><Link href="/checkup/insights" className="flex items-center justify-between rounded-xl bg-[#EAF7EF] px-3 py-3 text-sm font-bold text-[#1F5A3A]">관리 항목 보기<ChevronRight size={17}/></Link><Link href="/checkup" className="flex items-center justify-between rounded-xl border border-green-200 px-3 py-3 text-sm font-bold text-[#1F5A3A]">검진 입력<ChevronRight size={17}/></Link></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3"><Link href="/health-change" className="rounded-2xl bg-white p-4 shadow-sm"><TrendingUp className="text-[#4CAF6A]"/><p className="mt-2 font-extrabold">나의 건강 변화</p><p className="mt-1 text-xs text-gray-500">시작과 현재 비교</p></Link><Link href="/family" className="rounded-2xl bg-white p-4 shadow-sm"><Users className="text-[#4CAF6A]"/><p className="mt-2 font-extrabold">가족 건강 루틴</p><p className="mt-1 text-xs text-gray-500">함께 기록하고 응원하기</p></Link></div>
        </section>

        <section className="px-4 pt-6">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xl font-extrabold text-[#1F2937]"><Target className="text-[#4CAF6A]" />건강이의 오늘 미션</h3><Link href="/notifications" className="flex items-center gap-1 text-sm font-bold text-gray-500"><Bell size={16} />알림 설정</Link></div>
          <div className="space-y-3">{[
            { title: "점심 식사 기록하기", desc: "메뉴와 채소 포함 여부를 가볍게 남겨보세요.", reward: "5P", href: "/meals/new", icon: "🍽️" },
            { title: "목표 걸음 수 채우기", desc: dailyLog.steps >= 7000 ? "오늘의 걷기 목표를 달성했어요!" : `${(7000 - dailyLog.steps).toLocaleString()}보만 더 걸으면 목표 달성이에요.`, reward: "20P", href: "/habits", icon: "👟" },
            { title: "물 2잔 더 마시기", desc: dailyLog.waterCups >= 6 ? "오늘의 수분 목표를 달성했어요!" : "오늘 수분 목표까지 조금 남았어요.", reward: "10P", href: "/habits", icon: "💧" },
          ].map((mission) => <article key={mission.title} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-2xl">{mission.icon}</span><div className="min-w-0 flex-1"><p className="font-extrabold text-[#1F2937]">{mission.title}</p><p className="mt-0.5 text-xs leading-relaxed text-gray-500">{mission.desc}</p><p className="mt-1 text-xs font-bold text-[#4CAF6A]">보상: 헬스포인트 {mission.reward}</p></div><Link href={mission.href} aria-label={`${mission.title} 바로 실행하기`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4CAF6A] text-white"><ChevronRight /></Link></article>)}</div>
        </section>

        <section className="px-4 py-6">
          <h3 className="mb-4 text-xl font-extrabold text-[#1F2937]">오늘의 건강 요약</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {summaryItems.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="min-w-[112px] rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
                <Icon size={23} className={`mx-auto mb-2 ${color}`} /><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-extrabold text-[#1F2937]">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-[#1F5A3A]">예상 섭취 칼로리: {mealCalories.toLocaleString()} kcal</p>
        </section>

        <section id="today-final-coaching" className="scroll-mt-20 px-4 pb-5">
          <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-[#EAF7EF] to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1 text-xs font-black text-[#4CAF6A]">
                  <Sparkles size={15} />
                  하루 1회 AI 코칭
                </p>
                <h3 className="mt-1 text-lg font-black text-[#1F2937]">오늘의 최종 코칭</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  밤 9시 이후, 오늘 입력한 습관 기록을 종합해서 코치가 하루 마무리 조언을 남겨요.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#1F5A3A]">21:00 이후</span>
            </div>

            {finalCoachingText ? (
              <div className="mt-4 rounded-2xl bg-white/82 p-4 shadow-sm ring-1 ring-green-100">
                <p className="text-sm font-bold leading-6 text-[#173425]">{finalCoachingText}</p>
                <p className="mt-3 border-t border-green-100 pt-3 text-xs font-bold leading-5 text-gray-500">{finalCoachingDisclaimer}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-white/72 p-4 ring-1 ring-green-100">
                <p className="text-sm font-bold leading-6 text-[#1F5A3A]">
                  오늘의 걸음, 수면, 수분, 식사 기록을 모아 조금 더 긴 AI 코칭으로 정리해드릴게요. 하루를 마감할 때 한 번만 생성돼요.
                </p>
              </div>
            )}

            {finalCoachingError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-500">{finalCoachingError}</p>}

            <button
              type="button"
              onClick={handleCreateFinalCoaching}
              disabled={Boolean(finalCoachingText) || finalCoachingLoading || !canCreateFinalCoaching || !hasTodayRecord}
              className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
                finalCoachingText
                  ? "bg-[#DDF3E5] text-[#1F5A3A]"
                  : canCreateFinalCoaching && hasTodayRecord
                    ? "bg-[#4CAF6A] text-white shadow-sm active:scale-[0.98]"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {finalCoachingLoading && <Loader2 size={17} className="animate-spin" />}
              {finalCoachingText
                ? "오늘 최종 코칭 완료"
                : finalCoachingLoading
                  ? "코칭 생성 중..."
                  : !hasTodayRecord
                    ? "오늘 기록 후 생성 가능"
                    : canCreateFinalCoaching
                      ? "오늘의 최종 코칭 받기"
                      : "밤 9시 이후 생성 가능"}
            </button>
          </div>
        </section>

        <section className="px-4 pb-3"><CoachMessageCard title={`${selectedCoach.name}의 오늘 한마디`} message={coachMessage} style={user.avatarStyle} gender={avatarGender} imageUrl={selectedCoach.faceImageUrl || selectedCoach.imageUrl} /></section>
        <section className="px-4 pb-6"><Link href="/meals/new" className="block rounded-2xl border border-green-100 bg-[#EAF7EF] p-4"><p className="flex items-center gap-2 font-extrabold text-[#1F5A3A]"><Bell size={18} />{mealReminder.title}</p><p className="mt-1 text-sm text-gray-600">{mealReminder.message}</p></Link></section>
      </main>
      <HealthScoreSheet open={scoreSheetOpen} onClose={() => setScoreSheetOpen(false)} totalScore={score} dailyLog={dailyLog} meals={meals} />
      <BottomNav />
      <style jsx>{`
        @keyframes scoreShimmer {
          0%,
          18% {
            transform: translateX(0) rotate(12deg);
            opacity: 0;
          }
          42% {
            opacity: 0.55;
          }
          72%,
          100% {
            transform: translateX(360%) rotate(12deg);
            opacity: 0;
          }
        }
        @keyframes scoreHealthGlow {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(34, 197, 94, 0.28),
              0 0 22px rgba(74, 222, 128, 0.2),
              0 18px 34px rgba(31, 90, 58, 0.24);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(34, 197, 94, 0.42),
              0 0 34px rgba(74, 222, 128, 0.34),
              0 18px 34px rgba(31, 90, 58, 0.25);
          }
        }
        @keyframes scoreCompleteWave {
          0% {
            opacity: 0.55;
            transform: scale(0.94);
          }
          100% {
            opacity: 0;
            transform: scale(1.24);
          }
        }
        @keyframes scoreCelebrationGlow {
          0%,
          100% {
            filter: saturate(1.05) brightness(1);
          }
          35% {
            filter: saturate(1.35) brightness(1.08);
          }
          65% {
            filter: saturate(1.18) brightness(1.04);
          }
        }
        @keyframes scoreCelebrationWave {
          0% {
            opacity: 0.75;
            transform: scale(0.9);
          }
          55% {
            opacity: 0.35;
          }
          100% {
            opacity: 0;
            transform: scale(1.42);
          }
        }
        @keyframes scoreLeafParticle {
          0% {
            opacity: 0;
            transform: translateY(8px) rotate(-12deg) scale(0.72);
          }
          25% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) rotate(12deg) scale(0.95);
          }
        }
        @keyframes scoreSparkParticle {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.72);
          }
          30% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-18px) scale(1.05);
          }
        }
        .score-health-glow {
          animation: scoreHealthGlow 4.8s ease-in-out infinite;
        }
        .score-complete-wave {
          animation: scoreCompleteWave 1.8s ease-out 1;
        }
        .score-celebration-glow {
          animation: scoreHealthGlow 3.2s ease-in-out infinite, scoreCelebrationGlow 2.4s ease-in-out infinite;
        }
        .score-celebration-wave {
          animation: scoreCelebrationWave 2s ease-out infinite;
        }
        .score-leaf-particle {
          animation: scoreLeafParticle 2.4s ease-out 1;
          font-size: 15px;
        }
        .score-spark-particle {
          animation: scoreSparkParticle 2s ease-out 1;
          color: #bbf7d0;
          text-shadow: 0 0 9px rgba(74, 222, 128, 0.75);
          font-size: 15px;
        }
        .score-spark-delay {
          animation-delay: 0.35s;
        }
        .score-leaf-delay {
          animation-delay: 0.55s;
        }
        @media (prefers-reduced-motion: reduce) {
          .score-health-glow,
          .score-celebration-glow,
          .score-complete-wave,
          .score-celebration-wave,
          .score-leaf-particle,
          .score-spark-particle {
            animation: none !important;
          }
        }
      `}</style>
    </MobileShell>
  );
}
