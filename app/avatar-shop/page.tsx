"use client";

import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import {
  calculatePointBalance,
  canPurchaseItem,
  purchaseAvatarItem,
  equipAvatarItem,
  createSpendTransaction,
  addPointTransaction,
} from "@/lib/rewards";
import { sampleAvatarItems, samplePointTransactions } from "@/lib/sampleData";
import type { AvatarItem, PointTransaction } from "@/types/reward";
import { Sprout, ShoppingBag, Check } from "lucide-react";

const categoryLabels: Record<AvatarItem["category"], string> = {
  accessory: "액세서리",
  background: "배경",
  outfit: "의상",
  style: "스타일",
};

const categoryEmojis: Record<AvatarItem["category"], string> = {
  accessory: "👟",
  background: "🌿",
  outfit: "👕",
  style: "✨",
};

export default function AvatarShopPage() {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastPts, setToastPts] = useState(0);
  const [filterCat, setFilterCat] = useState<AvatarItem["category"] | "all">("all");

  useEffect(() => {
    const savedItems = getFromStorage<AvatarItem[]>(STORAGE_KEYS.AVATAR_ITEMS, sampleAvatarItems);
    setItems(savedItems);
    const txs = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
    setBalance(calculatePointBalance(txs));

    const handler = () => {
      const updated = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
      setBalance(calculatePointBalance(updated));
    };
    window.addEventListener("pointsUpdated", handler);
    return () => window.removeEventListener("pointsUpdated", handler);
  }, []);

  const handlePurchase = (item: AvatarItem) => {
    if (!canPurchaseItem(item, balance)) return;
    const tx = createSpendTransaction("user-001", item.price, `아이템 구매: ${item.name}`);
    addPointTransaction(tx);
    const updated = purchaseAvatarItem(items, item.id);
    setItems(updated);
    saveToStorage(STORAGE_KEYS.AVATAR_ITEMS, updated);
    setBalance((b) => b - item.price);
    window.dispatchEvent(new Event("pointsUpdated"));
    setToastMsg(`${item.name} 구매 완료!`);
    setToastPts(-item.price);
    setShowToast(true);
  };

  const handleEquip = (item: AvatarItem) => {
    const updated = equipAvatarItem(items, item.id);
    setItems(updated);
    saveToStorage(STORAGE_KEYS.AVATAR_ITEMS, updated);
  };

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
  const categories: (AvatarItem["category"] | "all")[] = ["all", "accessory", "outfit", "background", "style"];

  return (
    <MobileShell>
      <AppHeader title="아바타 상점" showBack backHref="/dashboard" />
      <RewardToast
        message={toastMsg}
        points={Math.abs(toastPts)}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        {/* Balance Bar */}
        <div className="bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs">보유 건강씨앗</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Sprout size={18} className="text-green-200" />
              <span className="text-2xl font-extrabold text-white">{balance.toLocaleString()}</span>
              <span className="text-green-200 text-sm">씨앗</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
            <ShoppingBag size={20} className="text-white mx-auto" />
            <p className="text-white text-xs mt-1">상점</p>
          </div>
        </div>

        {/* Equipped items */}
        {items.some((i) => i.isEquipped) && (
          <div className="mx-4 mt-4 bg-[#EAF7EF] rounded-2xl p-3">
            <p className="text-xs font-semibold text-[#4CAF6A] mb-2">현재 장착 중인 아이템</p>
            <div className="flex flex-wrap gap-2">
              {items.filter((i) => i.isEquipped).map((i) => (
                <span key={i.id} className="text-xs bg-white border border-[#4CAF6A] text-[#1F5A3A] rounded-full px-2 py-0.5 font-medium">
                  {categoryEmojis[i.category]} {i.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterCat === cat
                  ? "bg-[#4CAF6A] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cat === "all" ? "전체" : categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          {filtered.map((item) => {
            const affordable = balance >= item.price;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3 shadow-sm border ${
                  item.isEquipped ? "border-[#4CAF6A]" : item.isOwned ? "border-blue-200" : "border-gray-100"
                }`}
              >
                {/* Item Visual */}
                <div className={`w-full aspect-square rounded-xl mb-3 flex items-center justify-center text-4xl ${
                  item.isEquipped ? "bg-[#EAF7EF]" : item.isOwned ? "bg-blue-50" : "bg-gray-50"
                }`}>
                  {categoryEmojis[item.category]}
                </div>

                <div className="mb-1 flex items-start justify-between">
                  <p className="text-sm font-bold text-[#1F2937] leading-tight">{item.name}</p>
                  {item.isEquipped && (
                    <span className="flex-shrink-0 ml-1">
                      <Check size={14} className="text-[#4CAF6A]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>

                <div className="flex items-center gap-1 mb-2">
                  <Sprout size={12} className="text-[#4CAF6A]" />
                  <span className="text-sm font-bold text-[#1F5A3A]">{item.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">씨앗</span>
                </div>

                {item.isOwned ? (
                  item.isEquipped ? (
                    <button className="w-full py-2 bg-[#4CAF6A] text-white text-xs font-bold rounded-lg">
                      장착 중
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      className="w-full py-2 bg-blue-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
                    >
                      장착하기
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!affordable}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
                      affordable
                        ? "bg-[#1F5A3A] text-white active:scale-95"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {affordable ? "구매하기" : "씨앗 부족"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
