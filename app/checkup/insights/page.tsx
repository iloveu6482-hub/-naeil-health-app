"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardPlus, Sparkles } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { createCheckupInsights, insightStatus } from "@/lib/healthInsights";
import { sampleCheckup, sampleDailyLog } from "@/lib/sampleData";
import type { CheckupInsight } from "@/types/v3";
import type { HealthCheckup, DailyLog } from "@/types/health";

export default function CheckupInsightsPage() {
  const [insights, setInsights] = useState<CheckupInsight[]>([]);
  const [fromMy, setFromMy] = useState(false);
  useEffect(() => {
    setFromMy(new URLSearchParams(window.location.search).get("from") === "my");
    const checkup = getFromStorage<HealthCheckup>(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, [sampleDailyLog]);
    const next = createCheckupInsights(checkup, logs.at(-1));
    setInsights(next); saveToStorage(STORAGE_KEYS.CHECKUP_INSIGHTS, next);
  }, []);
  return <MobileShell><AppHeader title="검진 관리 항목" showBack backHref={fromMy ? "/my" : "/checkup"} /><main className="flex-1 overflow-y-auto bg-[#F7FBF8] px-4 pb-24 pt-4">
    <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white"><Sparkles /><h1 className="mt-3 text-xl font-black">검진 결과에서 찾은 관리 방향</h1><p className="mt-2 text-sm leading-relaxed text-green-50">수치를 쉽게 이해하고 오늘 시작할 수 있는 생활습관을 정리했어요.</p></section>
    <div className="mt-4 space-y-3">{insights.map((item) => { const status = insightStatus[item.status]; return <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-extrabold text-[#1F2937]">{item.status === "good" ? <CheckCircle2 className="text-[#4CAF6A]" size={19} /> : <AlertTriangle className="text-[#F59E0B]" size={19} />}{item.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.color}`}>{status.label}</span></div><p className="mt-2 text-sm leading-relaxed text-gray-600">{item.summary}</p><div className="mt-3 flex flex-wrap gap-2">{item.recommendedMissions.map((mission) => <span key={mission} className="rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-bold text-[#1F5A3A]">{mission}</span>)}</div></article>; })}</div>
    <div className="mt-4 grid grid-cols-2 gap-3"><Link href="/report" className="rounded-2xl bg-[#1F5A3A] p-4 text-sm font-bold text-white">AI 건강 리포트 <ArrowRight className="mt-2" size={18} /></Link><Link href="/checkup" className="rounded-2xl border border-green-200 bg-white p-4 text-sm font-bold text-[#1F5A3A]">검진 결과 입력 <ClipboardPlus className="mt-2" size={18} /></Link></div>
    <p className="mt-4 rounded-xl bg-gray-100 p-3 text-xs leading-relaxed text-gray-500">이 결과는 건강관리 참고 정보입니다. 정확한 진단과 치료는 의료기관 및 전문의 상담을 권장합니다.</p>
  </main><BottomNav /></MobileShell>;
}
