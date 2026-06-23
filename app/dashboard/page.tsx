"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import TodaySummaryCard from "@/components/dashboard/TodaySummaryCard";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import QuickActionGrid from "@/components/dashboard/QuickActionGrid";
import HealthAvatar from "@/components/common/HealthAvatar";
import SeedPointBadge from "@/components/common/SeedPointBadge";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateHealthScore } from "@/lib/healthRules";
import { calculatePointBalance } from "@/lib/rewards";
import { sampleUser, sampleCheckup, sampleDailyLog, samplePointTransactions } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { HealthCheckup, DailyLog } from "@/types/health";
import type { PointTransaction, AvatarItem } from "@/types/reward";
import { Camera, Shirt } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [checkup, setCheckup] = useState<HealthCheckup>(sampleCheckup);
  const [dailyLog, setDailyLog] = useState<DailyLog>(sampleDailyLog);
  const [points, setPoints] = useState(90);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedUser = getFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    if (savedUser) setUser(savedUser);

    const savedCheckup = getFromStorage<HealthCheckup | null>(STORAGE_KEYS.HEALTH_CHECKUP, null);
    if (savedCheckup) setCheckup(savedCheckup);

    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const todayLog = logs[logs.length - 1];
    if (todayLog) setDailyLog(todayLog);

    const txs = getFromStorage<PointTransaction[]>(
      STORAGE_KEYS.POINT_TRANSACTIONS,
      samplePointTransactions
    );
    setPoints(calculatePointBalance(txs));

    const items = getFromStorage<AvatarItem[]>(STORAGE_KEYS.AVATAR_ITEMS, []);
    setEquippedItems(items.filter((i) => i.isEquipped).map((i) => i.name));

    const c = savedCheckup || sampleCheckup;
    const l = todayLog || sampleDailyLog;
    setScore(calculateHealthScore(c, l));
  }, []);

  const coachMessages = [
    "작은 습관이 쌓이면 건강한 내일을 만들 수 있어요. 오늘도 함께 실천해봐요! 🌱",
    "오늘 걷기 목표까지 조금만 더 힘내보세요. 건강이가 응원해요! 💪",
    "물 한 잔 마시는 것부터 시작해볼까요? 작은 실천이 큰 변화를 만들어요. 💧",
  ];
  const coachMsg = coachMessages[new Date().getDay() % coachMessages.length];

  return (
    <MobileShell>
      <AppHeader />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-20">
        {/* 인사말 + 아바타 */}
        <div className="bg-gradient-to-br from-[#EAF7EF] to-white px-4 py-6">
          <div className="flex items-center gap-4">
            <HealthAvatar style={user.avatarStyle} size="lg" equippedItems={equippedItems} imageUrl={user.avatarImage} />
            <div className="flex-1">
              <p className="text-sm text-gray-500">안녕하세요 👋</p>
              <h2 className="text-xl font-extrabold text-[#1F2937]">
                {user.name}님,
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">오늘도 건강한 하루를 시작해볼까요?</p>
              <div className="mt-2">
                <SeedPointBadge amount={points} />
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href="/avatar" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-[#1F5A3A] shadow-sm ring-1 ring-green-100">
              <Camera size={17} /> 내 사진·아바타 변경
            </Link>
            <Link href="/avatar-shop" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5A3A] px-3 text-sm font-bold text-white shadow-sm">
              <Shirt size={17} /> 아바타 꾸미기
            </Link>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          <HealthScoreCard score={score} />
          <TodaySummaryCard log={dailyLog} checkup={checkup} />
          <CoachMessageCard message={coachMsg} />

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-500 mb-3">빠른 실행</p>
            <QuickActionGrid />
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
