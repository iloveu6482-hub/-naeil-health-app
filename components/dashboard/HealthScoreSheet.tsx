"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Footprints, Moon, Droplets, Utensils, X } from "lucide-react";
import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";

type ScoreItem = {
  id: string;
  icon: typeof Footprints;
  title: string;
  valueText: string;
  score: number;
  maxScore: number;
  formula: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  totalScore: number;
  dailyLog: DailyLog;
  meals: MealAnalysis[];
};

function activityScore(steps: number) {
  if (steps < 2000) return 0;
  return Math.min(35, Math.floor(steps / 200));
}

function mealScore(mealsCount: number) {
  if (mealsCount <= 1) return 0;
  if (mealsCount === 2) return 18;
  return 25;
}

function sleepScore(hours: number) {
  if (hours >= 7 && hours <= 9) return 25;
  if ((hours >= 6 && hours < 7) || (hours > 9 && hours <= 10)) return 17;
  if (hours >= 5 && hours < 6) return 8;
  return 0;
}

function waterScore(cups: number) {
  if (cups <= 1) return 0;
  return Math.min(15, Math.floor(cups * 2));
}

export default function HealthScoreSheet({ open, onClose, totalScore, dailyLog, meals }: Props) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  const todayMealCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const recordedMeals = meals.filter((meal) => meal.mealDate === today && meal.mealType !== "snack").length;
    return Math.max(recordedMeals, dailyLog.mealsCount || 0);
  }, [dailyLog.mealsCount, meals]);

  const items: ScoreItem[] = [
    {
      id: "activity",
      icon: Footprints,
      title: "신체활동",
      valueText: `오늘 ${dailyLog.steps.toLocaleString()}보 걸었어요`,
      score: activityScore(dailyLog.steps),
      maxScore: 35,
      formula: dailyLog.steps < 2000 ? "2,000보 미만 = 0점" : `${dailyLog.steps.toLocaleString()}보 ÷ 200 = ${Math.floor(dailyLog.steps / 200)} → 상한 35점`,
    },
    {
      id: "meal",
      icon: Utensils,
      title: "식단",
      valueText: `오늘 ${todayMealCount}끼 기록했어요`,
      score: mealScore(todayMealCount),
      maxScore: 25,
      formula: todayMealCount >= 3 ? "3끼 이상 + 채소 기준 = 25점" : todayMealCount === 2 ? "2끼 + 채소 기준 = 18점" : "1끼 이하 = 0점",
    },
    {
      id: "sleep",
      icon: Moon,
      title: "수면",
      valueText: `오늘 ${dailyLog.sleepHours}시간 잤어요`,
      score: sleepScore(dailyLog.sleepHours),
      maxScore: 25,
      formula: dailyLog.sleepHours >= 7 && dailyLog.sleepHours <= 9 ? "7~9시간 최적 구간 = 25점" : `${dailyLog.sleepHours}시간 수면 구간 점수 반영`,
    },
    {
      id: "water",
      icon: Droplets,
      title: "음수",
      valueText: `오늘 물 ${dailyLog.waterCups}잔 마셨어요`,
      score: waterScore(dailyLog.waterCups),
      maxScore: 15,
      formula: dailyLog.waterCups <= 1 ? "1잔 이하 = 0점" : `${dailyLog.waterCups}잔 × 2 = ${dailyLog.waterCups * 2} → 상한 15점`,
    },
    {
      id: "exercise",
      icon: Dumbbell,
      title: "운동 실천",
      valueText: dailyLog.exerciseDone ? "오늘 별도 운동을 실천했어요" : "오늘 별도 운동 기록이 없어요",
      score: dailyLog.exerciseDone ? 5 : 0,
      maxScore: 5,
      formula: dailyLog.exerciseDone ? "운동 실천 ON = 보너스 5점" : "운동 실천 OFF = 0점",
    },
  ];

  if (!open) return null;

  const closeByDrag = (clientY: number) => {
    if (dragStartY !== null && clientY - dragStartY > 80) onClose();
    setDragStartY(null);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/35" role="dialog" aria-modal="true" aria-label="오늘 내 점수 분석">
      <button className="absolute inset-0 cursor-default" aria-label="점수 분석 닫기" onClick={onClose} />
      <section
        className="relative h-[85vh] w-full overflow-hidden rounded-t-[28px] bg-[#FAFCFA] shadow-[0_-20px_60px_rgba(0,0,0,0.22)] animate-[slideUp_0.24s_ease-out]"
        onPointerDown={(event) => setDragStartY(event.clientY)}
        onPointerUp={(event) => closeByDrag(event.clientY)}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-xs font-black text-[#4CAF50]">오늘의 건강관리 참고 점수</p>
            <h2 className="text-xl font-black text-[#1F2937]">오늘 내 점수 분석</h2>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm" aria-label="닫기">
            <X size={19} />
          </button>
        </div>

        <div className="h-[calc(85vh-86px)] overflow-y-auto px-4 pb-6">
          <section className="rounded-3xl bg-gradient-to-br from-[#EAF7EF] to-white p-4 shadow-sm ring-1 ring-green-100">
            <p className="text-sm font-bold text-gray-500">총점</p>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-5xl font-black leading-none text-[#24944E]">{totalScore}</span>
              <span className="pb-1 text-lg font-bold text-[#4CAF50]">/ 100</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">생활습관 4개 항목 100점에 운동 실천 보너스 5점을 참고 지표로 함께 보여줘요.</p>
          </section>

          <div className="mt-3 space-y-3">
            {items.map(({ id, icon: Icon, title, valueText, score, maxScore, formula }) => {
              const percent = Math.min(100, Math.round((score / maxScore) * 100));
              return (
                <article key={id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[#4CAF50]">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-[#1F2937]">{title}</p>
                        <p className="text-sm font-black text-[#24944E]">{score} / {maxScore}</p>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-600">{valueText}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#4CAF50] transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{formula}</p>
                      <button className="mt-3 rounded-full border border-green-100 bg-[#F2FAF4] px-3 py-1.5 text-xs font-bold text-[#1F5A3A]" type="button">
                        배점 기준 보기
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
