"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  ChevronRight,
  Droplets,
  Footprints,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import {
  sampleMotivationMessages,
  sampleNotificationSettings,
} from "@/lib/sampleNotifications";
import { getAiCoachById } from "@/lib/coachData";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { NotificationSetting, NotificationType } from "@/types/notification";

type BrowserNotificationStatus = NotificationPermission | "unsupported";

const icons: Record<NotificationType, ReactNode> = {
  meal: <UtensilsCrossed />,
  steps: <Footprints />,
  water: <Droplets />,
  sleep: <Moon />,
  challenge: <Trophy />,
  report: <BellRing />,
};

const permissionLabels: Record<
  BrowserNotificationStatus,
  { label: string; description: string; tone: string }
> = {
  granted: {
    label: "허용됨",
    description: "브라우저 알림을 받을 수 있어요.",
    tone: "bg-[#EAF7EF] text-[#1F5A3A]",
  },
  denied: {
    label: "차단됨",
    description: "브라우저 설정에서 알림을 허용해야 해요.",
    tone: "bg-red-50 text-red-500",
  },
  default: {
    label: "미설정",
    description: "알림 권한을 아직 선택하지 않았어요.",
    tone: "bg-yellow-50 text-yellow-700",
  },
  unsupported: {
    label: "지원 안 함",
    description: "이 브라우저에서는 알림 권한을 사용할 수 없어요.",
    tone: "bg-gray-100 text-gray-500",
  },
};

function getBrowserNotificationStatus(): BrowserNotificationStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function resolveNotificationCoachIcon(coachId?: string | null) {
  const normalizedCoachId =
    coachId === "onyu"
      ? "onyou"
      : coachId === "rumi"
        ? "lumi"
        : coachId === "kangtaeo"
          ? "taeo"
          : coachId;
  const coach = getAiCoachById(normalizedCoachId);
  return coach.faceImageUrl || coach.imageUrl || "/icons/icon-192x192.png";
}

export default function NotificationsPage() {
  const [settings, setSettings] =
    useState<NotificationSetting[]>(sampleNotificationSettings);
  const [saved, setSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<BrowserNotificationStatus>("default");
  const [permissionMessage, setPermissionMessage] = useState("");

  useEffect(() => {
    setSettings(
      getFromStorage(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        sampleNotificationSettings
      )
    );

    const browserStatus = getBrowserNotificationStatus();
    setPermissionStatus(browserStatus);
    saveToStorage(STORAGE_KEYS.NOTIFICATION_PERMISSION, browserStatus);
  }, []);

  const update = (id: string, change: Partial<NotificationSetting>) => {
    const next = settings.map((item) =>
      item.id === id ? { ...item, ...change } : item
    );
    setSettings(next);
    saveToStorage(STORAGE_KEYS.NOTIFICATION_SETTINGS, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const handleRequestPermission = async () => {
    setPermissionMessage("");

    if (!("Notification" in window)) {
      setPermissionStatus("unsupported");
      saveToStorage(STORAGE_KEYS.NOTIFICATION_PERMISSION, "unsupported");
      setPermissionMessage("현재 브라우저에서는 알림 권한을 사용할 수 없어요.");
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    saveToStorage(STORAGE_KEYS.NOTIFICATION_PERMISSION, permission);

    if (permission === "granted") {
      setPermissionMessage("알림 권한이 켜졌어요.");
      return;
    }

    if (permission === "denied") {
      setPermissionMessage("브라우저 설정에서 알림을 허용하면 다시 받을 수 있어요.");
      return;
    }

    setPermissionMessage("알림 권한 요청이 완료되지 않았어요.");
  };

  const handleTestNotification = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const selectedCoachId = getFromStorage<string>(
      STORAGE_KEYS.SELECTED_AI_COACH_ID,
      "haru"
    );
    const coachIcon = resolveNotificationCoachIcon(selectedCoachId);

    new Notification("내일의건강 알림", {
      body: "이렇게 건강 루틴 알림을 받을 수 있어요.",
      icon: new URL(coachIcon, window.location.origin).toString(),
      badge: "/icons/icon-192x192.png",
    });
  };

  const permissionInfo = permissionLabels[permissionStatus];
  const permissionButtonLabel =
    permissionStatus === "granted"
      ? "테스트 알림 보내기"
      : permissionStatus === "denied"
        ? "브라우저 설정에서 허용"
        : permissionStatus === "unsupported"
          ? "지원 안 함"
          : "알림 권한 켜기";

  return (
    <MobileShell>
      <AppHeader title="알림 설정" />
      <main className="flex-1 bg-[#F7FBF8] px-3 pb-24 pt-3">
        <section className="rounded-3xl bg-gradient-to-br from-[#EAF7EF] to-white p-4">
          <Bell className="text-[#4CAF6A]" size={26} />
          <h1 className="mt-2 text-xl font-black text-[#1F2937]">
            건강 루틴 알림을 준비해요
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            권한은 사용자가 직접 켤 때만 요청돼요. 알림 시간과 항목은 아래에서
            조정할 수 있어요.
          </p>
        </section>

        <section className="mt-3 rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[#1F5A3A]">
              {permissionStatus === "granted" ? (
                <ShieldCheck size={22} />
              ) : (
                <ShieldAlert size={22} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-[#1F2937]">
                  브라우저 알림 권한
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${permissionInfo.tone}`}
                >
                  {permissionInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {permissionInfo.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              permissionStatus === "granted"
                ? handleTestNotification
                : handleRequestPermission
            }
            disabled={
              permissionStatus === "denied" ||
              permissionStatus === "unsupported"
            }
            className="mt-4 h-12 w-full rounded-2xl bg-[#4CAF6A] text-sm font-black text-white shadow-sm transition active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-500"
          >
            {permissionButtonLabel}
          </button>

          {permissionMessage && (
            <p className="mt-3 rounded-2xl bg-[#F0FAF4] p-3 text-sm font-bold text-[#1F5A3A]">
              {permissionMessage}
            </p>
          )}
        </section>

        <div className="mt-3 space-y-2">
          {settings.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[#4CAF6A] [&_svg]:h-5 [&_svg]:w-5">
                  {icons[item.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#1F2937]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-gray-500">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update(item.id, { enabled: !item.enabled })}
                  aria-label={`${item.title} ${item.enabled ? "끄기" : "켜기"}`}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    item.enabled ? "bg-[#4CAF6A]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      item.enabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
                <span className="text-[11px] font-bold text-gray-500">
                  알림 시간
                </span>
                <input
                  type="time"
                  value={item.time}
                  disabled={!item.enabled}
                  onChange={(event) => update(item.id, { time: event.target.value })}
                  className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-bold text-[#1F2937] disabled:opacity-40"
                />
              </div>
            </article>
          ))}
        </div>

        {saved && (
          <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm font-bold text-[#1F5A3A]">
            알림 설정을 저장했어요.
          </p>
        )}

        <section className="mt-5">
          <h2 className="text-lg font-black text-[#1F2937]">
            받을 수 있는 알림 예시
          </h2>
          <div className="mt-3 space-y-2">
            {sampleMotivationMessages.slice(0, 3).map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-green-100 bg-white p-4"
              >
                <p className="font-extrabold text-[#1F5A3A]">
                  {message.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {message.message}
                </p>
                {message.actionHref && (
                  <Link
                    href={message.actionHref}
                    className="mt-2 flex items-center justify-end gap-1 text-sm font-bold text-[#4CAF6A]"
                  >
                    {message.actionLabel}
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 rounded-2xl bg-gray-100 p-4 text-xs leading-relaxed text-gray-500">
          현재는 앱 내 알림 설정과 브라우저 권한을 준비합니다. 실제 서버 푸시는
          사용자 계정과 저장 구조가 안정화된 뒤 확장할 수 있어요.
        </p>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
