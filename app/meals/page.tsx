"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Camera, ChevronRight, Flame, PieChart, Sparkles, UtensilsCrossed } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getMealTypeLabel } from "@/lib/mealAnalysis";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import type { MealAnalysis } from "@/types/meal";

export default function MealsPage() {
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => setMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, [])), []);
  const todayMeals = useMemo(() => meals.filter((meal) => meal.mealDate === today).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [meals, today]);
  const totals = todayMeals.reduce((acc, meal) => ({ calories: acc.calories + meal.estimatedCalories, carbs: acc.carbs + meal.carbs, protein: acc.protein + meal.protein, fat: acc.fat + meal.fat }), { calories: 0, carbs: 0, protein: 0, fat: 0 });

  return <MobileShell><AppHeader title="식단 기록" /><main className="flex-1 bg-[#F7FBF8] px-4 pb-24 pt-4">
    <section className="rounded-3xl bg-gradient-to-br from-[#176B3A] to-[#4CAF6A] p-5 text-white shadow-lg"><p className="text-sm text-green-100">사진 한 장으로 오늘의 식단을 기록하고</p><h1 className="mt-1 text-2xl font-black">예상 칼로리를 확인해보세요</h1><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/16 p-3 backdrop-blur"><p className="text-xs text-green-100">오늘 기록</p><p className="mt-1 text-2xl font-black">{todayMeals.length}<span className="text-sm">회</span></p></div><div className="rounded-2xl bg-white/16 p-3 backdrop-blur"><p className="text-xs text-green-100">예상 총 칼로리</p><p className="mt-1 text-2xl font-black">{totals.calories.toLocaleString()}<span className="text-sm"> kcal</span></p></div></div></section>
    <Link href="/meals/new" className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] text-lg font-extrabold text-white shadow-md"><Camera size={22} />식단 사진 기록하기</Link>
    <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><PieChart size={19} className="text-[#4CAF6A]" /><h2 className="font-extrabold text-[#1F2937]">오늘의 영양 참고 요약</h2></div><div className="grid grid-cols-3 gap-2">{[{ label: "탄수화물", value: totals.carbs, color: "bg-amber-50 text-amber-700" }, { label: "단백질", value: totals.protein, color: "bg-green-50 text-green-700" }, { label: "지방", value: totals.fat, color: "bg-blue-50 text-blue-700" }].map((item) => <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}><p className="text-xs">{item.label}</p><p className="mt-1 font-black">{item.value}g</p></div>)}</div></section>
    <div className="mt-5 flex items-center justify-between"><h2 className="text-lg font-black text-[#1F2937]">오늘의 식사 기록</h2><Link href="/meals/report" className="flex items-center gap-1 text-sm font-bold text-[#4CAF6A]"><BarChart3 size={16} />주간 리포트</Link></div>
    {todayMeals.length === 0 ? <div className="mt-3 rounded-3xl border border-dashed border-green-200 bg-white p-8 text-center"><UtensilsCrossed className="mx-auto text-green-300" size={38} /><p className="mt-3 font-bold text-[#1F2937]">아직 오늘의 식단 기록이 없어요.</p><p className="mt-1 text-sm leading-relaxed text-gray-500">식사 전 사진을 찍고 AI 식단 분석을 받아보세요.</p></div> : <div className="mt-3 space-y-3">{todayMeals.map((meal) => <article key={meal.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">{meal.imageUrl ? <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl"><Image src={meal.imageUrl} alt={`${getMealTypeLabel(meal.mealType)} 식사`} fill unoptimized className="object-cover" /></div> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#EAF7EF] text-3xl">🍽️</div>}<div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="rounded-full bg-[#EAF7EF] px-2 py-1 text-xs font-bold text-[#1F5A3A]">{getMealTypeLabel(meal.mealType)}</span><span className="flex items-center gap-1 text-sm font-black text-orange-500"><Flame size={15} />{meal.estimatedCalories} kcal</span></div><p className="mt-2 truncate font-extrabold text-[#1F2937]">{meal.foodName}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{meal.summary}</p></div></article>)}</div>}
    <section className="mt-4 flex items-start gap-3 rounded-2xl bg-[#EAF7EF] p-4"><Sparkles className="mt-0.5 shrink-0 text-[#4CAF6A]" size={21} /><div><p className="font-extrabold text-[#1F5A3A]">건강이의 식단 코칭</p><p className="mt-1 text-sm leading-relaxed text-gray-600">완벽한 식사보다 꾸준한 기록이 먼저예요. 다음 식사에는 채소와 단백질을 한 가지씩 더 살펴보세요.</p></div></section>
    <Link href="/meals/report" className="mt-3 flex items-center justify-between rounded-2xl border border-green-100 bg-white p-4 font-bold text-[#1F5A3A]">주간 식단 리포트 보기<ChevronRight size={20} /></Link>
  </main><BottomNav /></MobileShell>;
}
