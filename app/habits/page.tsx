"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import { sampleDailyLog } from "@/lib/sampleData";
import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import { Footprints, Moon, Droplets, UtensilsCrossed, Pill, Dumbbell, Heart, Smile } from "lucide-react";

export default function HabitsPage() {
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
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [todayMeals, setTodayMeals] = useState<MealAnalysis[]>([]);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setTodayMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []).filter((meal) => meal.mealDate === todayKey));
  }, []);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const handleSave = () => {
    const log: DailyLog = {
      ...form,
      id: `daily-${Date.now()}`,
      logDate: new Date().toISOString().split("T")[0],
    };
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    saveToStorage(STORAGE_KEYS.DAILY_LOGS, [...logs, log]);

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
  };

  const achievementRate = Math.round(
    (([
      form.steps >= 7000,
      form.sleepHours >= 7,
      form.waterCups >= 6,
      form.mealsCount >= 3,
      form.exerciseDone,
    ].filter(Boolean).length) / 5) * 100
  );

  return (
    <MobileShell>
      <AppHeader title="생활습관 기록" />
      <RewardToast
        message="오늘의 습관 기록 완료!"
        points={earnedPoints}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Date + Progress */}
        <div className="bg-gradient-to-br from-[#EAF7EF] to-white px-4 py-5 border-b border-gray-100">
          <p className="text-sm text-gray-500">{today}</p>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-lg font-bold text-[#1F2937]">오늘의 건강 기록</h2>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#4CAF6A]">{achievementRate}%</p>
              <p className="text-xs text-gray-400">달성률</p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4CAF6A] rounded-full transition-all duration-500"
              style={{ width: `${achievementRate}%` }}
            />
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold text-[#1F2937]">오늘의 건강 행동</h3><Link href="/meals/new" className="rounded-full bg-[#4CAF6A] px-3 py-2 text-xs font-bold text-white">식단 사진 기록</Link></div>
            <div className="mt-3 space-y-2">{[
              { label: "아침 식단 기록", done: todayMeals.some((meal) => meal.mealType === "breakfast"), reward: 5 },
              { label: "점심 식단 기록", done: todayMeals.some((meal) => meal.mealType === "lunch"), reward: 5 },
              { label: "저녁 식단 기록", done: todayMeals.some((meal) => meal.mealType === "dinner"), reward: 5 },
              { label: "물 6잔 이상", done: form.waterCups >= 6, reward: 10 },
              { label: "7,000보 걷기", done: form.steps >= 7000, reward: 20 },
              { label: "수면 7시간 이상", done: form.sleepHours >= 7, reward: 15 },
              { label: "운동 완료", done: form.exerciseDone, reward: 10 },
            ].map((action) => <div key={action.label} className="flex items-center gap-3 rounded-xl bg-[#F7FBF8] px-3 py-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${action.done ? "bg-[#4CAF6A] text-white" : "bg-gray-200 text-gray-400"}`}>{action.done ? "✓" : ""}</span><span className="flex-1 text-sm font-semibold text-[#1F2937]">{action.label}</span><span className="text-xs font-bold text-[#4CAF6A]">+{action.reward}P</span></div>)}</div>
          </section>
          {/* Steps */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Footprints size={18} className="text-[#4CAF6A]" />
              <p className="font-semibold text-[#1F2937]">걸음 수</p>
              <span className="ml-auto text-xs text-gray-400">목표: 7,000보</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={15000}
                step={100}
                value={form.steps}
                onChange={(e) => setForm((p) => ({ ...p, steps: parseInt(e.target.value) }))}
                className="flex-1 accent-[#4CAF6A]"
              />
              <input
                type="number"
                value={form.steps}
                onChange={(e) => setForm((p) => ({ ...p, steps: parseInt(e.target.value) || 0 }))}
                className="w-20 text-right font-bold text-[#1F2937] border border-gray-200 rounded-lg px-2 py-1 text-sm"
              />
            </div>
            {form.steps >= 7000 && <p className="text-xs text-[#4CAF6A] mt-1 font-medium">✓ 목표 달성! +20P</p>}
          </div>

          {/* Sleep */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Moon size={18} className="text-blue-400" />
              <p className="font-semibold text-[#1F2937]">수면 시간</p>
              <span className="ml-auto text-xs text-gray-400">목표: 7시간</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={form.sleepHours}
                onChange={(e) => setForm((p) => ({ ...p, sleepHours: parseFloat(e.target.value) }))}
                className="flex-1 accent-blue-400"
              />
              <span className="w-20 text-right font-bold text-[#1F2937] text-sm">{form.sleepHours}시간</span>
            </div>
            {form.sleepHours >= 7 && <p className="text-xs text-blue-500 mt-1 font-medium">✓ 목표 달성! +15P</p>}
          </div>

          {/* Water */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={18} className="text-cyan-500" />
              <p className="font-semibold text-[#1F2937]">물 마시기</p>
              <span className="ml-auto text-xs text-gray-400">목표: 6잔</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((p) => ({ ...p, waterCups: n }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    n <= form.waterCups
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {form.waterCups >= 6 && <p className="text-xs text-cyan-600 mt-2 font-medium">✓ 목표 달성! +10P</p>}
          </div>

          {/* Meals */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed size={18} className="text-orange-400" />
              <p className="font-semibold text-[#1F2937]">식사 횟수</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((p) => ({ ...p, mealsCount: n }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    form.mealsCount === n ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {n}끼
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            {[
              { key: "medicationTaken", icon: Pill, label: "약 복용", color: "text-purple-500" },
              { key: "exerciseDone", icon: Dumbbell, label: "운동 실천", color: "text-green-500" },
            ].map(({ key, icon: Icon, label, color }) => (
              <div
                key={key}
                className="flex items-center justify-between"
                onClick={() =>
                  setForm((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))
                }
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={color} />
                  <p className="font-medium text-[#1F2937]">{label}</p>
                </div>
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    form[key as keyof typeof form] ? "bg-[#4CAF6A]" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      form[key as keyof typeof form] ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Condition Score */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Smile size={18} className="text-yellow-400" />
              <p className="font-semibold text-[#1F2937]">오늘의 컨디션</p>
              <span className="ml-auto text-2xl font-extrabold text-[#4CAF6A]">{form.conditionScore}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={form.conditionScore}
              onChange={(e) => setForm((p) => ({ ...p, conditionScore: parseInt(e.target.value) }))}
              className="w-full accent-[#F7C948]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>매우 나쁨</span>
              <span>보통</span>
              <span>매우 좋음</span>
            </div>
          </div>

          {/* Memo */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="font-semibold text-[#1F2937] mb-2">메모</p>
            <textarea
              value={form.memo}
              onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
              placeholder="오늘의 건강 기록 메모를 남겨보세요..."
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#4CAF6A]"
            />
          </div>

          {/* Coach message */}
          <div className="bg-[#EAF7EF] rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <p className="text-sm text-[#1F5A3A]">
              {achievementRate >= 80
                ? "오늘 정말 잘 하고 계세요! 이 습관을 계속 유지해봐요."
                : achievementRate >= 60
                ? "좋은 흐름이에요. 조금만 더 실천해볼까요?"
                : "작은 것부터 시작해도 괜찮아요. 건강이가 응원해요!"}
            </p>
          </div>

          {/* Reward info */}
          <div className="bg-white rounded-2xl p-3 border border-[#4CAF6A]/30">
            <p className="text-xs text-gray-500 mb-1 font-semibold">오늘 획득 가능한 헬스포인트</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "기록 완료", pts: 10, done: false },
                { label: "물 6잔+", pts: 10, done: form.waterCups >= 6 },
                { label: "7,000보+", pts: 20, done: form.steps >= 7000 },
                { label: "수면 7h+", pts: 15, done: form.sleepHours >= 7 },
              ].map(({ label, pts, done }) => (
                <span key={label} className={`text-xs px-2 py-1 rounded-full font-medium ${done ? "bg-[#4CAF6A] text-white" : "bg-gray-100 text-gray-500"}`}>
                  {label} +{pts}P
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
              saved ? "bg-gray-200 text-gray-400" : "bg-[#4CAF6A] text-white shadow-lg active:scale-95"
            }`}
          >
            {saved ? "✓ 오늘의 습관 기록 완료!" : "저장하기"}
          </button>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
