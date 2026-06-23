"use client";

import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleRewardBadges, samplePointTransactions } from "@/lib/sampleData";
import type { RewardBadge, PointTransaction } from "@/types/reward";
import { Trophy, Lock, Sprout } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const badgeEmojis: Record<string, string> = {
  "badge-001": "🏥",
  "badge-002": "📊",
  "badge-003": "👟",
  "badge-004": "💧",
  "badge-005": "📅",
  "badge-006": "🌱",
};

export default function RewardsPage() {
  const [badges, setBadges] = useState<RewardBadge[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);

  useEffect(() => {
    const savedBadges = getFromStorage<RewardBadge[]>(STORAGE_KEYS.REWARD_BADGES, sampleRewardBadges);
    setBadges(savedBadges);
    const txs = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
    setTransactions([...txs].reverse());
  }, []);

  const earned = badges.filter((b) => b.earnedAt);
  const notEarned = badges.filter((b) => !b.earnedAt);

  return (
    <MobileShell>
      <AppHeader title="보상 내역" showBack backHref="/dashboard" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#F7C948] to-[#F59E0B] px-6 py-6 text-white text-center">
          <Trophy size={32} className="mx-auto mb-2" />
          <h2 className="text-xl font-extrabold">나의 보상 내역</h2>
          <p className="text-yellow-100 text-sm mt-1">
            획득한 배지: {earned.length}개 / 전체 {badges.length}개
          </p>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Earned Badges */}
          <div>
            <h3 className="font-bold text-[#1F2937] mb-3 flex items-center gap-2">
              <span className="text-[#F7C948]">⭐</span>
              획득한 배지 ({earned.length})
            </h3>
            {earned.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl py-8 text-center text-gray-400">
                아직 획득한 배지가 없습니다
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {earned.map((badge) => (
                  <div key={badge.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7C948]/40">
                    <div className="text-3xl mb-2">{badgeEmojis[badge.id] || "🏆"}</div>
                    <p className="font-bold text-[#1F2937] text-sm">{badge.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-xs text-[#4CAF6A] mt-2 font-medium">
                        ✓ {formatDateTime(badge.earnedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Not Earned Badges */}
          {notEarned.length > 0 && (
            <div>
              <h3 className="font-bold text-[#1F2937] mb-3 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                도전 중인 배지 ({notEarned.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {notEarned.map((badge) => (
                  <div key={badge.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 opacity-60">
                    <div className="text-3xl mb-2 grayscale">{badgeEmojis[badge.id] || "🔒"}</div>
                    <p className="font-bold text-gray-500 text-sm">{badge.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{badge.condition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Point History */}
          <div>
            <h3 className="font-bold text-[#1F2937] mb-3 flex items-center gap-2">
              <Sprout size={16} className="text-[#4CAF6A]" />
              건강씨앗 획득 기록
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {transactions.filter((t) => t.type === "earn").length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">아직 내역이 없습니다</div>
              ) : (
                transactions
                  .filter((t) => t.type === "earn")
                  .slice(0, 10)
                  .map((tx, i, arr) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < arr.length - 1 ? "border-b border-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EAF7EF] rounded-full flex items-center justify-center">
                          <Sprout size={16} className="text-[#4CAF6A]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1F2937]">{tx.reason}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#4CAF6A]">+{tx.amount}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Next Mission */}
          <div className="bg-[#EAF7EF] rounded-2xl p-4">
            <p className="font-bold text-[#1F5A3A] mb-2">🎯 다음에 도전해볼 미션</p>
            <div className="flex flex-col gap-1.5">
              {[
                "챌린지 1개 완료하기 (+100씨앗)",
                "7일 연속 생활습관 기록 (+100씨앗)",
                "아바타 상점에서 아이템 구매",
              ].map((m, i) => (
                <p key={i} className="text-sm text-[#1F2937] flex items-center gap-1.5">
                  <span className="text-[#4CAF6A] font-bold">{i + 1}.</span>
                  {m}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
