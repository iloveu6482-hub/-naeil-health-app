"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage } from "@/lib/storage";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Target, TriangleAlert } from "lucide-react";

type CheckupStatus = "정상" | "주의" | "위험";

type AnalyzeHealthResult = {
  summary: {
    정상: number;
    주의: number;
    위험: number;
  };
  items: Array<{
    name: string;
    value: string;
    unit: string;
    status: CheckupStatus;
    comment: string;
  }>;
  recommended_challenges: Array<{
    title: string;
    reason: string;
  }>;
  overall_comment: string;
};

const resultStorageKey = "latestHealthAnalysisResult";

const statusStyles = {
  정상: {
    icon: CheckCircle2,
    chip: "bg-emerald-50 text-emerald-700",
    card: "bg-emerald-50 text-emerald-700",
  },
  주의: {
    icon: AlertCircle,
    chip: "bg-amber-50 text-amber-700",
    card: "bg-amber-50 text-amber-700",
  },
  위험: {
    icon: TriangleAlert,
    chip: "bg-red-50 text-red-700",
    card: "bg-red-50 text-red-700",
  },
} as const;

function isAnalyzeHealthResult(value: unknown): value is AnalyzeHealthResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AnalyzeHealthResult>;
  return Boolean(record.summary) && Array.isArray(record.items) && typeof record.overall_comment === "string";
}

export default function CheckupResultPage() {
  const [result, setResult] = useState<AnalyzeHealthResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CheckupStatus | null>(null);

  useEffect(() => {
    const saved = getFromStorage<unknown>(resultStorageKey, null);
    setResult(isAnalyzeHealthResult(saved) ? saved : null);
    setLoaded(true);
  }, []);

  const filteredItems = result
    ? selectedStatus
      ? result.items.filter((item) => item.status === selectedStatus)
      : result.items
    : [];

  return (
    <MobileShell>
      <AppHeader title="AI 검진 분석" showBack backHref="/checkup" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 pb-24 pt-4">
        {!loaded && (
          <section className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <Loader2 className="animate-spin text-[#4CAF6A]" size={34} />
            <p className="mt-4 text-sm font-bold text-gray-600">AI가 검진 결과를 분석 중이에요...</p>
          </section>
        )}

        {loaded && !result && (
          <section className="rounded-3xl border border-red-100 bg-white p-5 text-center shadow-sm">
            <TriangleAlert className="mx-auto text-red-500" size={34} />
            <h1 className="mt-3 text-xl font-black text-[#1F2937]">분석에 실패했어요</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">분석에 실패했어요. 다시 시도해주세요.</p>
            <Link href="/checkup" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-[#4CAF6A] text-sm font-black text-white">
              검진 입력으로 돌아가기
            </Link>
          </section>
        )}

        {result && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
              <p className="text-sm font-bold text-green-100">AI 분석 요약</p>
              <h1 className="mt-1 text-xl font-black">검진 결과 상태</h1>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["정상", "주의", "위험"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus((current) => (current === status ? null : status))}
                    aria-pressed={selectedStatus === status}
                    className={`rounded-2xl p-3 text-center transition active:scale-[0.98] ${
                      selectedStatus === status
                        ? "bg-white text-[#1F5A3A] shadow-sm"
                        : "bg-white/16 text-white hover:bg-white/22"
                    }`}
                  >
                    <p className={`text-xs ${selectedStatus === status ? "text-[#1F5A3A]/75" : "text-green-100"}`}>{status}</p>
                    <p className="mt-1 text-3xl font-black">{result.summary[status]}</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-bold text-green-100">
                {selectedStatus ? `${selectedStatus} 항목만 보고 있어요. 다시 누르면 전체가 보여요.` : "상태 카드를 누르면 해당 항목만 모아볼 수 있어요."}
              </p>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#1F2937]">
                  {selectedStatus ? `${selectedStatus} 항목` : "수치별 해설"}
                </h2>
                {selectedStatus && (
                  <button
                    type="button"
                    onClick={() => setSelectedStatus(null)}
                    className="shrink-0 rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-black text-[#1F5A3A]"
                  >
                    전체 보기
                  </button>
                )}
              </div>
              <div className="mt-3 divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100">
                {filteredItems.map((item) => (
                  <article key={item.name} className="bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#1F2937]">{item.name}</p>
                        <p className="mt-1 text-sm font-bold text-gray-500">
                          {item.value} {item.unit}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.status].chip}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 rounded-2xl bg-[#F7FBF8] p-3 text-sm font-bold leading-relaxed text-gray-700">
                      {item.comment}
                    </p>
                  </article>
                ))}
                {filteredItems.length === 0 && (
                  <div className="bg-white p-5 text-center text-sm font-bold text-gray-500">
                    해당 상태의 검진 항목이 없어요.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-green-100 bg-[#EAF7EF] p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#1F2937]">전체 총평</h2>
              <p className="mt-3 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-relaxed text-[#1F5A3A]">
                {result.overall_comment}
              </p>
            </section>

            {result.recommended_challenges.length > 0 && (
              <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
                  <Target className="text-[#4CAF6A]" size={20} />
                  추천 챌린지
                </h2>
                <div className="mt-3 space-y-2">
                  {result.recommended_challenges.slice(0, 2).map((challenge) => (
                    <article key={challenge.title} className="rounded-2xl bg-[#F7FBF8] p-4">
                      <p className="font-black text-[#1F2937]">{challenge.title}</p>
                      <p className="mt-1 text-sm font-bold leading-relaxed text-gray-500">{challenge.reason}</p>
                    </article>
                  ))}
                </div>
                <Link href="/challenges" className="mt-3 flex min-h-12 items-center justify-between rounded-2xl bg-[#4CAF6A] px-4 text-sm font-black text-white">
                  챌린지 시작하기
                  <ChevronRight size={18} />
                </Link>
              </section>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
