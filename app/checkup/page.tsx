"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { addPointTransaction, createEarnTransaction, hasEarnedTodayForReason } from "@/lib/rewards";
import { createCheckupInsights } from "@/lib/healthInsights";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleCheckup } from "@/lib/sampleData";
import type { HealthCheckup } from "@/types/health";
import { Activity, BarChart3, FileUp, Loader2, Save } from "lucide-react";

type HealthAnalysisInsight = {
  summary: {
    정상: number;
    주의: number;
    위험: number;
  };
  items: Array<{
    name: string;
    value: string;
    unit: string;
    status: "정상" | "주의" | "위험";
    comment: string;
  }>;
  recommended_challenges: Array<{
    title: string;
    reason: string;
  }>;
  overall_comment: string;
};

type HealthTrendInsight = {
  trend: "개선중" | "유지" | "악화주의";
  improved: string[];
  worsened: string[];
  message: string;
  nextAction: string;
};

type HealthCheckupRecord = {
  id: string;
  date: string;
  institution?: string;
  uploadedFileName?: string;
  glucose: number;
  alt: number;
  ggt: number;
  ast: number;
  hdl: number;
  totalCholesterol: number;
  bmi: number;
  waist: number;
  sysBP: number;
  diaBP: number;
  aiInsight?: HealthAnalysisInsight;
};

type FormState = Omit<HealthCheckupRecord, "id" | "aiInsight">;

function isHealthAnalysisInsight(value: unknown): value is HealthAnalysisInsight {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  const summary = record.summary as Record<string, unknown> | undefined;
  return (
    Boolean(summary) &&
    typeof summary?.정상 === "number" &&
    typeof summary?.주의 === "number" &&
    typeof summary?.위험 === "number" &&
    Array.isArray(record.items) &&
    Array.isArray(record.recommended_challenges) &&
    typeof record.overall_comment === "string"
  );
}

function isHealthTrendInsight(value: unknown): value is HealthTrendInsight {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    (record.trend === "개선중" || record.trend === "유지" || record.trend === "악화주의") &&
    Array.isArray(record.improved) &&
    record.improved.every((item) => typeof item === "string") &&
    Array.isArray(record.worsened) &&
    record.worsened.every((item) => typeof item === "string") &&
    typeof record.message === "string" &&
    typeof record.nextAction === "string"
  );
}

const initialForm: FormState = {
  date: new Date().toISOString().slice(0, 10),
  institution: "",
  uploadedFileName: "",
  glucose: sampleCheckup.fastingGlucose,
  alt: sampleCheckup.alt,
  ggt: sampleCheckup.gammaGtp,
  ast: sampleCheckup.ast,
  hdl: sampleCheckup.hdl,
  totalCholesterol: sampleCheckup.totalCholesterol,
  bmi: sampleCheckup.bmi,
  waist: sampleCheckup.waist,
  sysBP: sampleCheckup.systolicBp,
  diaBP: sampleCheckup.diastolicBp,
};

const numericFields: Array<{ key: keyof Omit<FormState, "date" | "institution" | "uploadedFileName">; label: string; unit: string }> = [
  { key: "glucose", label: "공복혈당", unit: "mg/dL" },
  { key: "alt", label: "ALT", unit: "U/L" },
  { key: "ggt", label: "GGT", unit: "U/L" },
  { key: "ast", label: "AST", unit: "U/L" },
  { key: "hdl", label: "HDL 콜레스테롤", unit: "mg/dL" },
  { key: "totalCholesterol", label: "총콜레스테롤", unit: "mg/dL" },
  { key: "bmi", label: "BMI", unit: "kg/m²" },
  { key: "waist", label: "허리둘레", unit: "cm" },
  { key: "sysBP", label: "수축기 혈압", unit: "mmHg" },
  { key: "diaBP", label: "이완기 혈압", unit: "mmHg" },
];

const chartTabs = [
  {
    id: "glucose",
    label: "혈당",
    lines: [{ key: "glucose", name: "공복혈당", color: "#24944E" }],
    bands: [
      { y1: 70, y2: 99, color: "#DCFCE7" },
      { y1: 100, y2: 125, color: "#FEF3C7" },
      { y1: 126, y2: 180, color: "#FEE2E2" },
    ],
  },
  {
    id: "liver",
    label: "간수치",
    lines: [
      { key: "alt", name: "ALT", color: "#F59E0B" },
      { key: "ggt", name: "GGT", color: "#D97706" },
      { key: "ast", name: "AST", color: "#EA580C" },
    ],
    bands: [
      { y1: 0, y2: 40, color: "#DCFCE7" },
      { y1: 40, y2: 80, color: "#FEF3C7" },
      { y1: 80, y2: 160, color: "#FEE2E2" },
    ],
  },
  {
    id: "bp",
    label: "혈압",
    lines: [
      { key: "sysBP", name: "수축기", color: "#EF4444" },
      { key: "diaBP", name: "이완기", color: "#8B5CF6" },
    ],
    bands: [
      { y1: 60, y2: 120, color: "#DCFCE7" },
      { y1: 120, y2: 139, color: "#FEF3C7" },
      { y1: 140, y2: 180, color: "#FEE2E2" },
    ],
  },
  {
    id: "cholesterol",
    label: "콜레스테롤",
    lines: [
      { key: "hdl", name: "HDL", color: "#0EA5E9" },
      { key: "totalCholesterol", name: "총콜레스테롤", color: "#6366F1" },
    ],
    bands: [
      { y1: 40, y2: 199, color: "#DCFCE7" },
      { y1: 200, y2: 239, color: "#FEF3C7" },
      { y1: 240, y2: 320, color: "#FEE2E2" },
    ],
  },
] as const;

function normalizeRecord(value: unknown): HealthCheckupRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<HealthCheckupRecord & HealthCheckup>;

  const date = record.date || record.checkupDate;
  const glucose = record.glucose ?? record.fastingGlucose;
  const ggt = record.ggt ?? record.gammaGtp;
  const sysBP = record.sysBP ?? record.systolicBp;
  const diaBP = record.diaBP ?? record.diastolicBp;

  if (!date || glucose === undefined || ggt === undefined || sysBP === undefined || diaBP === undefined) return null;

  return {
    id: record.id || `checkup-${date}`,
    date,
    institution: record.institution,
    uploadedFileName: record.uploadedFileName,
    glucose,
    alt: record.alt ?? 0,
    ggt,
    ast: record.ast ?? 0,
    hdl: record.hdl ?? 0,
    totalCholesterol: record.totalCholesterol ?? 0,
    bmi: record.bmi ?? 0,
    waist: record.waist ?? 0,
    sysBP,
    diaBP,
    aiInsight: record.aiInsight,
  };
}

function toLegacyCheckup(record: HealthCheckupRecord): HealthCheckup {
  return {
    ...sampleCheckup,
    id: record.id,
    checkupDate: record.date,
    bmi: record.bmi,
    waist: record.waist,
    systolicBp: record.sysBP,
    diastolicBp: record.diaBP,
    fastingGlucose: record.glucose,
    totalCholesterol: record.totalCholesterol,
    hdl: record.hdl,
    ast: record.ast,
    alt: record.alt,
    gammaGtp: record.ggt,
  };
}

export default function CheckupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [records, setRecords] = useState<HealthCheckupRecord[]>([]);
  const [activeChart, setActiveChart] = useState<(typeof chartTabs)[number]["id"]>("glucose");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendInsight, setTrendInsight] = useState<HealthTrendInsight>();
  const [message, setMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const savedRecords = getFromStorage<unknown[]>(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, [])
      .map(normalizeRecord)
      .filter((record): record is HealthCheckupRecord => Boolean(record))
      .sort((a, b) => a.date.localeCompare(b.date));
    setRecords(savedRecords);
  }, []);

  const sortedRecords = useMemo(() => [...records].sort((a, b) => a.date.localeCompare(b.date)), [records]);
  const chart = chartTabs.find((tab) => tab.id === activeChart) || chartTabs[0];

  const updateNumber = (key: keyof Omit<FormState, "date" | "institution" | "uploadedFileName">, value: string) => {
    setForm((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      uploadedFileName: file.name,
    }));
    setMessage("파일을 올렸어요. 자동 판독은 준비 중이라 아래 수치를 검진표와 비교해 직접 입력해주세요.");
    event.target.value = "";
  };

  const saveRecord = async () => {
    setLoadingAnalysis(true);
    setMessage("");

    let aiInsight: HealthAnalysisInsight | undefined;
    try {
      const response = await fetch("/api/analyze-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glucose: form.glucose,
          alt: form.alt,
          ggt: form.ggt,
          ast: form.ast,
          hdl: form.hdl,
          totalCholesterol: form.totalCholesterol,
          bmi: form.bmi,
          waist: form.waist,
          sysBP: form.sysBP,
          diaBP: form.diaBP,
        }),
      });

      const result = (await response.json()) as unknown;
      if (!response.ok || !isHealthAnalysisInsight(result)) throw new Error("분석에 실패했어요. 다시 시도해주세요.");
      aiInsight = result;
    } catch (error) {
      setLoadingAnalysis(false);
      setMessage(error instanceof Error ? error.message : "분석에 실패했어요. 다시 시도해주세요.");
      return;
    }

    const record: HealthCheckupRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `checkup-${Date.now()}`,
      ...form,
      aiInsight,
    };

    const nextRecords = [...sortedRecords.filter((item) => item.date !== record.date), record].sort((a, b) => a.date.localeCompare(b.date));
    const latestLegacy = toLegacyCheckup(record);
    saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, nextRecords);
    saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP, latestLegacy);
    saveToStorage(STORAGE_KEYS.CHECKUP_INSIGHTS, createCheckupInsights(latestLegacy));
    saveToStorage("latestHealthAnalysisResult", aiInsight);
    setRecords(nextRecords);

    const txs = getFromStorage(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    if (!hasEarnedTodayForReason(txs, "건강검진 결과 입력")) {
      addPointTransaction(createEarnTransaction("user-001", 50, "건강검진 결과 입력"));
      window.dispatchEvent(new Event("pointsUpdated"));
      setShowToast(true);
    }

    setLoadingAnalysis(false);
    router.push("/checkup/result");
  };

  const analyzeTrend = async () => {
    setTrendLoading(true);
    setTrendInsight(undefined);
    setMessage("");

    try {
      const response = await fetch("/api/health-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: sortedRecords }),
      });
      const result = (await response.json()) as unknown;
      if (!response.ok || !isHealthTrendInsight(result)) throw new Error("흐름 분석을 완료하지 못했어요.");
      setTrendInsight(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "흐름 분석 중 오류가 발생했어요.");
    } finally {
      setTrendLoading(false);
    }
  };

  return (
    <MobileShell>
      <AppHeader title="건강검진 입력" showBack backHref="/dashboard" />
      <RewardToast message="건강검진 결과 입력 완료!" points={50} visible={showToast} onHide={() => setShowToast(false)} />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 pb-24 pt-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#EAF7EF] to-white p-5 ring-1 ring-green-100">
          <FileUp className="text-[#4CAF6A]" />
          <h1 className="mt-2 text-xl font-black text-[#1F2937]">검진 결과를 기록해요</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">PDF나 이미지를 올릴 수 있지만 OCR은 다음 단계에서 연결됩니다. 지금은 수치를 직접 입력해주세요.</p>
          <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#4CAF6A] bg-white text-sm font-extrabold text-[#1F5A3A]">
            <FileUp size={18} />
            PDF/이미지 선택
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} />
          </label>
          {form.uploadedFileName && (
            <div className="mt-3 rounded-2xl bg-white/80 p-3">
              <p className="text-xs font-black text-[#4CAF6A]">선택한 파일: {form.uploadedFileName}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                현재는 OCR 자동입력 전 단계입니다. 검진표의 수치를 확인한 뒤 아래 입력칸에 직접 입력하고 저장해주세요.
              </p>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="text-xs font-bold text-gray-500">검진기관명</span>
              <input value={form.institution || ""} onChange={(event) => setForm((prev) => ({ ...prev, institution: event.target.value }))} placeholder="예: 내일병원" className="mt-2 w-full bg-transparent text-sm font-bold text-[#1F2937] outline-none" />
            </label>
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="text-xs font-bold text-gray-500">검진일</span>
              <input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} className="mt-2 w-full bg-transparent text-sm font-bold text-[#1F2937] outline-none" />
            </label>
          </div>

          <div className="mt-4 divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100">
            {numericFields.map((field) => (
              <label key={field.key} className="flex items-center gap-3 bg-white px-4 py-3">
                <span className="w-28 shrink-0 text-sm font-bold text-gray-700">{field.label}</span>
                <input type="number" step="0.1" value={form[field.key]} onChange={(event) => updateNumber(field.key, event.target.value)} className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-[#1F2937] outline-none" />
                <span className="w-12 text-right text-xs text-gray-400">{field.unit}</span>
              </label>
            ))}
          </div>

          <button onClick={saveRecord} disabled={loadingAnalysis} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] text-lg font-black text-white shadow-lg disabled:opacity-60">
            {loadingAnalysis ? <Loader2 className="animate-spin" size={21} /> : <Save size={21} />}
            {loadingAnalysis ? "AI가 검진 결과를 분석 중이에요..." : "저장하고 AI 분석"}
          </button>
        </section>

        {message && <p className="mt-3 rounded-2xl bg-[#EAF7EF] p-4 text-sm font-bold text-[#1F5A3A]">{message}</p>}

        {sortedRecords.length > 0 && (
          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]"><Activity className="text-[#4CAF6A]" />저장된 검진 기록</h2>
            <div className="mt-3 space-y-2">
              {sortedRecords.slice().reverse().map((record) => (
                <article key={record.id} className="rounded-2xl bg-[#F7FBF8] p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-[#1F2937]">{record.date}</p>
                    <span className="text-xs font-bold text-[#4CAF6A]">{record.institution || "검진기관 미입력"}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">혈당 {record.glucose} · 혈압 {record.sysBP}/{record.diaBP} · BMI {record.bmi}</p>
                  {record.aiInsight && <p className="mt-2 rounded-xl bg-white p-3 text-sm font-bold text-[#1F5A3A]">{record.aiInsight.overall_comment}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {sortedRecords.length >= 2 && (
          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]"><BarChart3 className="text-[#4CAF6A]" />기간별 추이</h2>
              <button onClick={analyzeTrend} disabled={trendLoading} className="rounded-full bg-[#EAF7EF] px-3 py-2 text-xs font-black text-[#1F5A3A] disabled:opacity-60">
                {trendLoading ? "분석 중..." : "흐름 분석"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {chartTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveChart(tab.id)} className={`rounded-xl py-2 text-xs font-black ${activeChart === tab.id ? "bg-[#4CAF6A] text-white" : "bg-gray-100 text-gray-500"}`}>{tab.label}</button>
              ))}
            </div>

            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedRecords} margin={{ left: -24, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  {chart.bands.map((band) => (
                    <ReferenceArea key={`${band.y1}-${band.y2}`} y1={band.y1} y2={band.y2} fill={band.color} fillOpacity={0.45} />
                  ))}
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {chart.lines.map((line) => (
                    <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={3} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {trendInsight && (
              <div className="mt-4 rounded-2xl bg-[#F7FBF8] p-4">
                <p className="text-sm font-black text-[#1F5A3A]">흐름 상태: {trendInsight.trend}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{trendInsight.message}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white p-3"><p className="font-black text-[#24944E]">좋아진 항목</p><p className="mt-1 text-gray-600">{trendInsight.improved.join(", ") || "없음"}</p></div>
                  <div className="rounded-xl bg-white p-3"><p className="font-black text-[#E34D59]">주의 항목</p><p className="mt-1 text-gray-600">{trendInsight.worsened.join(", ") || "없음"}</p></div>
                </div>
                <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-[#1F2937]">다음 행동: {trendInsight.nextAction}</p>
              </div>
            )}
          </section>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
