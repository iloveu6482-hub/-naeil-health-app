"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProgressRing from "@/components/common/ProgressRing";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculatePointBalance } from "@/lib/rewards";
import { sampleDailyLog } from "@/lib/sampleData";
import type { DailyLog } from "@/types/health";
import type { PointTransaction } from "@/types/reward";
import type { MealAnalysis } from "@/types/meal";
import { Footprints, Moon, Droplets, Dumbbell, Trophy, Sprout, TrendingUp, UtensilsCrossed, ChevronRight } from "lucide-react";

export default function WeeklyReportPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [mealCount, setMealCount] = useState(0);

  useEffect(() => {
    const savedLogs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, [sampleDailyLog]);
    setLogs(savedLogs.length > 0 ? savedLogs : [sampleDailyLog]);

    const txs = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekTxs = txs.filter(
      (tx) => tx.type === "earn" && new Date(tx.createdAt) >= oneWeekAgo
    );
    setWeeklyPoints(weekTxs.reduce((s, t) => s + t.amount, 0));
    const meals = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    setMealCount(meals.filter((meal) => new Date(meal.createdAt) >= oneWeekAgo).length);
  }, []);

  const avgSteps = Math.round(logs.reduce((s, l) => s + l.steps, 0) / logs.length);
  const avgSleep = (logs.reduce((s, l) => s + l.sleepHours, 0) / logs.length).toFixed(1);
  const waterDays = logs.filter((l) => l.waterCups >= 6).length;
  const exerciseDays = logs.filter((l) => l.exerciseDone).length;
  const avgCondition = Math.round(logs.reduce((s, l) => s + l.conditionScore, 0) / logs.length);

  const weeklyScore = Math.round(
    ((avgSteps >= 7000 ? 25 : (avgSteps / 7000) * 25) +
      (parseFloat(avgSleep) >= 7 ? 25 : (parseFloat(avgSleep) / 7) * 25) +
      (waterDays / 7) * 25 +
      (exerciseDays / 7) * 25)
  );

  const bestHabit =
    avgSteps >= 7000
      ? "걷기"
      : parseFloat(avgSleep) >= 7
      ? "수면"
      : waterDays >= 5
      ? "수분 섭취"
      : "꾸준한 기록";

  const improveHabit =
    avgSteps < 7000
      ? "걷기 활동 늘리기"
      : parseFloat(avgSleep) < 7
      ? "수면 시간 확보"
      : waterDays < 5
      ? "물 마시기 습관"
      : "지속적인 실천";

  const nextMissions = [
    "매일 식후 10분 걷기 실천",
    "취침 전 스마트폰 줄이기",
    "아침 물 한 잔으로 하루 시작",
  ];

  return (
    <MobileShell>
      <AppHeader title="주간 리포트" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 py-8 text-white text-center">
          <p className="text-green-100 text-sm mb-2">이번 주 건강관리 점수</p>
          <div className="flex justify-center mb-3">
            <ProgressRing
              value={weeklyScore}
              size={100}
              strokeWidth={10}
              color="rgba(255,255,255,0.9)"
              label={`${weeklyScore}`}
            />
          </div>
          <p className="text-lg font-bold">
            {weeklyScore >= 80 ? "훌륭한 한 주였어요! 🏆" : weeklyScore >= 60 ? "잘 하고 있어요! 👍" : "다음 주엔 더 잘할 수 있어요! 💪"}
          </p>
          <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 flex items-center justify-center gap-2">
            <Sprout size={16} className="text-green-200" />
            <span className="text-sm font-bold">이번 주 획득: {weeklyPoints} 헬스포인트</span>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Stats Grid */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#1F2937] mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#4CAF6A]" />
              주간 통계
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Footprints size={18} className="text-[#4CAF6A]" />, label: "평균 걸음", value: `${avgSteps.toLocaleString()}보`, good: avgSteps >= 7000 },
                { icon: <Moon size={18} className="text-blue-400" />, label: "평균 수면", value: `${avgSleep}시간`, good: parseFloat(avgSleep) >= 7 },
                { icon: <Droplets size={18} className="text-cyan-500" />, label: "물 6잔+ 달성", value: `${waterDays}일`, good: waterDays >= 5 },
                { icon: <Dumbbell size={18} className="text-purple-500" />, label: "운동 실천", value: `${exerciseDays}일`, good: exerciseDays >= 4 },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-xl ${item.good ? "bg-[#EAF7EF]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.icon}
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <p className={`text-lg font-extrabold ${item.good ? "text-[#1F5A3A]" : "text-gray-600"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Best & Improve */}
          <Link href="/meals/report" className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7EF] text-[#4CAF6A]"><UtensilsCrossed /></span>
            <div className="flex-1"><p className="font-extrabold text-[#1F2937]">주간 식단 리포트</p><p className="mt-1 text-sm text-gray-500">이번 주 식단 사진 {mealCount}회 기록</p></div><ChevronRight className="text-gray-400" />
          </Link>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="bg-[#EAF7EF] rounded-xl p-3">
              <p className="text-xs text-[#4CAF6A] font-semibold mb-1">✨ 가장 잘한 습관</p>
              <p className="font-bold text-[#1F2937]">{bestHabit}</p>
              <p className="text-sm text-gray-500 mt-0.5">이 습관을 계속 유지해보세요!</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-500 font-semibold mb-1">📈 개선이 필요한 습관</p>
              <p className="font-bold text-[#1F2937]">{improveHabit}</p>
              <p className="text-sm text-gray-500 mt-0.5">작은 변화부터 시작해보세요</p>
            </div>
          </div>

          {/* Next Week Mission */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-[#F7C948]" />
              <h3 className="font-bold text-[#1F2937]">다음 주 추천 미션</h3>
            </div>
            {nextMissions.map((m, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                <div className="w-6 h-6 bg-[#4CAF6A] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-700">{m}</p>
              </div>
            ))}
          </div>

          {/* Coach Message */}
          <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <p className="text-xs font-semibold text-[#4CAF6A] mb-1">건강이의 주간 코칭</p>
              <p className="text-sm text-[#1F2937] leading-relaxed">
                이번 한 주도 건강 관리에 노력해주셔서 감사해요. 꾸준한 실천이 내일의 건강을 만들어요. 다음 주도 함께 작은 습관부터 실천해봐요! 💪
              </p>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
