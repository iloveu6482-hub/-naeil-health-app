"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import { getHealthDayKey } from "@/lib/healthDay";
import {
  calculateActivityScore,
  calculateMealScore,
  calculateSleepScore,
  calculateWaterScore,
} from "@/lib/lifestyleScore";
import { sampleDailyLog } from "@/lib/sampleData";
import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import {
  BarChart2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Dumbbell,
  Footprints,
  Moon,
  Target,
  UtensilsCrossed,
} from "lucide-react";

type HabitType = "steps" | "sleep" | "water" | "meal" | "all";
type SummaryRange = "week" | "month" | "all";

const habitTabs: Array<{ type: HabitType; label: string }> = [
  { type: "steps", label: "걸음수" },
  { type: "sleep", label: "수면" },
  { type: "water", label: "수분" },
  { type: "meal", label: "식사" },
];

const summaryRanges: Array<{ id: SummaryRange; label: string; days?: number }> = [
  { id: "week", label: "주간", days: 7 },
  { id: "month", label: "월간", days: 30 },
  { id: "all", label: "전체" },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

const exerciseOptions = ["걷기", "근력", "스트레칭", "자전거", "수영", "기타"];

function getRangeStart(days?: number) {
  if (!days) return "";
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return toDateKey(start);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function calculateLogScore(log: DailyLog) {
  return Math.min(
    110,
    calculateActivityScore(log.steps) +
      calculateSleepScore(log.sleepHours) +
      calculateWaterScore(log.waterCups) +
      calculateMealScore(log.mealsCount) +
      (log.exerciseDone ? 10 : 0)
  );
}

function compactLogsByDate(logs: DailyLog[]) {
  const map = new Map<string, DailyLog>();
  logs.forEach((log) => {
    const previous = map.get(log.logDate);
    if (!previous || log.id.localeCompare(previous.id) >= 0) {
      map.set(log.logDate, log);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.logDate.localeCompare(a.logDate));
}

function getScoreStatus(score: number) {
  if (score >= 80) return "아주 안정적이에요";
  if (score >= 60) return "좋은 흐름이에요";
  if (score >= 40) return "조금씩 회복 중이에요";
  return "다시 시작하면 좋아요";
}

function parseTimeToMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

function calculateSleepHours(bedTime: string, wakeTime: string) {
  const bedMinutes = parseTimeToMinutes(bedTime);
  let wakeMinutes = parseTimeToMinutes(wakeTime);

  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }

  return Math.round(((wakeMinutes - bedMinutes) / 60) * 10) / 10;
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
    exerciseTypes: [],
    conditionScore: 0,
    memo: "",
  };
}

export default function HabitsPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<HabitType>("all");
  const [summaryRange, setSummaryRange] = useState<SummaryRange>("week");
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [form, setForm] = useState<Omit<DailyLog, "id" | "logDate">>({
    steps: sampleDailyLog.steps,
    sleepHours: sampleDailyLog.sleepHours,
    waterCups: sampleDailyLog.waterCups,
    mealsCount: sampleDailyLog.mealsCount,
    medicationTaken: sampleDailyLog.medicationTaken,
    exerciseDone: sampleDailyLog.exerciseDone,
    exerciseTypes: sampleDailyLog.exerciseTypes || [],
    conditionScore: sampleDailyLog.conditionScore,
    memo: "",
  });
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [todayMeals, setTodayMeals] = useState<MealAnalysis[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") as HabitType | null;
    if (type && ["steps", "sleep", "water", "meal"].includes(type)) {
      setActiveType(type);
    }

    const todayKey = getHealthDayKey();
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    setDailyLogs(compactLogsByDate(logs));
    const latestLog = [...logs].reverse().find((log) => log.logDate === todayKey) || createEmptyDailyLog(todayKey);
    setForm({
      steps: latestLog.steps,
      sleepHours: latestLog.sleepHours,
      waterCups: latestLog.waterCups,
      mealsCount: latestLog.mealsCount,
      medicationTaken: latestLog.medicationTaken,
      exerciseDone: latestLog.exerciseDone,
      exerciseTypes: latestLog.exerciseTypes || [],
      conditionScore: latestLog.conditionScore,
      memo: latestLog.memo || "",
    });
    setTodayMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []).filter((meal) => meal.mealDate === todayKey));
  }, []);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const todayMealCount = useMemo(
    () => Math.max(form.mealsCount, todayMeals.filter((meal) => meal.mealType !== "snack").length),
    [form.mealsCount, todayMeals]
  );

  const isSummaryMode = activeType === "all";
  const visibleTypes = activeType === "all" ? habitTabs.map((tab) => tab.type) : [activeType];
  const summaryLogs = useMemo(() => {
    const range = summaryRanges.find((item) => item.id === summaryRange);
    const start = getRangeStart(range?.days);
    return dailyLogs
      .filter((log) => !start || log.logDate >= start)
      .sort((a, b) => b.logDate.localeCompare(a.logDate));
  }, [dailyLogs, summaryRange]);
  const summary = useMemo(() => {
    const scores = summaryLogs.map(calculateLogScore);
    const averageScore = Math.round(average(scores));
    const averageSteps = Math.round(average(summaryLogs.map((log) => log.steps)));
    const averageSleep = average(summaryLogs.map((log) => log.sleepHours));
    const averageWater = average(summaryLogs.map((log) => log.waterCups));
    const averageMeals = average(summaryLogs.map((log) => log.mealsCount));
    const activityRatio = average(summaryLogs.map((log) => calculateActivityScore(log.steps) / 35));
    const sleepRatio = average(summaryLogs.map((log) => calculateSleepScore(log.sleepHours) / 25));
    const waterRatio = average(summaryLogs.map((log) => calculateWaterScore(log.waterCups) / 15));
    const mealRatio = average(summaryLogs.map((log) => calculateMealScore(log.mealsCount) / 25));
    const ratios = [
      { label: "걸음", value: activityRatio, guide: "식후 10~20분 걷기를 먼저 잡아보세요." },
      { label: "수면", value: sleepRatio, guide: "취침·기상 시간을 일정하게 맞추는 게 우선이에요." },
      { label: "수분", value: waterRatio, guide: "오전 2잔, 오후 3잔처럼 나눠 마셔보세요." },
      { label: "식사", value: mealRatio, guide: "하루 3회 식사 리듬을 안정적으로 맞춰보세요." },
    ].sort((a, b) => a.value - b.value);

    return {
      averageScore,
      averageSteps,
      averageSleep,
      averageWater,
      averageMeals,
      activityPercent: Math.round(activityRatio * 100),
      sleepPercent: Math.round(sleepRatio * 100),
      waterPercent: Math.round(waterRatio * 100),
      mealPercent: Math.round(mealRatio * 100),
      best: ratios[ratios.length - 1],
      worst: ratios[0],
    };
  }, [summaryLogs]);

  const updateSleepTimes = (nextBedTime: string, nextWakeTime: string) => {
    setSaved(false);
    setBedTime(nextBedTime);
    setWakeTime(nextWakeTime);
    setForm((prev) => ({ ...prev, sleepHours: calculateSleepHours(nextBedTime, nextWakeTime) }));
  };

  const handleSave = async () => {
    const todayKey = getHealthDayKey();
    const log: DailyLog = {
      ...form,
      mealsCount: todayMealCount,
      id: `daily-${Date.now()}`,
      logDate: todayKey,
    };
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const nextLogs = [...logs.filter((item) => item.logDate !== todayKey), log];
    saveToStorage(STORAGE_KEYS.DAILY_LOGS, nextLogs);
    setDailyLogs(compactLogsByDate(nextLogs));

    let totalPoints = 0;
    const txs = getFromStorage(STORAGE_KEYS.POINT_TRANSACTIONS, []);

    if (!hasEarnedTodayForReason(txs, "생활습관 기록 완료")) {
      addPointTransaction(createEarnTransaction("user-001", 10, "생활습관 기록 완료"));
      totalPoints += 10;
    }
    if (form.waterCups >= 6 && !hasEarnedTodayForReason(txs, "물 6잔 이상 달성")) {
      addPointTransaction(createEarnTransaction("user-001", 10, "물 6잔 이상 달성"));
      totalPoints += 10;
    }
    if (form.steps >= 7000 && !hasEarnedTodayForReason(txs, "7,000보 이상 걷기 달성")) {
      addPointTransaction(createEarnTransaction("user-001", 20, "7,000보 이상 걷기 달성"));
      totalPoints += 20;
    }
    if (form.sleepHours >= 7 && !hasEarnedTodayForReason(txs, "수면 7시간 이상 기록")) {
      addPointTransaction(createEarnTransaction("user-001", 15, "수면 7시간 이상 기록"));
      totalPoints += 15;
    }

    if (totalPoints > 0) {
      window.dispatchEvent(new Event("pointsUpdated"));
      setEarnedPoints(totalPoints);
      setShowToast(true);
    }

    setSaved(true);
    if (activeType !== "all") {
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 450);
    }
  };

  return (
    <MobileShell>
      <AppHeader title={isSummaryMode ? "생활습관 요약" : "생활습관 기록"} showBack backHref="/dashboard" />
      <RewardToast message="오늘의 습관 기록 완료!" points={earnedPoints} visible={showToast} onHide={() => setShowToast(false)} />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <section className={`border-b border-gray-100 bg-gradient-to-br from-[#EAF7EF] to-white px-4 ${isSummaryMode ? "py-3" : "py-5"}`}>
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className={`${isSummaryMode ? "mt-0.5 text-lg" : "mt-1 text-xl"} font-black text-[#1F2937]`}>
            {activeType === "steps" && "걸음수 입력"}
            {activeType === "sleep" && "수면시간 입력"}
            {activeType === "water" && "수분 입력"}
            {activeType === "meal" && "식사 기록"}
            {activeType === "all" && "내 습관 기록 요약"}
          </h1>
          {isSummaryMode ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
              홈에서 입력한 습관 기록을 기간별로 모아 현재 흐름과 다음 코칭 방향을 확인해요.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {habitTabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => {
                    setActiveType(tab.type);
                    setSaved(false);
                  }}
                  className={`min-h-10 rounded-xl text-sm font-bold transition ${activeType === tab.type ? "bg-[#4CAF6A] text-white shadow-sm" : "bg-white text-gray-500 ring-1 ring-gray-100"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {isSummaryMode ? (
          <div className="flex flex-col gap-3 px-3 py-3">
            <section className="grid grid-cols-3 gap-2 rounded-2xl border border-green-100 bg-white p-1.5 shadow-sm">
              {summaryRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setSummaryRange(range.id)}
                  className={`min-h-10 rounded-2xl text-sm font-black transition ${
                    summaryRange === range.id ? "bg-[#4CAF6A] text-white shadow-sm" : "bg-[#F7FBF8] text-gray-500"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </section>

            <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-4 text-white shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1 text-sm font-bold text-green-100">
                    <CalendarDays size={16} />
                    기록 {summaryLogs.length}일
                  </p>
                  <h2 className="mt-1 text-lg font-black">현재 습관 상태</h2>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-2.5 text-center">
                  <p className="text-xs text-green-100">평균 점수</p>
                  <p className="text-2xl font-black">{summary.averageScore}</p>
                </div>
              </div>
              <p className="mt-3 rounded-2xl bg-white/14 px-3 py-2.5 text-sm font-bold leading-relaxed">
                {summaryLogs.length > 0
                  ? `${getScoreStatus(summary.averageScore)} 가장 좋은 흐름은 ${summary.best?.label || "기록"}이고, 다음 코칭은 ${summary.worst?.label || "습관"}을 중심으로 잡으면 좋아요.`
                  : "아직 요약할 습관 기록이 없어요. 홈에서 걸음수, 수면, 수분, 식사를 먼저 기록해보세요."}
              </p>
            </section>

            <section className="grid grid-cols-2 gap-2.5">
              {[
                { label: "평균 걸음", value: `${summary.averageSteps.toLocaleString()}보`, icon: Footprints, color: "text-[#24944E]" },
                { label: "평균 수면", value: `${summary.averageSleep}시간`, icon: Moon, color: "text-[#4E66B1]" },
                { label: "평균 수분", value: `${summary.averageWater}잔`, icon: Droplets, color: "text-[#27A9D6]" },
                { label: "평균 식사", value: `${summary.averageMeals}회`, icon: UtensilsCrossed, color: "text-[#E58A2B]" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={color} size={20} />
                    <p className="text-xs font-bold text-gray-500">{label}</p>
                  </div>
                  <p className="mt-2 text-lg font-black text-[#1F2937]">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-black text-[#1F2937]">
                <BarChart2 className="text-[#4CAF6A]" size={18} />
                항목별 흐름
              </h2>
              <div className="mt-3 space-y-2.5">
                {[
                  { label: "걸음", value: summary.activityPercent },
                  { label: "수면", value: summary.sleepPercent },
                  { label: "수분", value: summary.waterPercent },
                  { label: "식사", value: summary.mealPercent },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm font-bold">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="text-[#1F5A3A]">{item.value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-[#4CAF6A] transition-all" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-green-100 bg-[#EAF7EF] p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-black text-[#1F2937]">
                <Target className="text-[#4CAF6A]" size={18} />
                앞으로의 코치 방향
              </h2>
              <p className="mt-2 rounded-2xl bg-white/80 px-3 py-2.5 text-sm font-bold leading-relaxed text-[#1F5A3A]">
                {summaryLogs.length > 0
                  ? summary.worst?.guide
                  : "먼저 오늘 기록을 1개 이상 남기면 코치가 어떤 습관부터 잡으면 좋을지 정리해드릴게요."}
              </p>
              <Link
                href="/weekly-report"
                className="mt-2 flex min-h-10 items-center justify-between rounded-2xl bg-white px-4 text-sm font-extrabold text-[#1F5A3A]"
              >
                리포트에서 더 자세히 보기
                <ChevronRight size={18} />
              </Link>
            </section>

            <Link
              href="/habits/history"
              className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div>
                <h2 className="flex items-center gap-2 text-base font-black text-[#1F2937]">
                  <CalendarDays className="text-[#4CAF6A]" size={18} />
                  기록 조회
                </h2>
                <p className="mt-1 text-xs font-bold leading-relaxed text-gray-500">
                  기간을 정해서 누적된 습관 기록을 따로 확인해요.
                </p>
              </div>
              <ChevronRight className="text-gray-400" size={22} />
            </Link>
          </div>
        ) : (
        <div className="flex flex-col gap-3 px-4 py-4">
          {visibleTypes.includes("steps") && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Footprints className="text-[#4CAF6A]" size={22} />
                <div>
                  <h2 className="font-black text-[#1F2937]">걸음수</h2>
                  <p className="text-xs text-gray-500">오늘 걸은 걸음수만 입력해요.</p>
                </div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.steps}
                onChange={(event) => {
                  setSaved(false);
                  setForm((prev) => ({ ...prev, steps: Number(event.target.value) || 0 }));
                }}
                className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-right text-3xl font-black text-[#1F2937] outline-none focus:border-[#4CAF6A]"
              />
              <div className="mt-4 rounded-2xl bg-[#F7FBF8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="text-[#4CAF6A]" size={18} />
                    <div>
                      <p className="text-sm font-black text-[#1F2937]">추가 운동</p>
                      <p className="text-xs font-bold text-gray-500">걷기 외 운동을 했다면 +10점</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSaved(false);
                      setForm((prev) => ({
                        ...prev,
                        exerciseDone: !prev.exerciseDone,
                        exerciseTypes: prev.exerciseDone ? [] : prev.exerciseTypes || [],
                      }));
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      form.exerciseDone ? "bg-[#4CAF6A] text-white shadow-sm" : "bg-white text-gray-500 ring-1 ring-gray-200"
                    }`}
                  >
                    {form.exerciseDone ? "운동함" : "없음"}
                  </button>
                </div>

                {form.exerciseDone && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {exerciseOptions.map((exerciseType) => {
                      const selected = form.exerciseTypes?.includes(exerciseType) || false;

                      return (
                        <button
                          key={exerciseType}
                          type="button"
                          onClick={() => {
                            setSaved(false);
                            setForm((prev) => {
                              const currentTypes = prev.exerciseTypes || [];
                              const nextTypes = selected
                                ? currentTypes.filter((item) => item !== exerciseType)
                                : [...currentTypes, exerciseType];

                              return {
                                ...prev,
                                exerciseDone: nextTypes.length > 0,
                                exerciseTypes: nextTypes,
                              };
                            });
                          }}
                          className={`min-h-9 rounded-xl text-xs font-black transition ${
                            selected ? "bg-[#DFF4E7] text-[#1F5A3A] ring-1 ring-[#4CAF6A]" : "bg-white text-gray-500 ring-1 ring-gray-100"
                          }`}
                        >
                          {exerciseType}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="mt-2 text-right text-sm font-bold text-[#4CAF6A]">목표 7,000보</p>
            </section>
          )}

          {visibleTypes.includes("sleep") && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Moon className="text-[#4E66B1]" size={22} />
                <div>
                  <h2 className="font-black text-[#1F2937]">수면시간</h2>
                  <p className="text-xs text-gray-500">취침 시간과 기상 시간을 체크하면 자동 계산돼요.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl bg-[#F7FBF8] p-3">
                  <span className="text-xs font-bold text-gray-500">취침</span>
                  <input type="time" value={bedTime} onChange={(event) => updateSleepTimes(event.target.value, wakeTime)} className="mt-2 w-full bg-transparent text-lg font-black text-[#1F2937] outline-none" />
                </label>
                <label className="rounded-2xl bg-[#F7FBF8] p-3">
                  <span className="text-xs font-bold text-gray-500">기상</span>
                  <input type="time" value={wakeTime} onChange={(event) => updateSleepTimes(bedTime, event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black text-[#1F2937] outline-none" />
                </label>
              </div>
              <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-center">
                <p className="text-xs font-bold text-blue-500">자동 계산된 수면</p>
                <p className="mt-1 text-3xl font-black text-[#4E66B1]">{form.sleepHours}시간</p>
              </div>
            </section>
          )}

          {visibleTypes.includes("water") && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Droplets className="text-[#27A9D6]" size={22} />
                <div>
                  <h2 className="font-black text-[#1F2937]">수분</h2>
                  <p className="text-xs text-gray-500">오늘 물을 몇 잔 마셨는지만 선택해요.</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((cup) => (
                  <button
                    key={cup}
                    onClick={() => {
                      setSaved(false);
                      setForm((prev) => ({ ...prev, waterCups: cup }));
                    }}
                    className={`min-h-12 rounded-2xl text-sm font-black transition ${cup <= form.waterCups ? "bg-cyan-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}
                  >
                    {cup}잔
                  </button>
                ))}
              </div>
            </section>
          )}

          {visibleTypes.includes("meal") && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UtensilsCrossed className="text-[#E58A2B]" size={22} />
                <div>
                  <h2 className="font-black text-[#1F2937]">식사</h2>
                  <p className="text-xs text-gray-500">오늘 챙긴 식사 횟수를 박스로 기록해요.</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setSaved(false);
                      setForm((prev) => ({ ...prev, mealsCount: count }));
                    }}
                    className={`min-h-12 rounded-2xl text-sm font-black transition ${todayMealCount === count ? "bg-orange-400 text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}
                  >
                    {count}회
                  </button>
                ))}
              </div>
              <Link href="/meals/new" className="mt-3 flex min-h-12 items-center justify-between rounded-2xl bg-[#FFF6E9] px-4 text-sm font-extrabold text-[#B96B13]">
                메뉴 선택으로 식사 기록하기
                <ChevronRight size={18} />
              </Link>
            </section>
          )}

          <section className="rounded-2xl bg-[#EAF7EF] p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#1F5A3A]">
              <CheckCircle2 size={18} />
              저장하면 오늘 기록에 반영돼요
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">같은 날짜 기록은 최신 입력값으로 업데이트됩니다.</p>
          </section>

          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full rounded-2xl py-4 text-lg font-bold transition-all ${saved ? "bg-gray-200 text-gray-400" : "bg-[#4CAF6A] text-white shadow-lg active:scale-95"}`}
          >
            {saved ? "오늘 기록 저장 완료" : "저장하기"}
          </button>
        </div>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
