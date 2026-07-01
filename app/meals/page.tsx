"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Leaf,
  PlusCircle,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getMealTypeLabel } from "@/lib/mealAnalysis";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import type { MealAnalysis } from "@/types/meal";

export default function MealsPage() {
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(
    () => setMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, [])),
    []
  );

  const todayMeals = useMemo(
    () =>
      meals
        .filter((meal) => meal.mealDate === today)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [meals, today]
  );
  const vegetableCount = todayMeals.filter((meal) => meal.includesVegetables).length;
  const lateOrHeavyCount = todayMeals.filter(
    (meal) => meal.mealCondition === "late" || meal.mealCondition === "heavy"
  ).length;

  return (
    <MobileShell>
      <AppHeader title="식단 기록" showBack backHref="/dashboard" />
      <main className="flex-1 bg-[#F7FBF8] px-4 pb-24 pt-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#176B3A] to-[#4CAF6A] p-5 text-white shadow-lg">
          <p className="text-sm text-green-100">오늘의 식사 흐름</p>
          <h1 className="mt-1 text-2xl font-black">
            메뉴와 습관을 가볍게 기록해요
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "오늘 기록", value: `${todayMeals.length}회` },
              { label: "채소 포함", value: `${vegetableCount}회` },
              { label: "과식/야식", value: `${lateOrHeavyCount}회` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/16 p-3 text-center backdrop-blur"
              >
                <p className="text-xs text-green-100">{item.label}</p>
                <p className="mt-1 text-xl font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/meals/new"
          className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] text-lg font-extrabold text-white shadow-md"
        >
          <PlusCircle size={22} />
          식사 기록하기
        </Link>

        <section className="mt-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Leaf size={19} className="text-[#4CAF6A]" />
            <h2 className="font-extrabold text-[#1F2937]">오늘 식사 체크</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "주요 식사",
                value: `${todayMeals.filter((meal) => meal.mealType !== "snack").length}/3회`,
              },
              {
                label: "채소 포함",
                value: `${vegetableCount}회`,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#F7FBF8] p-3">
                <p className="text-xs font-bold text-gray-500">{item.label}</p>
                <p className="mt-1 text-lg font-black text-[#1F2937]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1F2937]">오늘의 식사 기록</h2>
          <Link
            href="/meals/report"
            className="flex items-center gap-1 text-sm font-bold text-[#4CAF6A]"
          >
            <BarChart3 size={16} />
            주간 리포트
          </Link>
        </div>

        {todayMeals.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-green-200 bg-white p-8 text-center">
            <UtensilsCrossed className="mx-auto text-green-300" size={38} />
            <p className="mt-3 font-bold text-[#1F2937]">
              아직 오늘의 식사 기록이 없어요.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              사진 없이 메뉴와 식사 상태만 가볍게 남겨보세요.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {todayMeals.map((meal) => (
              <article
                key={meal.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-[#EAF7EF] px-2 py-1 text-xs font-bold text-[#1F5A3A]">
                      {getMealTypeLabel(meal.mealType)}
                    </span>
                    <p className="mt-2 font-extrabold text-[#1F2937]">
                      {meal.foodName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                      {meal.summary}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                      meal.includesVegetables
                        ? "bg-green-50 text-[#1F5A3A]"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {meal.includesVegetables ? "채소 포함" : "채소 미체크"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-4 flex items-start gap-3 rounded-2xl bg-[#EAF7EF] p-4">
          <Sparkles className="mt-0.5 shrink-0 text-[#4CAF6A]" size={21} />
          <div>
            <p className="font-extrabold text-[#1F5A3A]">건강이의 식단 코칭</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              내 식사 습관 흐름을 보고 건강 방향을 잡아주는 리포트를
              작성해드려요. 꾸준히 남길수록 조언이 더 선명해져요.
            </p>
          </div>
        </section>

        <Link
          href="/meals/report"
          className="mt-3 flex items-center justify-between rounded-2xl border border-green-100 bg-white p-4 font-bold text-[#1F5A3A]"
        >
          주간 식단 리포트 보기
          <ChevronRight size={20} />
        </Link>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
