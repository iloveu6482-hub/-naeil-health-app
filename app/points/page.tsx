"use client";

import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculatePointBalance } from "@/lib/rewards";
import { samplePointTransactions } from "@/lib/sampleData";
import type { PointTransaction } from "@/types/reward";
import { Sprout, TrendingUp, TrendingDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function PointsPage() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);

  useEffect(() => {
    const txs = getFromStorage<PointTransaction[]>(
      STORAGE_KEYS.POINT_TRANSACTIONS,
      samplePointTransactions
    );
    setTransactions([...txs].reverse());

    const handler = () => {
      const updated = getFromStorage<PointTransaction[]>(
        STORAGE_KEYS.POINT_TRANSACTIONS,
        samplePointTransactions
      );
      setTransactions([...updated].reverse());
    };
    window.addEventListener("pointsUpdated", handler);
    return () => window.removeEventListener("pointsUpdated", handler);
  }, []);

  const allTxs = [...transactions].reverse();
  const balance = calculatePointBalance(allTxs);
  const totalEarned = allTxs.filter((t) => t.type === "earn").reduce((s, t) => s + t.amount, 0);
  const totalSpent = allTxs.filter((t) => t.type === "spend").reduce((s, t) => s + t.amount, 0);

  const today = new Date().toISOString().split("T")[0];
  const todayEarned = allTxs
    .filter((t) => t.type === "earn" && t.createdAt.startsWith(today))
    .reduce((s, t) => s + t.amount, 0);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekEarned = allTxs
    .filter((t) => t.type === "earn" && new Date(t.createdAt) >= oneWeekAgo)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <MobileShell>
      <AppHeader title="건강씨앗 지갑" showBack backHref="/dashboard" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Wallet Hero */}
        <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 py-8 text-white text-center">
          <p className="text-green-100 text-sm mb-2">현재 보유 건강씨앗</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sprout size={32} className="text-green-200" />
            <span className="text-5xl font-extrabold">{balance.toLocaleString()}</span>
          </div>
          <p className="text-green-100 text-sm font-medium">건강씨앗</p>
        </div>

        {/* Stats */}
        <div className="px-4 -mt-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: "오늘 획득", value: todayEarned },
              { label: "이번 주 획득", value: weekEarned },
              { label: "전체 사용", value: totalSpent },
            ].map(({ label, value }) => (
              <div key={label} className="py-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-extrabold text-[#1F2937]">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 mb-4">
          <div className="bg-[#EAF7EF] rounded-2xl p-4 flex justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#4CAF6A]" />
              <div>
                <p className="text-xs text-gray-500">전체 획득</p>
                <p className="font-bold text-[#1F5A3A]">{totalEarned.toLocaleString()} 씨앗</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-orange-400" />
              <div>
                <p className="text-xs text-gray-500">전체 사용</p>
                <p className="font-bold text-orange-600">{totalSpent.toLocaleString()} 씨앗</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-4">
          <h3 className="font-bold text-[#1F2937] mb-3">획득·사용 내역</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <p>아직 내역이 없습니다</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i < transactions.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        tx.type === "earn" ? "bg-[#EAF7EF]" : "bg-orange-50"
                      }`}
                    >
                      <Sprout
                        size={18}
                        className={tx.type === "earn" ? "text-[#4CAF6A]" : "text-orange-400"}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">{tx.reason}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-base ${
                      tx.type === "earn" ? "text-[#4CAF6A]" : "text-orange-500"
                    }`}
                  >
                    {tx.type === "earn" ? "+" : "-"}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
