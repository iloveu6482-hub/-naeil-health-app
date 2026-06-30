"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Leaf,
  Sparkles,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getMealTypeLabel } from "@/lib/mealAnalysis";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import type { MealAnalysis, MealType } from "@/types/meal";

export default function MealReportPage() {
  const [meals, setMeals] = useState<MealAnalysis[]>([]);

  useEffect(
    () => setMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, [])),
    []
  );

  const weekly = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return meals.filter((meal) => new Date(meal.createdAt) >= from);
  }, [meals]);

  const counts = weekly.reduce<Record<MealType, number>>(
    (acc, meal) => ({ ...acc, [meal.mealType]: acc[meal.mealType] + 1 }),
    { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
  );
  const topType = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "lunch") as MealType;
  const earned = weekly.reduce((sum, meal) => sum + meal.healthPointReward, 0);
  const vegetableCount = weekly.filter((meal) => meal.includesVegetables).length;
  const lateCount = weekly.filter((meal) => meal.mealCondition === "late").length;
  const heavyCount = weekly.filter((meal) => meal.mealCondition === "heavy").length;
  const skippedCount = weekly.filter((meal) => meal.mealCondition === "skipped").length;

  return (
    <MobileShell>
      <AppHeader title="주간 식단 리포트" />
      <main className="flex-1 bg-[#F7FBF8] px-4 pb-24 pt-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white">
          <div className="flex items-center gap-2 text-green-100">
            <CalendarDays size={18} />
            최근 7일
          </div>
          <h1 className="mt-2 text-2xl font-black">
            식사 습관 흐름을 살펴봐요
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "기록 횟수", value: `${weekly.length}회` },
              { label: "채소 포함", value: `${vegetableCount}회` },
              { label: "획득 포인트", value: `${earned}P` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/15 p-2 text-center">
                <p className="text-[10px] text-green-100">{item.label}</p>
                <p className="mt-1 text-base font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 font-black text-[#1F2937]">
            <BarChart3 className="text-[#4CAF6A]" size={20} />
            이번 주 식단 요약
          </h2>
          <div className="mt-3 space-y-3">
            {[
              {
                label: "가장 많이 기록한 식사",
                value: weekly.length
                  ? `${getMealTypeLabel(topType)} 식사`
                  : "아직 기록이 없어요",
              },
              {
                label: "채소 포함 흐름",
                value: weekly.length
                  ? `${vegetableCount}/${weekly.length}회 기록`
                  : "기록이 쌓이면 확인할 수 있어요",
              },
              {
                label: "주의 흐름",
                value:
                  lateCount + heavyCount + skippedCount > 0
                    ? `야식 ${lateCount}회 · 과식 ${heavyCount}회 · 결식 ${skippedCount}회`
                    : "두드러진 과식·야식·결식이 없어요",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="mt-1 font-bold text-[#1F2937]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-[#EAF7EF] p-4">
          <p className="flex items-center gap-2 font-black text-[#1F5A3A]">
            <Sparkles size={19} />
            건강이의 다음 주 식단 코칭
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            칼로리보다 중요한 건 반복되는 흐름이에요. 다음 주에는 채소 포함
            식사를 늘리고, 야식이나 과식이 반복되는 시간대를 먼저 줄여보세요.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 font-black">
            <Trophy className="text-amber-400" size={20} />
            다음 주 미션
          </p>
          {[
            "주요 식사 3회 이상 기록하기",
            "채소 포함 식사 4회 이상 만들기",
            "야식 또는 과식 하루 줄이기",
          ].map((mission) => (
            <p key={mission} className="mt-3 rounded-xl bg-[#F7FBF8] p-3 text-sm font-medium">
              {mission}
            </p>
          ))}
        </section>

        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-green-100 bg-white p-4">
          <Leaf className="mt-0.5 shrink-0 text-[#4CAF6A]" size={20} />
          <p className="text-sm leading-relaxed text-gray-600">
            내 식사 습관 흐름을 보고 건강 방향을 잡아주는 리포트를 작성해드립니다.
            기록이 쌓이면 검진 수치와도 연결해 더 정교하게 안내할 수 있어요.
          </p>
        </section>

        <Link
          href="/meals/new"
          className="mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-[#4CAF6A] px-5 font-extrabold text-white"
        >
          <span className="flex items-center gap-2">
            <UtensilsCrossed size={20} />새 식사 기록하기
          </span>
          <ChevronRight />
        </Link>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
