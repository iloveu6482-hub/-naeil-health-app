"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, Droplets, FileText, Flame, Footprints, HeartPulse, Moon, Shirt, Utensils } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateHealthScore } from "@/lib/healthRules";
import { getDefaultAvatarImage } from "@/lib/defaultAvatars";
import { sampleUser, sampleCheckup, sampleDailyLog } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { HealthCheckup, DailyLog } from "@/types/health";

const quickMenus = [
  { href: "/avatar", icon: Camera, label: "내 사진·아바타\n변경" },
  { href: "/avatar-shop", icon: Shirt, label: "아바타\n꾸미기" },
  { href: "/habits", icon: Utensils, label: "식단·습관\n기록" },
  { href: "/report", icon: FileText, label: "건강\n리포트" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [checkup, setCheckup] = useState<HealthCheckup>(sampleCheckup);
  const [dailyLog, setDailyLog] = useState<DailyLog>(sampleDailyLog);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedUser = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const savedCheckup = getFromStorage<HealthCheckup>(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const latestLog = logs[logs.length - 1] || sampleDailyLog;
    setUser(savedUser);
    setCheckup(savedCheckup);
    setDailyLog(latestLog);
    setScore(calculateHealthScore(savedCheckup, latestLog));
  }, []);

  const coachMessages = [
    "작은 습관이 쌓이면 건강한 내일을 만들 수 있어요. 오늘도 함께 실천해봐요! 🌱",
    "오늘 걷기 목표까지 조금만 더 힘내보세요. 건강이가 응원해요! 💪",
    "물 한 잔 마시는 것부터 시작해볼까요? 작은 실천이 큰 변화를 만들어요. 💧",
  ];
  const coachMessage = coachMessages[new Date().getDay() % coachMessages.length];
  const calories = dailyLog.exerciseDone ? 356 : 210;
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const heroImage = user.avatarImage || getDefaultAvatarImage(avatarGender, user.avatarStyle) || "/avatars/default-female-3d.png";

  const summaryItems = [
    { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]" },
    { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]" },
    { icon: Flame, label: "소모 칼로리", value: `${calories}kcal`, color: "text-[#F59E0B]" },
    { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]" },
    { icon: HeartPulse, label: "혈압", value: `${checkup.systolicBp}/${checkup.diastolicBp}`, color: "text-[#E34D59]" },
  ];

  return (
    <MobileShell>
      <AppHeader />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <section className="relative min-h-[650px] overflow-hidden bg-[#1F5A3A]">
          <Image src={heroImage} alt={`${user.name}님의 건강이 아바타`} fill priority unoptimized={heroImage.startsWith("data:")} className="object-cover object-top" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/28 via-transparent to-[#0B3A24]/45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/55 to-transparent" />

          <div className="relative z-20 px-5 pt-6 drop-shadow-sm">
            <p className="text-lg text-[#1F2937]">안녕하세요, <strong className="text-[#16743B]">{user.name}님!</strong></p>
            <p className="mt-2 text-base font-medium leading-relaxed text-[#1F2937]">오늘도 건강한 하루를<br />시작해볼까요?</p>
          </div>

          <div className="absolute inset-0 z-20">
            <div className="absolute left-3 top-[205px] space-y-3">
              {[
                { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]" },
                { icon: Flame, label: "소모 칼로리", value: `${calories} kcal`, color: "text-[#F59E0B]" },
                { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]" },
                { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]" },
              ].map(({ icon: Icon, label, value, color }, index) => (
                <div key={label} className={`w-[124px] rounded-[20px] border border-white/60 bg-white/24 px-3 py-2.5 shadow-[0_12px_30px_rgba(10,66,40,0.20)] backdrop-blur-[9px] ${index % 2 === 0 ? "-rotate-1" : "rotate-1"}`}>
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/65"><Icon size={18} className={color} /></span><div><p className="text-[10px] font-semibold text-[#1F2937]/70">{label}</p><p className="text-sm font-black text-[#102D20]">{value}</p></div></div>
                </div>
              ))}
            </div>

            <div className="absolute right-3 top-[120px] max-w-[168px] rounded-2xl rounded-bl-sm border border-white/65 bg-white/28 px-4 py-3 shadow-[0_14px_32px_rgba(31,90,58,0.18)] backdrop-blur-[10px]">
              <p className="text-xs font-bold text-[#16743B]">🌿 건강한 습관이</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#163D29]">내일의 나를 만듭니다!</p>
            </div>

            <div className="absolute bottom-6 right-3 flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] border-white/65 bg-white/28 text-center shadow-[0_16px_36px_rgba(31,90,58,0.28)] ring-2 ring-[#4CAF6A]/65 backdrop-blur-[10px]">
              <p className="text-[10px] font-semibold text-gray-500">오늘의 건강관리</p><p className="text-[10px] text-gray-500">참고 점수</p><p className="mt-1 text-4xl font-black text-[#24944E]">{score}</p><p className="text-xs text-[#4CAF6A]">/ 100</p>
            </div>
          </div>
        </section>

        <section className="relative z-30 -mt-5 px-4">
          <div className="grid grid-cols-4 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_14px_35px_rgba(31,41,55,0.12)]">
            {quickMenus.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#F2FAF4] to-[#E8F5EC] px-1 text-center active:scale-95">
                <Icon size={28} className="text-[#24944E]" /><span className="whitespace-pre-line text-xs font-bold leading-relaxed text-[#1F2937]">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 py-6">
          <h3 className="mb-4 text-xl font-extrabold text-[#1F2937]">오늘의 건강 요약</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {summaryItems.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="min-w-[112px] rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
                <Icon size={23} className={`mx-auto mb-2 ${color}`} /><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-extrabold text-[#1F2937]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pb-6"><CoachMessageCard message={coachMessage} /></section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
