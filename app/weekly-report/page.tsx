"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import {
  calculateActivityScore,
  calculateMealScore,
  calculateSleepScore,
  calculateWaterScore,
} from "@/lib/lifestyleScore";
import type { DailyLog } from "@/types/health";
import { BarChart3, CalendarDays, Loader2, Target, Trophy } from "lucide-react";

type WeeklyCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";
type ReportMode = "weekly" | "monthly";
type WeekRangeType = "this" | "last";

type ReportLogPayload = {
  date: string;
  steps: number;
  score: number;
  sleep: number;
  diet: "good" | "normal" | "bad";
  exercise: number;
  water: number;
  noSmoking: boolean;
};

type ReportApiResponse = {
  weekScore: number;
  grade: "훌륭해요" | "잘하고 있어요" | "조금 더 힘내요" | "다시 시작해요";
  best: string;
  worst: string;
  message: string;
  nextWeekGoal: string;
};

type WeeklyReportRecord = ReportApiResponse & {
  id: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
};

type CheckupRecord = {
  date?: string;
  checkupDate?: string;
  glucose?: number;
  fastingGlucose?: number;
  alt?: number;
  ggt?: number;
  gammaGtp?: number;
  ast?: number;
  hdl?: number;
  totalCholesterol?: number;
  bmi?: number;
  waist?: number;
  sysBP?: number;
  systolicBp?: number;
  diaBP?: number;
  diastolicBp?: number;
  aiInsight?: {
    items?: Array<{
      name: string;
      value: string;
      status: "정상" | "주의" | "위험";
    }>;
  };
  [key: string]: unknown;
};

const gradeFallbacks: Array<{ min: number; grade: ReportApiResponse["grade"] }> = [
  { min: 85, grade: "훌륭해요" },
  { min: 65, grade: "잘하고 있어요" },
  { min: 40, grade: "조금 더 힘내요" },
  { min: 0, grade: "다시 시작해요" },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getWeekRange(type: WeekRangeType) {
  const start = getMonday(new Date());
  if (type === "last") start.setDate(start.getDate() - 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function getCoachId(id?: string | null): WeeklyCoachId {
  if (id === "onyu" || id === "onyou") return "onyu";
  if (id === "haru") return "haru";
  if (id === "taeo" || id === "kangtaeo") return "kangtaeo";
  if (id === "rumi" || id === "lumi") return "rumi";
  return "haru";
}

function compactLogsByDate(logs: DailyLog[]) {
  const map = new Map<string, DailyLog>();
  logs.forEach((log) => {
    const previous = map.get(log.logDate);
    if (!previous || log.id.localeCompare(previous.id) >= 0) map.set(log.logDate, log);
  });
  return Array.from(map.values());
}

function buildReportLogs(logs: DailyLog[], start: string, end: string): ReportLogPayload[] {
  return compactLogsByDate(logs)
    .filter((log) => log.logDate >= start && log.logDate <= end)
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((log) => {
      const mealScore = calculateMealScore(log.mealsCount);
      const score = Math.min(
        100,
        calculateActivityScore(log.steps) +
          calculateSleepScore(log.sleepHours) +
          calculateWaterScore(log.waterCups) +
          mealScore +
          (log.exerciseDone ? 5 : 0)
      );

      return {
        date: log.logDate,
        steps: log.steps,
        score,
        sleep: log.sleepHours,
        diet: mealScore >= 25 ? "good" : mealScore >= 15 ? "normal" : "bad",
        exercise: log.exerciseDone ? 30 : 0,
        water: log.waterCups,
        noSmoking: true,
      };
    });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function makeFallbackReport(reportLogs: ReportLogPayload[], mode: ReportMode): ReportApiResponse {
  const weekScore = average(reportLogs.map((log) => log.score));
  const grade = gradeFallbacks.find((item) => weekScore >= item.min)?.grade || "다시 시작해요";
  const sleepScore = average(reportLogs.map((log) => calculateSleepScore(log.sleep)));
  const waterScore = average(reportLogs.map((log) => calculateWaterScore(log.water)));
  const exerciseScore = average(reportLogs.map((log) => (log.exercise > 0 ? 35 : 0)));
  const dietScore = average(reportLogs.map((log) => (log.diet === "good" ? 25 : log.diet === "normal" ? 15 : 5)));
  const items = [
    { label: "수면", value: sleepScore },
    { label: "수분", value: waterScore },
    { label: "운동", value: exerciseScore },
    { label: "식단", value: dietScore },
  ].sort((a, b) => b.value - a.value);

  return {
    weekScore,
    grade,
    best: items[0]?.label || "기록",
    worst: items[items.length - 1]?.label || "기록",
    message:
      mode === "monthly"
        ? "이번 달 기록을 기준으로 습관 흐름을 정리했어요. 잘 유지된 항목은 계속 가져가고, 가장 약한 항목은 다음 달 핵심 목표로 잡아보면 좋아요."
        : "이번 주 기록을 기준으로 생활 습관 흐름을 확인했어요. 잘된 항목은 유지하고, 아쉬운 항목은 하나만 골라 다음 주에 가볍게 보완해봐요.",
    nextWeekGoal: `${items[items.length - 1]?.label || "습관"} 기록을 3일 이상 실천하기`,
  };
}

function isReportApiResponse(value: unknown): value is ReportApiResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.weekScore === "number" &&
    typeof record.grade === "string" &&
    typeof record.best === "string" &&
    typeof record.worst === "string" &&
    typeof record.message === "string" &&
    typeof record.nextWeekGoal === "string"
  );
}

function getRiskyCheckupItems(checkup: CheckupRecord | null) {
  if (!checkup) return [];
  if (checkup.aiInsight?.items?.length) {
    return checkup.aiInsight.items
      .filter((item) => item.status === "주의" || item.status === "위험")
      .map((item) => ({ name: item.name, value: item.value, status: item.status }));
  }

  const items = [
    { name: "공복혈당", value: String(checkup.glucose ?? checkup.fastingGlucose ?? ""), status: Number(checkup.glucose ?? checkup.fastingGlucose ?? 0) >= 100 ? "주의" : "정상" },
    { name: "ALT", value: String(checkup.alt ?? ""), status: Number(checkup.alt ?? 0) > 40 ? "주의" : "정상" },
    { name: "GGT", value: String(checkup.ggt ?? checkup.gammaGtp ?? ""), status: Number(checkup.ggt ?? checkup.gammaGtp ?? 0) > 60 ? "주의" : "정상" },
    { name: "혈압", value: `${checkup.sysBP ?? checkup.systolicBp ?? ""}/${checkup.diaBP ?? checkup.diastolicBp ?? ""}`, status: Number(checkup.sysBP ?? checkup.systolicBp ?? 0) >= 130 || Number(checkup.diaBP ?? checkup.diastolicBp ?? 0) >= 85 ? "주의" : "정상" },
  ];
  return items.filter((item) => item.status !== "정상");
}

export default function WeeklyReportPage() {
  const [mode, setMode] = useState<ReportMode>("weekly");
  const [rangeType, setRangeType] = useState<WeekRangeType>("this");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [reports, setReports] = useState<WeeklyReportRecord[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<ReportApiResponse | null>(null);
  const [monthlyInsight, setMonthlyInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLogs(getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []));
    setReports(getFromStorage<WeeklyReportRecord[]>(STORAGE_KEYS.WEEKLY_REPORTS, []));
  }, []);

  const range = useMemo(() => (mode === "weekly" ? getWeekRange(rangeType) : getMonthRange()), [mode, rangeType]);
  const reportLogs = useMemo(() => buildReportLogs(logs, range.start, range.end), [logs, range.end, range.start]);
  const currentReport = reports.find((report) => report.weekStart === range.start && report.weekEnd === range.end);
  const previewReport = mode === "weekly"
    ? currentReport || (reportLogs.length > 0 ? makeFallbackReport(reportLogs, mode) : null)
    : monthlyReport || (reportLogs.length > 0 ? makeFallbackReport(reportLogs, mode) : null);
  const chartData = useMemo(
    () => [
      { name: "걸음", value: average(reportLogs.map((log) => calculateActivityScore(log.steps))) },
      { name: "수면", value: average(reportLogs.map((log) => calculateSleepScore(log.sleep))) },
      { name: "식단", value: average(reportLogs.map((log) => (log.diet === "good" ? 25 : log.diet === "normal" ? 15 : 5))) },
      { name: "수분", value: average(reportLogs.map((log) => calculateWaterScore(log.water))) },
    ],
    [reportLogs]
  );
  const monthlyAverages = useMemo(
    () => ({
      steps: average(compactLogsByDate(logs).filter((log) => log.logDate >= range.start && log.logDate <= range.end).map((log) => log.steps)),
      sleep: average(reportLogs.map((log) => log.sleep)),
      water: average(reportLogs.map((log) => log.water)),
      meals: average(reportLogs.map((log) => (log.diet === "good" ? 3 : log.diet === "normal" ? 2 : 1))),
    }),
    [logs, range.end, range.start, reportLogs]
  );

  const createReport = async () => {
    setMessage("");
    if (reportLogs.length === 0) {
      setMessage(mode === "weekly" ? "선택한 주차에 습관 기록이 없어요." : "이번 달 습관 기록이 없어요.");
      return;
    }

    setLoading(true);
    const coachId = getCoachId(getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, "haru"));
    const checkups = getFromStorage<CheckupRecord[]>(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, []);
    const recentCheckup = [...checkups]
      .sort((a, b) => String(b.date || b.checkupDate || "").localeCompare(String(a.date || a.checkupDate || "")))[0] || null;

    let apiReport: ReportApiResponse | null = null;
    try {
      const response = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekLogs: reportLogs, coachId, recentCheckup }),
      });
      const result = (await response.json()) as unknown;
      if (response.ok && isReportApiResponse(result)) apiReport = result;
    } catch (error) {
      console.error("Report request failed", error);
    }

    const report = {
      ...(apiReport || makeFallbackReport(reportLogs, mode)),
      id: globalThis.crypto?.randomUUID?.() || `report-${Date.now()}`,
      weekStart: range.start,
      weekEnd: range.end,
      generatedAt: new Date().toISOString(),
    };

    if (mode === "weekly") {
      const nextReports = [
        ...reports.filter((item) => !(item.weekStart === range.start && item.weekEnd === range.end)),
        report,
      ].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      saveToStorage(STORAGE_KEYS.WEEKLY_REPORTS, nextReports);
      setReports(nextReports);
    } else {
      setMonthlyReport(report);
      await createMonthlyInsight(recentCheckup);
    }

    setLoading(false);
  };

  const createMonthlyInsight = async (recentCheckup?: CheckupRecord | null) => {
    const checkup = recentCheckup ?? getFromStorage<CheckupRecord[]>(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, [])
      .sort((a, b) => String(b.date || b.checkupDate || "").localeCompare(String(a.date || a.checkupDate || "")))[0] ?? null;
    const riskyCheckupItems = getRiskyCheckupItems(checkup);
    if (riskyCheckupItems.length === 0) return;

    setInsightLoading(true);
    try {
      const habitCounts = {
        "7천보 이상 걷기": reportLogs.filter((log) => log.steps >= 7000).length,
        "수면 7시간 이상": reportLogs.filter((log) => log.sleep >= 7).length,
        "물 6잔 이상": reportLogs.filter((log) => log.water >= 6).length,
        "식사 3회": reportLogs.filter((log) => log.diet === "good").length,
      };
      const response = await fetch("/api/monthly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitCounts, riskyCheckupItems }),
      });
      const result = (await response.json()) as { message?: string };
      if (response.ok && result.message) setMonthlyInsight(result.message);
    } catch (error) {
      console.error("Monthly insight request failed", error);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "monthly" || reportLogs.length === 0 || monthlyInsight) return;
    void createMonthlyInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reportLogs.length]);

  return (
    <MobileShell>
      <AppHeader title={mode === "weekly" ? "주간 리포트" : "월간 리포트"} showBack backHref="/dashboard" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 pb-24 pt-4">
        <section className="mb-4 grid grid-cols-2 gap-2 rounded-3xl border border-green-100 bg-white p-2 shadow-sm">
          {[
            { id: "weekly", label: "주간" },
            { id: "monthly", label: "월간" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as ReportMode)}
              className={`min-h-10 rounded-2xl text-sm font-black transition ${mode === item.id ? "bg-[#4CAF6A] text-white" : "bg-[#F7FBF8] text-gray-500"}`}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-green-100">
            <CalendarDays size={17} />
            {range.start} ~ {range.end}
          </div>
          {mode === "weekly" && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/12 p-1">
              {[
                { id: "this", label: "이번 주" },
                { id: "last", label: "저번 주" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRangeType(item.id as WeekRangeType)}
                  className={`rounded-xl py-2 text-sm font-black transition ${rangeType === item.id ? "bg-white text-[#1F5A3A]" : "text-white/80"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-green-100">{mode === "weekly" ? "7일 평균 점수" : "이번 달 평균 점수"}</p>
              <p className="mt-1 text-5xl font-black">{previewReport?.weekScore ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white/16 px-4 py-3 text-right">
              <p className="text-xs text-green-100">등급</p>
              <p className="font-black">{previewReport?.grade || "리포트 없음"}</p>
            </div>
          </div>
        </section>

        {mode === "monthly" && reportLogs.length > 0 && (
          <section className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "평균 걸음", value: `${monthlyAverages.steps.toLocaleString()}보` },
              { label: "평균 수면", value: `${monthlyAverages.sleep}시간` },
              { label: "평균 수분", value: `${monthlyAverages.water}잔` },
              { label: "평균 식사", value: `${monthlyAverages.meals}회` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500">{item.label}</p>
                <p className="mt-1 text-xl font-black text-[#1F2937]">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
                <Trophy className="text-[#F7C948]" size={20} />
                코치 총평
              </h2>
              <p className="mt-1 text-xs text-gray-500">{reportLogs.length}일 기록 기준</p>
            </div>
            <button
              onClick={createReport}
              disabled={loading}
              className="flex min-h-10 items-center gap-2 rounded-full bg-[#4CAF6A] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {previewReport ? "다시 생성" : mode === "weekly" ? "이번 주 리포트 보기" : "월간 리포트 보기"}
            </button>
          </div>

          {message && <p className="mt-3 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-600">{message}</p>}

          {previewReport ? (
            <div className="mt-4 space-y-3">
              <p className="rounded-2xl bg-[#F7FBF8] p-4 text-sm font-bold leading-relaxed text-[#1F5A3A]">
                {previewReport.message}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#EAF7EF] p-3">
                  <p className="text-xs font-bold text-[#4CAF6A]">가장 잘한 습관</p>
                  <p className="mt-1 font-black text-[#1F2937]">{previewReport.best}</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-3">
                  <p className="text-xs font-bold text-orange-500">가장 아쉬운 습관</p>
                  <p className="mt-1 font-black text-[#1F2937]">{previewReport.worst}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-500">
              선택한 기간에 저장된 리포트가 없어요. 습관 기록 후 리포트를 생성해주세요.
            </p>
          )}
        </section>

        {reportLogs.length > 0 && (
          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
              <BarChart3 className="text-[#4CAF6A]" size={20} />
              항목별 달성률
            </h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4CAF6A" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {mode === "monthly" && (monthlyInsight || insightLoading) && (
          <section className="mt-4 rounded-3xl border border-green-100 bg-[#EAF7EF] p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1F2937]">검진 연계 코멘트</h2>
            <p className="mt-3 rounded-2xl bg-white p-4 text-sm font-black leading-relaxed text-[#1F5A3A]">
              {insightLoading ? "검진 수치와 이번 달 습관을 연결해 보고 있어요..." : monthlyInsight}
            </p>
          </section>
        )}

        {previewReport && (
          <section className="mt-4 rounded-3xl border border-green-100 bg-[#EAF7EF] p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
              <Target className="text-[#4CAF6A]" size={20} />
              {mode === "weekly" ? "다음 주 목표" : "다음 달 목표"}
            </h2>
            <p className="mt-3 rounded-2xl bg-white p-4 text-sm font-black leading-relaxed text-[#1F5A3A]">
              {previewReport.nextWeekGoal}
            </p>
          </section>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
