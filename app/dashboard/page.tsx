"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Camera, CheckCircle2, ChevronRight, Droplets, FileText, Flame, Footprints, HeartPulse, Moon, Settings, Shirt, Sprout, Target, Utensils, Users, TrendingUp, Volume2 } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import HealthScoreSheet from "@/components/dashboard/HealthScoreSheet";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateLifestyleScore } from "@/lib/lifestyleScore";
import { calculateWalkingCalories } from "@/lib/activity";
import { calculatePointBalance } from "@/lib/rewards";
import { getCustomAvatarSource, getHeaderAvatarSource } from "@/lib/avatarProfile";
import { defaultAiCoach, getAiCoachById } from "@/lib/coachData";
import { sampleUser, sampleCheckup, sampleDailyLog } from "@/lib/sampleData";
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

const quickMenus = [
  { href: "/avatar", icon: Camera, label: "내 사진·아바타\n변경" },
  { href: "/avatar-shop", icon: Shirt, label: "아바타\n꾸미기" },
  { href: "/meals", icon: Utensils, label: "식단 사진\n기록" },
  { href: "/report", icon: FileText, label: "건강\n리포트" },
];

type ScoreStatus = "low" | "medium" | "high";

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
  const [scoreSheetOpen, setScoreSheetOpen] = useState(false);

  useEffect(() => {
    const savedUser = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const savedCheckup = getFromStorage<HealthCheckup>(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const latestLog = logs[logs.length - 1] || sampleDailyLog;
    setUser(savedUser);
    setCheckup(savedCheckup);
    const savedMeals = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    setDailyLog(latestLog);
    setScore(calculateLifestyleScore(latestLog, savedMeals));
    setMeals(savedMeals);
    setAvatarViewMode(getFromStorage<AvatarViewMode>(STORAGE_KEYS.AVATAR_VIEW_MODE, "portrait"));
    setSelectedCoach(getAiCoachById(getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, defaultAiCoach.id)));

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

  const handleCoachMessageClick = () => {
    console.log("코치 음성 안내는 추후 제공될 예정입니다.");
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
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter((meal) => meal.mealDate === today);
  const mealCalories = todayMeals.reduce((sum, meal) => sum + meal.estimatedCalories, 0);
  const scoreStatus = getScoreStatus(score);
  const coachMessage = scoreCoachMessages[scoreStatus];
  const selectedCoachMessage = useMemo(() => {
    const coachId = resolveCoachMessageId(selectedCoach);
    return getRandomCoachMessage(coachId);
  }, [selectedCoach]);
  const statusVideoUrl = `/avatars/status/avatar_${scoreStatus}.mp4`;
  const activeStatusVideoUrl = avatarViewMode === "fullbody" ? statusVideoUrl : undefined;
  const scoreCircleEffect =
    scoreStatus === "high"
      ? "border-[#E9D37A]/90 bg-white/64 shadow-[0_0_0_1px_rgba(76,175,106,0.22),0_0_36px_rgba(233,211,122,0.42),0_18px_34px_rgba(31,90,58,0.26)] ring-[#E9D37A]/65"
      : scoreStatus === "medium"
        ? "border-white/75 bg-white/60 shadow-[0_0_26px_rgba(109,220,177,0.32),0_14px_30px_rgba(31,90,58,0.22)] ring-[#9BE7C5]/55"
        : "border-white/70 bg-white/58 shadow-[0_14px_30px_rgba(31,90,58,0.24)] ring-[#4CAF6A]/55";
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
        <section className="relative min-h-[760px] overflow-hidden bg-[#1F5A3A] [@media(max-height:700px)]:min-h-[700px]">
          <div className="absolute inset-0"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode={avatarViewMode} mood={dailyLog.steps >= 7000 ? "happy" : "idle"} customImageUrl={customAvatarImage} statusVideoUrl={activeStatusVideoUrl} fill cover priority showWindEffect showLeaves showLightTrails alt={`${displayName}님의 마이 아바타`} /></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/55 to-transparent" />

          <div className="absolute left-2 right-2 top-2 z-30 flex items-start gap-2">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#EAF7EF] shadow-md ring-1 ring-[#BDE8CA]">
              <Image src={selectedCoach.faceImageUrl || selectedCoach.imageUrl} alt={`${selectedCoach.name} 코치`} fill className="object-cover" />
            </div>
            <button type="button" onClick={handleCoachMessageClick} aria-label="코치 음성 안내 준비중" title="코치 음성 안내 준비중" className="relative flex-1 rounded-2xl border border-[#BDE8CA] bg-white/92 px-3.5 py-2 text-left shadow-[0_10px_24px_rgba(31,90,58,0.16)] backdrop-blur-md transition duration-150 hover:bg-white/95 active:scale-[0.98] active:bg-white before:absolute before:left-[-6px] before:top-3.5 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-[#BDE8CA] before:bg-white/92">
              <span className="flex items-start gap-2">
                <span className="flex-1 text-sm font-medium leading-5 text-[#173425]">{selectedCoachMessage.message.text}</span>
                <Volume2 size={15} className="mt-0.5 shrink-0 text-[#4CAF6A]/55" aria-hidden="true" />
              </span>
            </button>
          </div>

          <div className="absolute inset-0 z-20">
            <div className="absolute left-3 top-[390px] space-y-1.5 [@media(max-height:700px)]:top-[326px]">
              {dashboardMetricItems.map(({ icon: Icon, label, value, color, achieved, href }) => {
                const metricClassName = `relative block h-14 w-[142px] rounded-[18px] border px-3 shadow-[0_12px_30px_rgba(10,66,40,0.18)] backdrop-blur-[9px] ${href ? "transition active:scale-[0.98]" : ""} ${achieved ? "border-[#BDE8CA] bg-[#EAF7EF]/62 ring-1 ring-[#9BE7C5]/60" : "border-white/65 bg-white/38"}`;
                const metricContent = (
                  <>
                    {achieved && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#4CAF6A] text-white"><CheckCircle2 size={11} /></span>}
                    <div className="flex h-full items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70"><Icon size={20} className={color} /></span><div><p className="whitespace-nowrap text-[11px] font-semibold text-[#1F2937]/70">{label}</p><p className="whitespace-nowrap text-base font-black leading-5 text-[#102D20]">{value}</p></div></div>
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

            <div className="absolute left-3 top-[330px] flex h-16 w-[142px] flex-col justify-center rounded-xl rounded-bl-sm border border-white/65 bg-white/48 px-3 shadow-[0_8px_20px_rgba(31,90,58,0.13)] backdrop-blur-[9px] [@media(max-height:700px)]:top-[270px]">
              <p className="text-xs font-bold text-[#16743B]">🌿 건강한 습관이</p><p className="mt-0.5 whitespace-nowrap text-[13px] font-extrabold text-[#163D29]">내일의 나를 만듭니다!</p>
            </div>

            <button type="button" onClick={() => setScoreSheetOpen(true)} className={`absolute left-3 top-[158px] flex h-36 w-36 flex-col items-center justify-center overflow-hidden rounded-full border-[5px] text-center ring-2 backdrop-blur-[10px] transition active:scale-95 [@media(max-height:700px)]:top-[124px] ${scoreCircleEffect}`} aria-label="오늘 내 점수 분석 열기">
              {scoreStatus === "high" && <span className="pointer-events-none absolute inset-y-[-20%] left-[-70%] w-12 rotate-12 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-sm animate-[scoreShimmer_4.5s_ease-in-out_infinite]" />}
              <p className="relative text-xs font-semibold text-gray-500">오늘의 건강관리</p><p className="relative text-xs text-gray-500">참고 점수</p><p className="relative mt-1 text-5xl font-black leading-none text-[#24944E]">{score}</p><p className="relative text-sm text-[#4CAF6A]">/ 100</p>
            </button>
          </div>
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
            { title: "점심 식단 기록하기", desc: "사진 한 장으로 예상 칼로리를 확인해보세요.", reward: "5P", href: "/meals/new", icon: "🍽️" },
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

        <section className="px-4 pb-3"><CoachMessageCard title={`${selectedCoach.name}의 오늘 한마디`} message={coachMessage} style={user.avatarStyle} gender={avatarGender} imageUrl={selectedCoach.faceImageUrl || selectedCoach.imageUrl} /></section>
        <section className="px-4 pb-6"><Link href="/notifications" className="block rounded-2xl border border-green-100 bg-[#EAF7EF] p-4"><p className="flex items-center gap-2 font-extrabold text-[#1F5A3A]"><Bell size={18} />점심시간이에요</p><p className="mt-1 text-sm text-gray-600">식사 전 사진 한 장으로 오늘의 식단을 기록해보세요.</p></Link></section>
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
      `}</style>
    </MobileShell>
  );
}
