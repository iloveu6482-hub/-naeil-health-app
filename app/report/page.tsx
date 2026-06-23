"use client";

import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import ProgressRing from "@/components/common/ProgressRing";
import { generateRuleBasedReport } from "@/lib/aiReport";
import { getScoreColor, getScoreLabel } from "@/lib/healthRules";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import { sampleCheckup, sampleDailyLog } from "@/lib/sampleData";
import type { AiHealthReport } from "@/types/report";
import { CheckCircle2, AlertCircle, Lightbulb, Target, MessageCircle, AlertTriangle } from "lucide-react";

export default function ReportPage() {
  const [report, setReport] = useState<AiHealthReport | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkup = getFromStorage(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<typeof sampleDailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const log = logs[logs.length - 1] || sampleDailyLog;
    const r = generateRuleBasedReport(checkup, log);
    setReport(r);

    const txs = getFromStorage(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    if (!hasEarnedTodayForReason(txs, "AI 건강 리포트 확인")) {
      const tx = createEarnTransaction("user-001", 20, "AI 건강 리포트 확인");
      addPointTransaction(tx);
      window.dispatchEvent(new Event("pointsUpdated"));
      setShowToast(true);
    }
  }, []);

  if (!report) return null;

  const scoreColor = getScoreColor(report.healthScore);
  const scoreLabel = getScoreLabel(report.healthScore);

  return (
    <MobileShell>
      <AppHeader title="AI 건강 리포트" showBack backHref="/dashboard" />
      <RewardToast
        message="AI 리포트 확인 완료!"
        points={20}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Score Hero */}
        <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 py-8 text-white text-center">
          <p className="text-green-100 text-sm mb-4">건강관리 참고 점수</p>
          <div className="flex justify-center mb-4">
            <ProgressRing
              value={report.healthScore}
              size={120}
              strokeWidth={12}
              color="rgba(255,255,255,0.9)"
              label={`${report.healthScore}`}
            />
          </div>
          <p className="text-xl font-bold">{scoreLabel}</p>
          <p className="text-sm text-green-100 mt-2 leading-relaxed max-w-[260px] mx-auto">
            {report.summary}
          </p>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Good Points */}
          {report.goodPoints.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={20} className="text-[#4CAF6A]" />
                <h3 className="font-bold text-[#1F2937]">잘 관리되고 있는 부분</h3>
              </div>
              <div className="flex flex-col gap-2">
                {report.goodPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#EAF7EF] rounded-xl px-3 py-2">
                    <span className="text-[#4CAF6A] mt-0.5">✓</span>
                    <p className="text-sm text-[#1F5A3A]">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caution Points */}
          {report.cautionPoints.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={20} className="text-[#F59E0B]" />
                <h3 className="font-bold text-[#1F2937]">관리가 필요한 항목</h3>
              </div>
              <div className="flex flex-col gap-2">
                {report.cautionPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 bg-orange-50 rounded-xl px-3 py-2">
                    <span className="text-[#F59E0B] mt-0.5">!</span>
                    <p className="text-sm text-orange-800">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={20} className="text-[#F7C948]" />
                <h3 className="font-bold text-[#1F2937]">추천 생활습관</h3>
              </div>
              <div className="flex flex-col gap-2">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 bg-yellow-50 rounded-xl px-3 py-2">
                    <span className="text-[#F7C948] font-bold mt-0.5">{i + 1}</span>
                    <p className="text-sm text-yellow-900">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Mission */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Target size={20} className="text-[#4CAF6A]" />
              <h3 className="font-bold text-[#1F2937]">이번 주 실천 미션</h3>
            </div>
            <div className="flex flex-col gap-2">
              {report.weeklyMission.map((mission, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#EAF7EF] rounded-xl px-3 py-3">
                  <div className="w-6 h-6 bg-[#4CAF6A] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-[#1F5A3A]">{mission}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Message */}
          <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-[#4CAF6A] rounded-full flex items-center justify-center text-xl flex-shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <MessageCircle size={14} className="text-[#4CAF6A]" />
                <p className="text-xs font-semibold text-[#4CAF6A]">건강이의 코칭 한마디</p>
              </div>
              <p className="text-sm text-[#1F2937] leading-relaxed">{report.coachMessage}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">{report.disclaimer}</p>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
