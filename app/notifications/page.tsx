"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, ChevronRight, Droplets, Footprints, Moon, Trophy, UtensilsCrossed } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { sampleMotivationMessages, sampleNotificationSettings } from "@/lib/sampleNotifications";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { NotificationSetting, NotificationType } from "@/types/notification";

const icons: Record<NotificationType, React.ReactNode> = { meal: <UtensilsCrossed />, steps: <Footprints />, water: <Droplets />, sleep: <Moon />, challenge: <Trophy />, report: <BellRing /> };

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(sampleNotificationSettings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setSettings(getFromStorage(STORAGE_KEYS.NOTIFICATION_SETTINGS, sampleNotificationSettings)), []);
  const update = (id: string, change: Partial<NotificationSetting>) => { const next = settings.map((item) => item.id === id ? { ...item, ...change } : item); setSettings(next); saveToStorage(STORAGE_KEYS.NOTIFICATION_SETTINGS, next); setSaved(true); window.setTimeout(() => setSaved(false), 1200); };
  return <MobileShell><AppHeader title="알림 설정" /><main className="flex-1 bg-[#F7FBF8] px-4 pb-24 pt-4"><section className="rounded-3xl bg-gradient-to-br from-[#EAF7EF] to-white p-5"><Bell className="text-[#4CAF6A]" size={30} /><h1 className="mt-2 text-xl font-black text-[#1F2937]">건강 행동을 놓치지 않도록</h1><p className="mt-1 text-sm leading-relaxed text-gray-600">건강이가 알림으로 도와드려요.</p></section><div className="mt-4 space-y-3">{settings.map((item) => <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[#4CAF6A]">{icons[item.type]}</span><div className="min-w-0 flex-1"><p className="font-extrabold text-[#1F2937]">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">{item.description}</p></div><button onClick={() => update(item.id, { enabled: !item.enabled })} aria-label={`${item.title} ${item.enabled ? "끄기" : "켜기"}`} className={`relative h-7 w-12 shrink-0 rounded-full transition ${item.enabled ? "bg-[#4CAF6A]" : "bg-gray-200"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${item.enabled ? "left-[22px]" : "left-0.5"}`} /></button></div><div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3"><span className="text-xs font-bold text-gray-500">알림 시간</span><input type="time" value={item.time} disabled={!item.enabled} onChange={(event) => update(item.id, { time: event.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-[#1F2937] disabled:opacity-40" /></div></article>)}</div>{saved && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm font-bold text-[#1F5A3A]">알림 설정을 저장했어요.</p>}<section className="mt-5"><h2 className="text-lg font-black text-[#1F2937]">오늘 받을 수 있는 알림 예시</h2><div className="mt-3 space-y-2">{sampleMotivationMessages.slice(0, 3).map((message) => <div key={message.id} className="rounded-2xl border border-green-100 bg-white p-4"><p className="font-extrabold text-[#1F5A3A]">{message.title}</p><p className="mt-1 text-sm leading-relaxed text-gray-600">{message.message}</p>{message.actionHref && <Link href={message.actionHref} className="mt-2 flex items-center justify-end gap-1 text-sm font-bold text-[#4CAF6A]">{message.actionLabel}<ChevronRight size={16} /></Link>}</div>)}</div></section><p className="mt-5 rounded-2xl bg-gray-100 p-4 text-xs leading-relaxed text-gray-500">현재 MVP에서는 실제 푸시 발송 대신 알림 설정과 예시 메시지를 제공합니다. 추후 모바일 앱 또는 PWA 전환 시 실제 푸시 알림으로 확장할 수 있습니다.</p></main><BottomNav /></MobileShell>;
}
