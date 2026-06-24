"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Footprints, Moon, Droplets, Scale, HeartPulse, Sparkles } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleSnapshots } from "@/lib/growth";
import type { HealthChangeSnapshot } from "@/types/v3";

const rows = [
  { key: "averageSteps", label: "평균 걸음 수", icon: Footprints, unit: "보" },
  { key: "averageSleepHours", label: "평균 수면", icon: Moon, unit: "시간" },
  { key: "waterDays", label: "물 목표 달성", icon: Droplets, unit: "일" },
  { key: "weight", label: "체중", icon: Scale, unit: "kg" },
  { key: "systolicBloodPressure", label: "수축기 혈압", icon: HeartPulse, unit: "mmHg" },
] as const;

export default function HealthChangePage() {
  const [snapshots, setSnapshots] = useState<HealthChangeSnapshot[]>(sampleSnapshots);
  useEffect(() => { const saved = getFromStorage<HealthChangeSnapshot[]>(STORAGE_KEYS.HEALTH_CHANGE_SNAPSHOTS, sampleSnapshots); setSnapshots(saved); saveToStorage(STORAGE_KEYS.HEALTH_CHANGE_SNAPSHOTS, saved); }, []);
  const start = snapshots.find((s) => s.label === "start") || sampleSnapshots[0];
  const current = snapshots.find((s) => s.label === "current") || sampleSnapshots[1];
  return <MobileShell><AppHeader title="나의 건강 변화" showBack backHref="/dashboard" /><main className="flex-1 overflow-y-auto bg-[#F7FBF8] px-4 pb-24 pt-4">
    <section className="rounded-3xl bg-gradient-to-br from-[#EAF7EF] to-white p-5 ring-1 ring-green-100"><Sparkles className="text-[#4CAF6A]" /><h1 className="mt-2 text-xl font-black text-[#1F2937]">작은 변화가 쌓이고 있어요</h1><p className="mt-2 text-sm text-gray-600">체형 비교가 아닌 건강 행동과 주요 수치의 변화를 확인해요.</p><div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4"><div><p className="text-xs text-gray-400">시작 점수</p><p className="text-2xl font-black text-gray-600">{start.healthScore}</p></div><ArrowRight className="text-[#4CAF6A]" /><div className="text-right"><p className="text-xs text-gray-400">현재 점수</p><p className="text-3xl font-black text-[#24944E]">{current.healthScore}</p></div></div></section>
    <section className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="grid grid-cols-[1fr_80px_24px_80px] bg-gray-50 px-4 py-3 text-center text-xs font-bold text-gray-500"><span className="text-left">비교 항목</span><span>시작</span><span></span><span>현재</span></div>{rows.map(({ key, label, icon: Icon, unit }) => <div key={key} className="grid grid-cols-[1fr_80px_24px_80px] items-center border-t border-gray-50 px-4 py-3 text-center text-sm"><span className="flex items-center gap-2 text-left font-bold text-[#1F2937]"><Icon size={17} className="text-[#4CAF6A]" />{label}</span><span className="text-gray-500">{start[key] ?? "-"}{start[key] != null && unit}</span><ArrowRight size={15} className="text-gray-300" /><span className="font-extrabold text-[#1F5A3A]">{current[key] ?? "-"}{current[key] != null && unit}</span></div>)}</section>
    <p className="mt-4 rounded-2xl bg-[#EAF7EF] p-4 text-sm leading-relaxed text-[#1F5A3A]">처음보다 걷기와 수면 기록이 좋아지고 있어요. 무리하지 않고 지금의 루틴을 이어가보세요.</p>
  </main><BottomNav /></MobileShell>;
}
