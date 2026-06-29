"use client";

import { useEffect, useState } from "react";
import { Check, Sprout } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import { getFromStorage, removeFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculatePointBalance, canPurchaseItem, purchaseAvatarItem, equipAvatarItem, createSpendTransaction, addPointTransaction } from "@/lib/rewards";
import { sampleAvatarItems, samplePointTransactions, sampleUser } from "@/lib/sampleData";
import { getCustomAvatarSource } from "@/lib/avatarProfile";
import type { AvatarItem, PointTransaction } from "@/types/reward";
import type { AvatarViewMode } from "@/types/avatar";
import type { UserProfile } from "@/types/user";

const categoryLabels: Record<AvatarItem["category"], string> = { outfit: "의상", shoes: "운동화", accessory: "액세서리", background: "배경", theme: "테마" };
const categoryEmojis: Record<AvatarItem["category"], string> = { outfit: "👕", shoes: "👟", accessory: "⌚", background: "🌿", theme: "✨" };
const visibleShopCategories = new Set<AvatarItem["category"]>(["theme", "outfit"]);

function isAvatarItemReady(item: AvatarItem) {
  if (item.category === "theme") return Boolean(item.resetTheme || item.themeKey);
  if (item.category === "outfit") return false;
  return false;
}

export default function AvatarShopPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [filterCat, setFilterCat] = useState<AvatarItem["category"] | "all">("all");
  const [viewMode, setViewMode] = useState<AvatarViewMode>("fullbody");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const profile = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    setUser(profile);
    setViewMode(getFromStorage<AvatarViewMode>(STORAGE_KEYS.AVATAR_VIEW_MODE, "fullbody"));
    const shopSamples = sampleAvatarItems.filter((item) => visibleShopCategories.has(item.category));
    const saved = getFromStorage<AvatarItem[]>(STORAGE_KEYS.AVATAR_ITEMS, []).filter((item) => visibleShopCategories.has(item.category));
    const merged = [...shopSamples.map((sample) => ({ ...(saved.find((item) => item.id === sample.id) || sample), name: sample.name, description: sample.description, price: sample.price })), ...saved.filter((item) => !shopSamples.some((sample) => sample.id === item.id))];
    const activeTheme = getFromStorage<string | null>(STORAGE_KEYS.AVATAR_THEME, null);
    setItems(merged.map((item) => item.category === "theme" ? { ...item, isEquipped: item.resetTheme ? !activeTheme : item.themeKey === activeTheme } : item));
    const txs = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
    setBalance(calculatePointBalance(txs));
  }, []);

  const persistItems = (next: AvatarItem[]) => {
    setItems(next); saveToStorage(STORAGE_KEYS.AVATAR_ITEMS, next);
    saveToStorage(STORAGE_KEYS.OWNED_AVATAR_ITEMS, next.filter((item) => item.isOwned).map((item) => item.id));
    saveToStorage(STORAGE_KEYS.EQUIPPED_AVATAR_ITEMS, next.filter((item) => item.isEquipped).map((item) => item.id));
  };
  const handlePurchase = (item: AvatarItem) => {
    if (!canPurchaseItem(item, balance)) { setMessage("헬스포인트가 부족해요. 건강 미션을 완료하고 포인트를 모아보세요."); return; }
    addPointTransaction(createSpendTransaction(user.id, item.price, `아이템 구매: ${item.name}`));
    persistItems(purchaseAvatarItem(items, item.id)); setBalance((value) => value - item.price);
    window.dispatchEvent(new Event("pointsUpdated")); setMessage("아이템을 구매했어요. 마이 아바타에 장착해보세요.");
  };
  const handleEquip = (item: AvatarItem) => {
    persistItems(equipAvatarItem(items, item.id));
    if (item.outfitKey) {
      saveToStorage(STORAGE_KEYS.AVATAR_OUTFIT, item.outfitKey);
      window.dispatchEvent(new Event("avatarOutfitUpdated"));
    }
    if (item.resetTheme) {
      removeFromStorage(STORAGE_KEYS.AVATAR_THEME);
      window.dispatchEvent(new Event("avatarThemeUpdated"));
    } else if (item.themeKey) {
      saveToStorage(STORAGE_KEYS.AVATAR_THEME, item.themeKey);
      window.dispatchEvent(new Event("avatarThemeUpdated"));
    }
    setMessage(`${item.name}을(를) 장착했어요.`);
  };
  const changeViewMode = (mode: AvatarViewMode) => { setViewMode(mode); saveToStorage(STORAGE_KEYS.AVATAR_VIEW_MODE, mode); };
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const displayName = user.name?.trim() || "사용자";
  const customImage = getCustomAvatarSource(user, viewMode);
  const filtered = filterCat === "all" ? items : items.filter((item) => item.category === filterCat);
  const categories: (AvatarItem["category"] | "all")[] = ["all", "theme", "outfit"];

  return <MobileShell><AppHeader title="마이 아바타" showBack backHref="/dashboard" /><main className="flex-1 bg-[#F7FBF8] pb-24">
    <section className="px-4 pt-4"><div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] p-4 text-white"><div><p className="text-sm text-green-100">{displayName}님의 마이 아바타</p><p className="mt-1 text-lg font-black">Lv. 3 건강 루틴러</p></div><div className="text-right"><p className="text-xs text-green-100">보유 헬스포인트</p><p className="text-2xl font-black">{balance.toLocaleString()}P</p></div></div></section>
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-green-100 bg-gradient-to-b from-[#EAF7EF] to-white shadow-sm"><div className="relative h-[460px]"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode={viewMode} mood="cheer" customImageUrl={customImage} size="xl" showWindEffect showLeaves showLightTrails alt={`${displayName}님의 마이 아바타`} /></div><div className="border-t border-green-100 bg-white/90 px-4 py-2"><div className="mx-auto flex w-fit rounded-full border border-gray-100 bg-[#F7FBF8] p-1"><button onClick={() => changeViewMode("portrait")} className={`rounded-full px-5 py-2 text-xs font-bold ${viewMode === "portrait" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>상반신 보기</button><button onClick={() => changeViewMode("fullbody")} className={`rounded-full px-5 py-2 text-xs font-bold ${viewMode === "fullbody" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>전신 보기</button></div></div></section>
    {message && <p className="mx-4 mt-3 rounded-xl bg-white p-3 text-center text-sm font-bold text-[#1F5A3A] shadow-sm">{message}</p>}
    <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3 pt-5">{categories.map((category) => <button key={category} onClick={() => setFilterCat(category)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filterCat === category ? "bg-[#4CAF6A] text-white" : "bg-white text-gray-600"}`}>{category === "all" ? "전체" : categoryLabels[category]}</button>)}</div>
    <div className="grid grid-cols-2 gap-3 px-4 pb-5">{filtered.map((item) => { const affordable = balance >= item.price; const ready = isAvatarItemReady(item); return <article key={item.id} className={`rounded-2xl border bg-white p-3 shadow-sm ${item.isEquipped ? "border-[#4CAF6A]" : "border-gray-100"}`}><div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#F3F9F5] text-5xl">{item.imageUrl ? <img src={item.imageUrl} alt="" className={`h-full w-full object-cover ${ready ? "" : "opacity-70 grayscale-[0.15]"}`} /> : categoryEmojis[item.category]}{!ready && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-[#1F5A3A] shadow-sm">준비중</span>}</div><div className="mt-3 flex items-start justify-between"><p className="text-sm font-extrabold text-[#1F2937]">{item.name}</p>{item.isEquipped && <Check size={16} className="shrink-0 text-[#4CAF6A]" />}</div><p className="mt-1 min-h-10 text-xs leading-relaxed text-gray-500">{item.description}</p><p className="mt-2 flex items-center gap-1 font-black text-[#1F5A3A]"><Sprout size={14} />{item.price.toLocaleString()}P</p>{!ready ? <button disabled className="mt-2 w-full rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-400">준비중</button> : item.isOwned ? <button onClick={() => !item.isEquipped && handleEquip(item)} className={`mt-2 w-full rounded-xl py-2 text-xs font-bold text-white ${item.isEquipped ? "bg-[#4CAF6A]" : "bg-blue-500"}`}>{item.isEquipped ? "장착 중" : "장착하기"}</button> : <button onClick={() => handlePurchase(item)} className={`mt-2 w-full rounded-xl py-2 text-xs font-bold ${affordable ? "bg-[#1F5A3A] text-white" : "bg-gray-100 text-gray-400"}`}>{affordable ? "구매하기" : "포인트 부족"}</button>}</article>; })}</div>
  </main><BottomNav /></MobileShell>;
}
