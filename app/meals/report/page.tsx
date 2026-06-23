"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, ChevronRight, Flame, Sparkles, Trophy } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getMealTypeLabel } from "@/lib/mealAnalysis";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import type { MealAnalysis, MealType } from "@/types/meal";

export default function MealReportPage() {
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  useEffect(() => setMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, [])), []);
  const weekly = useMemo(() => { const from = new Date(); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0); return meals.filter((meal) => new Date(meal.createdAt) >= from); }, [meals]);
  const average = weekly.length ? Math.round(weekly.reduce((sum, meal) => sum + meal.estimatedCalories, 0) / weekly.length) : 0;
  const counts = weekly.reduce<Record<MealType, number>>((acc, meal) => ({ ...acc, [meal.mealType]: acc[meal.mealType] + 1 }), { breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
  const topType = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "lunch") as MealType;
  const earned = weekly.reduce((sum, meal) => sum + meal.healthPointReward, 0);
  return <MobileShell><AppHeader title="주간 식단 리포트" /><main className="flex-1 bg-[#F7FBF8] px-4 pb-24 pt-4">
    <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white"><div className="flex items-center gap-2 text-green-100"><CalendarDays size={18} />최근 7일</div><h1 className="mt-2 text-2xl font-black">식단 기록을 돌아볼까요?</h1><div className="mt-4 grid grid-cols-3 gap-2">{[{ label: "기록 횟수", value: `${weekly.length}회` }, { label: "평균 예상", value: `${average}kcal` }, { label: "획득 포인트", value: `${earned}P` }].map((item) => <div key={item.label} className="rounded-xl bg-white/15 p-2 text-center"><p className="text-[10px] text-green-100">{item.label}</p><p className="mt-1 text-base font-black">{item.value}</p></div>)}</div></section>
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-black text-[#1F2937]"><BarChart3 className="text-[#4CAF6A]" size={20} />이번 주 식단 요약</h2><div className="mt-3 space-y-3">{[{ label: "가장 많이 기록한 식사", value: weekly.length ? `${getMealTypeLabel(topType)} 식사` : "아직 기록이 없어요" }, { label: "탄수화물 비중이 높았던 날", value: weekly.some((meal) => meal.carbs >= 80) ? "기록에서 1일 확인" : "두드러진 날이 없어요" }, { label: "단백질 보완이 필요한 날", value: weekly.some((meal) => meal.protein < 15) ? "다음 식사에서 보완해보세요" : "대체로 잘 챙겼어요" }].map((item) => <div key={item.label} className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">{item.label}</p><p className="mt-1 font-bold text-[#1F2937]">{item.value}</p></div>)}</div></section>
    <section className="mt-4 rounded-2xl bg-[#EAF7EF] p-4"><p className="flex items-center gap-2 font-black text-[#1F5A3A]"><Sparkles size={19} />건강이의 다음 주 식단 코칭</p><p className="mt-2 text-sm leading-relaxed text-gray-600">이번 주는 점심 식단 기록이 꾸준했습니다. 다음 주에는 저녁 식사에 단백질과 채소를 조금 더 보완해보세요.</p></section>
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm"><p className="flex items-center gap-2 font-black"><Trophy className="text-amber-400" size={20} />다음 주 미션</p>{["저녁 식사 사진 3회 기록하기", "식후 10분 걷기 3회 실천하기", "하루 물 6잔 이상 5일 달성하기"].map((mission) => <p key={mission} className="mt-3 rounded-xl bg-[#F7FBF8] p-3 text-sm font-medium">✓ {mission}</p>)}</section>
    <Link href="/meals/new" className="mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-[#4CAF6A] px-5 font-extrabold text-white"><span className="flex items-center gap-2"><Flame size={20} />새 식단 기록하기</span><ChevronRight /></Link>
  </main><BottomNav /></MobileShell>;
}
