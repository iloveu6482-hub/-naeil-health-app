"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import QuickActionGrid from "@/components/dashboard/QuickActionGrid";
import HealthAvatar from "@/components/common/HealthAvatar";
import AvatarPortraitCard from "@/components/avatar/AvatarPortraitCard";
import SeedPointBadge from "@/components/common/SeedPointBadge";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateHealthScore } from "@/lib/healthRules";
import { calculatePointBalance } from "@/lib/rewards";
import { sampleUser, sampleCheckup, sampleDailyLog, samplePointTransactions } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { HealthCheckup, DailyLog } from "@/types/health";
import type { PointTransaction, AvatarItem } from "@/types/reward";
import { Camera, Shirt } from "lucide-react";
import { Droplets, Footprints, Moon, ShieldCheck } from "lucide-react";

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
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_18%,#ffffff_0%,#EAF7EF_42%,#B9E4C7_100%)] px-3 pb-6 pt-5">
          <div className="pointer-events-none absolute -left-14 top-24 h-44 w-44 rounded-full bg-[#9EDB82]/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-52 h-52 w-52 rounded-full bg-[#F7C948]/20 blur-3xl" />
          <div className="relative z-10 text-center">
            <p className="text-sm font-semibold text-[#4CAF6A]">안녕하세요 👋</p>
            <h2 className="text-2xl font-extrabold text-[#1F2937]">{user.name}님의 건강 히어로</h2>
            <p className="mt-1 text-sm text-gray-600">오늘의 작은 실천이 더 건강한 내일을 만들어요.</p>
            <div className="mt-2"><SeedPointBadge amount={points} /></div>
          </div>

          <div className="relative mx-auto mt-4 min-h-[455px] max-w-[390px]">
            <div className="absolute inset-x-8 top-0 z-10">
              <AvatarPortraitCard imageUrl={user.avatarImage} name={`${user.name}님의 건강이`} />
            </div>

            <div className="absolute left-0 top-10 z-20 w-[108px] -rotate-3 rounded-2xl border border-white/80 bg-white/78 p-3 text-left shadow-[0_14px_28px_rgba(31,90,58,0.2)] backdrop-blur-md">
              <Footprints size={19} className="mb-2 text-[#4CAF6A]" /><p className="text-[11px] font-semibold text-gray-500">오늘의 걸음</p><p className="text-lg font-extrabold text-[#1F5A3A]">{dailyLog.steps.toLocaleString()}</p><p className="text-[10px] text-gray-400">걸음</p>
            </div>
            <div className="absolute right-0 top-16 z-20 w-[105px] rotate-3 rounded-2xl border border-white/80 bg-white/78 p-3 text-left shadow-[0_14px_28px_rgba(31,90,58,0.2)] backdrop-blur-md">
              <ShieldCheck size={19} className="mb-2 text-[#F6B93B]" /><p className="text-[11px] font-semibold text-gray-500">건강 점수</p><p className="text-lg font-extrabold text-[#1F5A3A]">{score}<span className="text-xs">점</span></p><p className="text-[10px] text-gray-400">참고 점수</p>
            </div>
            <div className="absolute left-1 top-[215px] z-20 w-[102px] rotate-2 rounded-2xl border border-white/80 bg-[#243B73]/88 p-3 text-left text-white shadow-[0_14px_28px_rgba(36,59,115,0.28)] backdrop-blur-md">
              <Moon size={19} className="mb-2 text-blue-200" /><p className="text-[11px] font-semibold text-blue-100">수면 시간</p><p className="text-lg font-extrabold">{dailyLog.sleepHours}<span className="text-xs">시간</span></p>
            </div>
            <div className="absolute right-1 top-[238px] z-20 w-[102px] -rotate-2 rounded-2xl border border-white/80 bg-[#48A9C5]/88 p-3 text-left text-white shadow-[0_14px_28px_rgba(72,169,197,0.28)] backdrop-blur-md">
              <Droplets size={19} className="mb-2 text-cyan-100" /><p className="text-[11px] font-semibold text-cyan-50">물 마시기</p><p className="text-lg font-extrabold">{dailyLog.waterCups}<span className="text-xs">잔</span></p>
            </div>
            <div className="absolute bottom-3 right-2 z-20 max-w-[185px] rounded-2xl rounded-br-sm border border-white bg-white/90 px-4 py-3 text-left shadow-xl backdrop-blur">
              <p className="text-xs font-bold text-[#1F5A3A]">🌱 건강이의 한마디</p><p className="mt-1 text-xs leading-relaxed text-gray-600">목표까지 조금만 더! 오늘도 건강이가 함께할게요.</p>
            </div>
          </div>

          <div className="relative z-20 mt-3 grid grid-cols-2 gap-2">
            <Link href="/avatar" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-[#1F5A3A] shadow-sm ring-1 ring-green-100">
              <Camera size={17} /> 내 사진·아바타 변경
            </Link>
            <Link href="/avatar-shop" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5A3A] px-3 text-sm font-bold text-white shadow-sm">
              <Shirt size={17} /> 아바타 꾸미기
            </Link>
          </div>
        </section>

        <div className="px-4 py-4 flex flex-col gap-4">
          <CoachMessageCard message={coachMsg} />

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-base font-extrabold text-[#1F2937] mb-1">건강관리 메뉴</p>
            <p className="mb-3 text-sm text-gray-500">건강이와 함께 오늘의 메뉴를 선택하세요.</p>
            <QuickActionGrid />
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
