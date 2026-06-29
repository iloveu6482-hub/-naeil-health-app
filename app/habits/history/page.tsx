"use client";

import { useEffect, useMemo, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import {
  calculateActivityScore,
  calculateMealScore,
  calculateSleepScore,
  calculateWaterScore,
} from "@/lib/lifestyleScore";
import type { DailyLog } from "@/types/health";
import { CalendarDays, Droplets, Footprints, Moon, UtensilsCrossed } from "lucide-react";

type PeriodPreset = "week" | "month" | "all";

const periodPresets: Array<{ id: PeriodPreset; label: string; days?: number }> = [
  { id: "week", label: "최근 7일", days: 7 },
  { id: "month", label: "최근 30일", days: 30 },
  { id: "all", label: "전체" },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStartDate(days?: number) {
  if (!days) return "";
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return toDateKey(date);
}

function calculateLogScore(log: DailyLog) {
  return Math.min(
    100,
    calculateActivityScore(log.steps) +
      calculateSleepScore(log.sleepHours) +
      calculateWaterScore(log.waterCups) +
      calculateMealScore(log.mealsCount) +
      (log.exerciseDone ? 5 : 0)
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function compactLogsByDate(logs: DailyLog[]) {
  const map = new Map<string, DailyLog>();
  logs.forEach((log) => {
    const previous = map.get(log.logDate);
    if (!previous || log.id.localeCompare(previous.id) >= 0) {
      map.set(log.logDate, log);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.logDate.localeCompare(a.logDate));
}

export default function HabitHistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [preset, setPreset] = useState<PeriodPreset>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const storedLogs = compactLogsByDate(getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []));
    const today = toDateKey(new Date());
    setLogs(storedLogs);
    setStartDate(getStartDate(7));
    setEndDate(today);
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (startDate && log.logDate < startDate) return false;
        if (endDate && log.logDate > endDate) return false;
        return true;
      }),
    [endDate, logs, startDate]
  );

  const summary = useMemo(
    () => ({
      score: Math.round(average(filteredLogs.map(calculateLogScore))),
      steps: Math.round(average(filteredLogs.map((log) => log.steps))),
      sleep: average(filteredLogs.map((log) => log.sleepHours)),
      water: average(filteredLogs.map((log) => log.waterCups)),
      meals: average(filteredLogs.map((log) => log.mealsCount)),
    }),
    [filteredLogs]
  );

  const applyPreset = (nextPreset: PeriodPreset) => {
    const option = periodPresets.find((item) => item.id === nextPreset);
    setPreset(nextPreset);
    setEndDate(toDateKey(new Date()));
    setStartDate(getStartDate(option?.days));
  };

  return (
    <MobileShell>
      <AppHeader title="습관 기록 조회" showBack backHref="/habits" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 pb-24 pt-4">
        <section className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
          <h1 className="flex items-center gap-2 text-xl font-black text-[#1F2937]">
            <CalendarDays className="text-[#4CAF6A]" size={22} />
            기간별 기록
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            원하는 기간을 선택해서 걸음, 수면, 수분, 식사 기록을 확인해요.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {periodPresets.map((item) => (
              <button
                key={item.id}
                onClick={() => applyPreset(item.id)}
                className={`min-h-10 rounded-2xl text-sm font-black transition ${
                  preset === item.id ? "bg-[#4CAF6A] text-white shadow-sm" : "bg-[#F7FBF8] text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="text-xs font-bold text-gray-500">시작일</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setPreset("all");
                  setStartDate(event.target.value);
                }}
                className="mt-2 w-full bg-transparent text-sm font-black text-[#1F2937] outline-none"
              />
            </label>
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="text-xs font-bold text-gray-500">종료일</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setPreset("all");
                  setEndDate(event.target.value);
                }}
                className="mt-2 w-full bg-transparent text-sm font-black text-[#1F2937] outline-none"
              />
            </label>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
          <p className="text-sm font-bold text-green-100">조회된 기록 {filteredLogs.length}일</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-sm text-green-100">평균 습관 점수</p>
              <p className="text-5xl font-black">{summary.score}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-right">
              <p className="text-xs text-green-100">기간</p>
              <p className="text-sm font-black">{startDate || "처음"} ~ {endDate || "오늘"}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "평균 걸음", value: `${summary.steps.toLocaleString()}보`, icon: Footprints, color: "text-[#24944E]" },
            { label: "평균 수면", value: `${summary.sleep}시간`, icon: Moon, color: "text-[#4E66B1]" },
            { label: "평균 수분", value: `${summary.water}잔`, icon: Droplets, color: "text-[#27A9D6]" },
            { label: "평균 식사", value: `${summary.meals}회`, icon: UtensilsCrossed, color: "text-[#E58A2B]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <Icon className={color} size={22} />
              <p className="mt-3 text-xs font-bold text-gray-500">{label}</p>
              <p className="mt-1 text-xl font-black text-[#1F2937]">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-[#1F2937]">기록 목록</h2>
          <div className="mt-3 space-y-2">
            {filteredLogs.map((log) => (
              <div key={`${log.logDate}-${log.id}`} className="flex items-center justify-between rounded-2xl bg-[#F7FBF8] px-4 py-3">
                <div>
                  <p className="text-sm font-black text-[#1F2937]">{log.logDate}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {log.steps.toLocaleString()}보 · {log.sleepHours}시간 · 물 {log.waterCups}잔 · 식사 {log.mealsCount}회
                  </p>
                </div>
                <span className="text-lg font-black text-[#4CAF6A]">{calculateLogScore(log)}</span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <p className="rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-500">
                선택한 기간에 저장된 습관 기록이 없어요.
              </p>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
