"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Flame, ImagePlus, LoaderCircle, Sparkles } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import { MEAL_DISCLAIMER, getMealTypeLabel, mockAnalyzeMealImage, prepareMealImage } from "@/lib/mealAnalysis";
import { createEarnTransaction, hasEarnedTodayForReason } from "@/lib/rewards";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { MealAnalysis, MealType } from "@/types/meal";
import type { PointTransaction } from "@/types/reward";
import type { UserProfile } from "@/types/user";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function NewMealPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [imageUrl, setImageUrl] = useState<string>();
  const [analysis, setAnalysis] = useState<MealAnalysis>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { setImageUrl(await prepareMealImage(file)); setAnalysis(undefined); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : "사진을 준비하지 못했어요."); }
  };
  const analyze = async () => { if (!imageUrl) return setMessage("먼저 식사 사진을 선택해주세요."); setLoading(true); setMessage(""); try { setAnalysis(await mockAnalyzeMealImage(mealType, imageUrl)); } finally { setLoading(false); } };
  const saveMeal = () => {
    if (!analysis) return;
    const records = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    if (records.some((record) => record.mealDate === analysis.mealDate && record.mealType === analysis.mealType)) return setMessage(`오늘 ${getMealTypeLabel(analysis.mealType)} 식단은 이미 기록되어 헬스포인트를 받았어요.`);
    const nextRecords = [...records, analysis];
    saveToStorage(STORAGE_KEYS.MEAL_RECORDS, nextRecords);
    const profile = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const transactions = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    const reason = `${getMealTypeLabel(analysis.mealType)} 식단 기록`;
    const additions: PointTransaction[] = [];
    if (!hasEarnedTodayForReason(transactions, reason)) additions.push(createEarnTransaction(profile.id, analysis.healthPointReward, reason));
    const mainTypes = new Set(nextRecords.filter((record) => record.mealDate === analysis.mealDate && record.mealType !== "snack").map((record) => record.mealType));
    if (mainTypes.size === 3 && !hasEarnedTodayForReason(transactions, "하루 3끼 식단 기록 완료")) additions.push(createEarnTransaction(profile.id, 20, "하루 3끼 식단 기록 완료"));
    saveToStorage(STORAGE_KEYS.POINT_TRANSACTIONS, [...transactions, ...additions]);
    window.dispatchEvent(new Event("pointsUpdated"));
    router.push("/meals");
  };

  return <MobileShell><AppHeader title="AI 식단 사진 분석" /><main className="flex-1 bg-[#F7FBF8] px-4 pb-10 pt-4">
    <p className="text-sm leading-relaxed text-gray-600">식사 사진을 올리면 예상 칼로리와 식습관 참고 정보를 알려드려요.</p>
    <div className="mt-3 flex gap-2">{mealTypes.map((type) => <button key={type} onClick={() => { setMealType(type); setAnalysis(undefined); }} className={`flex-1 rounded-xl py-3 text-sm font-bold ${mealType === type ? "bg-[#4CAF6A] text-white shadow" : "bg-white text-gray-500 ring-1 ring-gray-200"}`}>{getMealTypeLabel(type)}</button>)}</div>
    <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={handleImage} />
    <button onClick={() => inputRef.current?.click()} className="relative mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-green-200 bg-white">{imageUrl ? <Image src={imageUrl} alt="선택한 식사 사진 미리보기" fill unoptimized className="object-cover" /> : <div className="text-center"><ImagePlus className="mx-auto text-[#4CAF6A]" size={42} /><p className="mt-3 font-extrabold text-[#1F2937]">클릭해서 식사 사진 선택</p><p className="mt-1 text-sm text-gray-400">JPG, PNG, WEBP</p></div>}</button>
    <button onClick={analyze} disabled={loading || !imageUrl} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] text-base font-extrabold text-white shadow-lg disabled:opacity-45">{loading ? <><LoaderCircle className="animate-spin" />건강이가 식단을 분석하고 있어요...</> : <><Sparkles />AI 식단 분석하기</>}</button>
    {analysis && <section className="mt-4 rounded-3xl border border-green-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-sm font-bold text-[#1F5A3A]">{getMealTypeLabel(analysis.mealType)}</span><span className="flex items-center gap-1 text-xl font-black text-orange-500"><Flame />{analysis.estimatedCalories} kcal</span></div><h2 className="mt-4 text-xl font-black text-[#1F2937]">{analysis.foodName}</h2><div className="mt-4 grid grid-cols-3 gap-2">{[{ label: "탄수화물", value: analysis.carbs }, { label: "단백질", value: analysis.protein }, { label: "지방", value: analysis.fat }].map((item) => <div key={item.label} className="rounded-xl bg-gray-50 p-3 text-center"><p className="text-xs text-gray-500">{item.label}</p><p className="mt-1 font-black text-[#1F2937]">{item.value}g</p></div>)}</div><div className="mt-4 rounded-2xl bg-[#F7FBF8] p-4"><p className="text-sm font-extrabold text-[#1F5A3A]">AI 요약</p><p className="mt-1 text-sm leading-relaxed text-gray-600">{analysis.summary}</p></div><div className="mt-3 rounded-2xl bg-amber-50 p-4"><p className="text-sm font-extrabold text-amber-700">건강이의 조언</p><p className="mt-1 text-sm leading-relaxed text-gray-600">{analysis.advice}</p></div><p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#4CAF6A]"><CheckCircle2 size={18} />저장하면 헬스포인트 {analysis.healthPointReward}P</p><button onClick={saveMeal} className="mt-4 min-h-14 w-full rounded-2xl bg-[#4CAF6A] px-3 font-extrabold text-white">식단 기록 저장하고 헬스포인트 받기</button></section>}
    {message && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">{message}</p>}
    <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-100 p-3 text-xs leading-relaxed text-gray-500"><AlertCircle size={16} className="mt-0.5 shrink-0" />{MEAL_DISCLAIMER}</p>
  </main></MobileShell>;
}
