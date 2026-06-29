"use client";

import { useState } from "react";
import { Droplets, Dumbbell, Footprints, Moon, Utensils, X } from "lucide-react";
import { buildLifestyleScoreItems } from "@/lib/lifestyleScore";
import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import type { LifestyleScoreItem, LifestyleScoreItemId } from "@/lib/lifestyleScore";

type ScoreItem = LifestyleScoreItem & {
  icon: typeof Footprints;
};

type ScoreRule = {
  key: string;
  range: string;
  score: string;
};

type ScoreDetail = {
  title: string;
  rules: ScoreRule[];
  evidence: string[];
  source: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  totalScore: number;
  dailyLog: DailyLog;
  meals: MealAnalysis[];
};

const DETAILS: Record<LifestyleScoreItemId, ScoreDetail> = {
  activity: {
    title: "신체활동 배점 기준",
    rules: [
      { key: "7000", range: "7,000보 이상", score: "35점" },
      { key: "5600", range: "5,600보 이상", score: "28점" },
      { key: "4200", range: "4,200보 이상", score: "21점" },
      { key: "2800", range: "2,800보 이상", score: "14점" },
      { key: "2000", range: "2,000보 이상", score: "10점" },
      { key: "under2000", range: "2,000보 미만", score: "0점" },
    ],
    evidence: [
      "WHO 신체활동 가이드라인(2020)에 따르면 신체활동 가이드라인 준수 시 전체 사망률이 29% 감소합니다.",
      "미국 국립보건원(NIH)·매사추세츠대 연구팀의 추적 연구에서는 하루 7,000보가 조기 사망률을 크게 낮추며 10,000보와 효과가 유사하다고 보고했습니다.",
      "2,300보부터 심혈관 사망 위험 감소가 시작되고, 5,000보부터 고혈압·우울증 위험 감소, 7,000보부터 당뇨 위험 감소 효과가 나타납니다.",
    ],
    source: "WHO, NIH, JAMA Network Open 2021",
  },
  meal: {
    title: "식단 배점 기준",
    rules: [
      { key: "threeVeg", range: "3끼 이상 + 채소 O", score: "25점" },
      { key: "twoVeg", range: "2끼 + 채소 O", score: "18점" },
      { key: "threeNoVeg", range: "3끼 이상 + 채소 X", score: "15점" },
      { key: "twoNoVeg", range: "2끼 + 채소 X", score: "10점" },
      { key: "one", range: "1끼 이하", score: "0점" },
    ],
    evidence: [
      "전 세계 사망원인의 22%가 나쁜 식사행동과 관련이 있습니다.",
      "보건복지부 한국인 식생활지침(2021)은 매일 신선한 채소·과일과 함께 균형 잡힌 식사를 권고합니다.",
      "하루 세 끼 규칙적인 식사와 채소 섭취가 핵심 기준입니다.",
    ],
    source: "보건복지부, 질병관리청 2019",
  },
  sleep: {
    title: "수면 배점 기준",
    rules: [
      { key: "optimal", range: "7시간 이상 ~ 9시간 이하", score: "25점" },
      { key: "short", range: "6시간 이상 ~ 7시간 미만", score: "17점" },
      { key: "long", range: "9시간 초과 ~ 10시간 이하", score: "17점" },
      { key: "low", range: "5시간 이상 ~ 6시간 미만", score: "8점" },
      { key: "out", range: "5시간 미만 / 10시간 초과", score: "0점" },
    ],
    evidence: [
      "WHO는 성인 수면 권고시간을 7~9시간으로 설정합니다.",
      "국내 연구에서는 수면 5시간 이하·9시간 이상 집단에서 건강 관련 삶의 질 점수가 가장 낮았습니다.",
      "만성 수면 부족은 심혈관 질환 위험, 인슐린 저항성, 면역력 저하, 식욕 호르몬 이상과 관련됩니다.",
    ],
    source: "WHO, 2015 국민건강영양조사",
  },
  water: {
    title: "음수 배점 기준",
    rules: [
      { key: "eight", range: "8잔 이상 (1.6L)", score: "15점" },
      { key: "six", range: "6잔 이상 (1.2L)", score: "12점" },
      { key: "four", range: "4잔 이상 (0.8L)", score: "8점" },
      { key: "two", range: "2잔 이상 (0.4L)", score: "4점" },
      { key: "one", range: "1잔 이하", score: "0점" },
    ],
    evidence: [
      "보건복지부 2020 영양소 섭취기준에 따르면 성인의 하루 총 수분 섭취 권장량은 1,900~2,600mL입니다.",
      "한국인은 음식으로 약 1~1.5L를 섭취하므로 별도 음수 목표는 하루 1.5L, 약 7~8잔입니다.",
      "음수 단독 항목은 다른 생활습관 대비 사망률 직접 영향이 상대적으로 낮아 15점 배점이 적용됩니다.",
    ],
    source: "보건복지부 2020 영양소 섭취기준, WHO",
  },
  exercise: {
    title: "운동 실천 보너스 기준",
    rules: [
      { key: "on", range: "운동 실천 ON", score: "+10점" },
      { key: "off", range: "운동 실천 OFF", score: "0점" },
    ],
    evidence: [
      "WHO 신체활동 가이드라인(2020)은 성인에게 주 150~300분 유산소운동 외 주 2회 이상 근력운동을 별도 권고합니다.",
      "걸음수로 측정되지 않는 헬스·수영·자전거·요가 등의 운동을 반영하기 위한 보너스 항목입니다.",
    ],
    source: "WHO Physical Activity Guidelines 2020",
  },
};

export default function HealthScoreSheet({ open, onClose, totalScore, dailyLog, meals }: Props) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScoreItem | null>(null);
  const [detailTab, setDetailTab] = useState<"table" | "evidence">("table");

  const icons: Record<LifestyleScoreItemId, typeof Footprints> = {
    activity: Footprints,
    meal: Utensils,
    sleep: Moon,
    water: Droplets,
    exercise: Dumbbell,
  };
  const items: ScoreItem[] = buildLifestyleScoreItems(dailyLog, meals).map((item) => ({
    ...item,
    icon: icons[item.id],
  }));

  if (!open) return null;

  const openDetail = (item: ScoreItem) => {
    setSelectedItem(item);
    setDetailTab("table");
  };

  const closeByDrag = (clientY: number) => {
    if (dragStartY !== null && clientY - dragStartY > 80) onClose();
    setDragStartY(null);
  };

  const detail = selectedItem ? DETAILS[selectedItem.id] : null;

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
              <span className="pb-1 text-lg font-bold text-[#4CAF50]">/ 110</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">생활습관 4개 항목 100점에 운동 실천 보너스 10점을 참고 지표로 함께 보여줘요.</p>
          </section>

          <div className="mt-3 space-y-3">
            {items.map((item) => {
              const Icon = item.icon;
              const percent = Math.min(100, Math.round((item.score / item.maxScore) * 100));
              return (
                <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[#4CAF50]">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-[#1F2937]">{item.title}</p>
                        <p className="text-sm font-black text-[#24944E]">
                          {item.score} / {item.maxScore}
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-600">{item.valueText}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#4CAF50] transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.formula}</p>
                      <button
                        className="mt-3 rounded-full border border-green-100 bg-[#F2FAF4] px-3 py-1.5 text-xs font-bold text-[#1F5A3A]"
                        type="button"
                        onClick={() => openDetail(item)}
                      >
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

      {selectedItem && detail && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <section className="max-h-[78vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-xs font-black text-[#4CAF50]">{selectedItem.title}</p>
                <h3 className="text-lg font-black text-[#1F2937]">{detail.title}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500" aria-label="배점 기준 닫기">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-gray-50 p-1">
              <button
                className={`rounded-2xl py-2 text-sm font-black ${detailTab === "table" ? "bg-white text-[#24944E] shadow-sm" : "text-gray-500"}`}
                type="button"
                onClick={() => setDetailTab("table")}
              >
                배점표
              </button>
              <button
                className={`rounded-2xl py-2 text-sm font-black ${detailTab === "evidence" ? "bg-white text-[#24944E] shadow-sm" : "text-gray-500"}`}
                type="button"
                onClick={() => setDetailTab("evidence")}
              >
                근거자료
              </button>
            </div>

            <div className="max-h-[calc(78vh-126px)] overflow-y-auto p-4">
              {detailTab === "table" ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  {detail.rules.map((rule) => {
                    const active = rule.key === selectedItem.currentKey;
                    return (
                      <div key={rule.key} className={`flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${active ? "bg-[#EAF7EF]" : "bg-white"}`}>
                        <span className={`text-sm font-bold ${active ? "text-[#1F5A3A]" : "text-gray-600"}`}>{rule.range}</span>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${active ? "bg-[#4CAF50] text-white" : "bg-gray-100 text-gray-500"}`}>{rule.score}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                  {detail.evidence.map((line) => (
                    <p key={line} className="text-xs leading-relaxed text-gray-600">
                      {line}
                    </p>
                  ))}
                  <p className="pt-2 text-xs leading-relaxed text-gray-500">
                    <strong className="text-gray-700">출처:</strong> {detail.source}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

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
