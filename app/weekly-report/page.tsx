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
type WeekRangeType = "this" | "last";

type WeekLogPayload = {
  date: string;
  score: number;
  sleep: number;
  diet: "good" | "normal" | "bad";
  exercise: number;
  water: number;
  noSmoking: boolean;
};

type WeeklyReportApiResponse = {
  weekScore: number;
  grade: "훌륭해요" | "잘하고 있어요" | "조금 더 힘내요" | "다시 시작해요";
  best: string;
  worst: string;
  message: string;
  nextWeekGoal: string;
};

type WeeklyReportRecord = WeeklyReportApiResponse & {
  id: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
};

type CheckupRecord = {
  date?: string;
  checkupDate?: string;
  [key: string]: unknown;
};

const gradeFallbacks: Array<{ min: number; grade: WeeklyReportApiResponse["grade"] }> = [
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

function getCoachId(id?: string | null): WeeklyCoachId {
  if (id === "onyu" || id === "onyou") return "onyu";
  if (id === "haru") return "haru";
  if (id === "taeo" || id === "kangtaeo") return "kangtaeo";
  if (id === "rumi" || id === "lumi") return "rumi";
  return "haru";
}

function buildWeekLogs(logs: DailyLog[], start: string, end: string): WeekLogPayload[] {
  return logs
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

function makeFallbackReport(weekLogs: WeekLogPayload[]): WeeklyReportApiResponse {
  const weekScore = average(weekLogs.map((log) => log.score));
  const grade = gradeFallbacks.find((item) => weekScore >= item.min)?.grade || "다시 시작해요";
  const sleepScore = average(weekLogs.map((log) => calculateSleepScore(log.sleep)));
  const waterScore = average(weekLogs.map((log) => calculateWaterScore(log.water)));
  const exerciseScore = average(weekLogs.map((log) => (log.exercise > 0 ? 35 : 0)));
  const dietScore = average(weekLogs.map((log) => (log.diet === "good" ? 25 : log.diet === "normal" ? 15 : 5)));
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
    message: "이번 주 기록을 기준으로 생활 습관 흐름을 확인했어요. 잘된 항목은 유지하고, 아쉬운 항목은 하나만 골라 다음 주에 가볍게 보완해봐요.",
    nextWeekGoal: `${items[items.length - 1]?.label || "습관"} 기록을 3일 이상 실천하기`,
  };
}

function isWeeklyReportApiResponse(value: unknown): value is WeeklyReportApiResponse {
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

export default function WeeklyReportPage() {
  const [rangeType, setRangeType] = useState<WeekRangeType>("this");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [reports, setReports] = useState<WeeklyReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLogs(getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []));
    setReports(getFromStorage<WeeklyReportRecord[]>(STORAGE_KEYS.WEEKLY_REPORTS, []));
  }, []);

  const range = useMemo(() => getWeekRange(rangeType), [rangeType]);
  const weekLogs = useMemo(() => buildWeekLogs(logs, range.start, range.end), [logs, range.end, range.start]);
  const currentReport = reports.find((report) => report.weekStart === range.start && report.weekEnd === range.end);
  const previewReport = currentReport || (weekLogs.length > 0 ? makeFallbackReport(weekLogs) : null);
  const chartData = useMemo(
    () => [
      { name: "수면", value: average(weekLogs.map((log) => calculateSleepScore(log.sleep))) },
      { name: "식단", value: average(weekLogs.map((log) => (log.diet === "good" ? 25 : log.diet === "normal" ? 15 : 5))) },
      { name: "운동", value: average(weekLogs.map((log) => (log.exercise > 0 ? 35 : 0))) },
      { name: "수분", value: average(weekLogs.map((log) => calculateWaterScore(log.water))) },
    ],
    [weekLogs]
  );

  const createReport = async () => {
    setMessage("");
    if (weekLogs.length === 0) {
      setMessage("선택한 주차에 습관 기록이 없어요.");
      return;
    }

    setLoading(true);
    const coachId = getCoachId(getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, "haru"));
    const checkups = getFromStorage<CheckupRecord[]>(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, []);
    const recentCheckup = [...checkups]
      .sort((a, b) => String(b.date || b.checkupDate || "").localeCompare(String(a.date || a.checkupDate || "")))
      [0] || null;

    let apiReport: WeeklyReportApiResponse | null = null;
    try {
      const response = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekLogs, coachId, recentCheckup }),
      });
      const result = (await response.json()) as unknown;
      if (response.ok && isWeeklyReportApiResponse(result)) {
        apiReport = result;
      }
    } catch (error) {
      console.error("Weekly report request failed", error);
    }

    const report: WeeklyReportRecord = {
      ...(apiReport || makeFallbackReport(weekLogs)),
      id: globalThis.crypto?.randomUUID?.() || `weekly-${Date.now()}`,
      weekStart: range.start,
      weekEnd: range.end,
      generatedAt: new Date().toISOString(),
    };

    const nextReports = [
      ...reports.filter((item) => !(item.weekStart === range.start && item.weekEnd === range.end)),
      report,
    ].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    saveToStorage(STORAGE_KEYS.WEEKLY_REPORTS, nextReports);
    setReports(nextReports);
    setLoading(false);
  };

  return (
    <MobileShell>
      <AppHeader title="주간 리포트" showBack backHref="/dashboard" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 pb-24 pt-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-green-100">
            <CalendarDays size={17} />
            {range.start} ~ {range.end}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/12 p-1">
            {[
              { id: "this", label: "이번 주" },
              { id: "last", label: "저번 주" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setRangeType(item.id as WeekRangeType)}
                className={`rounded-xl py-2 text-sm font-black transition ${
                  rangeType === item.id ? "bg-white text-[#1F5A3A]" : "text-white/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-green-100">7일 평균 점수</p>
              <p className="mt-1 text-5xl font-black">{previewReport?.weekScore ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white/16 px-4 py-3 text-right">
              <p className="text-xs text-green-100">등급</p>
              <p className="font-black">{previewReport?.grade || "리포트 없음"}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
                <Trophy className="text-[#F7C948]" size={20} />
                코치 총평
              </h2>
              <p className="mt-1 text-xs text-gray-500">{weekLogs.length}일 기록 기준</p>
            </div>
            <button
              onClick={createReport}
              disabled={loading}
              className="flex min-h-10 items-center gap-2 rounded-full bg-[#4CAF6A] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {currentReport ? "다시 생성" : "이번 주 리포트 보기"}
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
              선택한 주차에 저장된 리포트가 없어요. 습관 기록 후 리포트를 생성해주세요.
            </p>
          )}
        </section>

        {weekLogs.length > 0 && (
          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
              <BarChart3 className="text-[#4CAF6A]" size={20} />
              항목별 평균
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

        {previewReport && (
          <section className="mt-4 rounded-3xl border border-green-100 bg-[#EAF7EF] p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1F2937]">
              <Target className="text-[#4CAF6A]" size={20} />
              다음 주 목표
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
