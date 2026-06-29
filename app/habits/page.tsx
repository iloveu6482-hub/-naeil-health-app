"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import { getHealthDayKey } from "@/lib/healthDay";
import { sampleDailyLog } from "@/lib/sampleData";
import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import { CheckCircle2, ChevronRight, Droplets, Footprints, Moon, UtensilsCrossed } from "lucide-react";

type HabitType = "steps" | "sleep" | "water" | "meal" | "all";
type DailyFeedbackCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";

type DailyFeedbackResponse = {
  message: string;
};

const habitTabs: Array<{ type: HabitType; label: string }> = [
  { type: "steps", label: "걸음수" },
  { type: "sleep", label: "수면" },
  { type: "water", label: "수분" },
  { type: "meal", label: "식사" },
];

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

function resolveDailyFeedbackCoachId(coachId?: string | null): DailyFeedbackCoachId {
  if (coachId === "onyu" || coachId === "onyou") return "onyu";
  if (coachId === "haru") return "haru";
  if (coachId === "taeo" || coachId === "kangtaeo") return "kangtaeo";
  if (coachId === "rumi" || coachId === "lumi") return "rumi";
  return "haru";
}

function isDailyFeedbackResponse(value: unknown): value is DailyFeedbackResponse {
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).message === "string";
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

export default function HabitsPage() {
  const [activeType, setActiveType] = useState<HabitType>("all");
  const [form, setForm] = useState<Omit<DailyLog, "id" | "logDate">>({
    steps: sampleDailyLog.steps,
    sleepHours: sampleDailyLog.sleepHours,
    waterCups: sampleDailyLog.waterCups,
    mealsCount: sampleDailyLog.mealsCount,
    medicationTaken: sampleDailyLog.medicationTaken,
    exerciseDone: sampleDailyLog.exerciseDone,
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
    const latestLog = [...logs].reverse().find((log) => log.logDate === todayKey) || createEmptyDailyLog(todayKey);
    setForm({
      steps: latestLog.steps,
      sleepHours: latestLog.sleepHours,
      waterCups: latestLog.waterCups,
      mealsCount: latestLog.mealsCount,
      medicationTaken: latestLog.medicationTaken,
      exerciseDone: latestLog.exerciseDone,
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

  const visibleTypes = activeType === "all" ? habitTabs.map((tab) => tab.type) : [activeType];

  const updateSleepTimes = (nextBedTime: string, nextWakeTime: string) => {
    setSaved(false);
    setBedTime(nextBedTime);
    setWakeTime(nextWakeTime);
    setForm((prev) => ({ ...prev, sleepHours: calculateSleepHours(nextBedTime, nextWakeTime) }));
  };

  const handleSave = async () => {
    const todayKey = getHealthDayKey();
    const coachId = resolveDailyFeedbackCoachId(getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, "haru"));
    const log: DailyLog = {
      ...form,
      mealsCount: todayMealCount,
      id: `daily-${Date.now()}`,
      logDate: todayKey,
    };
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const nextLogs = [...logs.filter((item) => item.logDate !== todayKey), log];
    saveToStorage(STORAGE_KEYS.DAILY_LOGS, nextLogs);

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

    try {
      const response = await fetch("/api/daily-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          steps: log.steps,
          sleepHours: log.sleepHours,
          waterCups: log.waterCups,
          mealsCount: log.mealsCount,
          exerciseDone: log.exerciseDone,
          conditionScore: log.conditionScore,
        }),
      });
      const result = (await response.json()) as unknown;
      if (response.ok && isDailyFeedbackResponse(result)) {
        saveToStorage(STORAGE_KEYS.TODAY_COACH_MESSAGE, {
          message: result.message,
          date: todayKey,
          coachId,
        });
      }
    } catch (error) {
      console.error("Daily feedback save failed", error);
    }

    setSaved(true);
  };

  return (
    <MobileShell>
      <AppHeader title="생활습관 기록" showBack backHref="/dashboard" />
      <RewardToast message="오늘의 습관 기록 완료!" points={earnedPoints} visible={showToast} onHide={() => setShowToast(false)} />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <section className="border-b border-gray-100 bg-gradient-to-br from-[#EAF7EF] to-white px-4 py-5">
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className="mt-1 text-xl font-black text-[#1F2937]">
            {activeType === "steps" && "걸음수 입력"}
            {activeType === "sleep" && "수면시간 입력"}
            {activeType === "water" && "수분 입력"}
            {activeType === "meal" && "식사 기록"}
            {activeType === "all" && "오늘의 생활습관"}
          </h1>
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
        </section>

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
                식단 사진으로 자세히 기록하기
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
      </main>
      <BottomNav />
    </MobileShell>
  );
}
