"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Camera, ChevronRight, Droplets, FileText, Flame, Footprints, HeartPulse, Moon, Shirt, Target, Utensils } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import CoachMessageCard from "@/components/dashboard/CoachMessageCard";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculateHealthScore } from "@/lib/healthRules";
import { getDefaultAvatarImage } from "@/lib/defaultAvatars";
import { sampleUser, sampleCheckup, sampleDailyLog } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { HealthCheckup, DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";
import type { AvatarViewMode } from "@/types/avatar";

const quickMenus = [
  { href: "/avatar", icon: Camera, label: "내 사진·아바타\n변경" },
  { href: "/avatar-shop", icon: Shirt, label: "아바타\n꾸미기" },
  { href: "/meals", icon: Utensils, label: "식단 사진\n기록" },
  { href: "/report", icon: FileText, label: "건강\n리포트" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [checkup, setCheckup] = useState<HealthCheckup>(sampleCheckup);
  const [dailyLog, setDailyLog] = useState<DailyLog>(sampleDailyLog);
  const [score, setScore] = useState(0);
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  const [avatarViewMode, setAvatarViewMode] = useState<AvatarViewMode>("portrait");

  useEffect(() => {
    const savedUser = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const savedCheckup = getFromStorage<HealthCheckup>(STORAGE_KEYS.HEALTH_CHECKUP, sampleCheckup);
    const logs = getFromStorage<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
    const latestLog = logs[logs.length - 1] || sampleDailyLog;
    setUser(savedUser);
    setCheckup(savedCheckup);
    setDailyLog(latestLog);
    setScore(calculateHealthScore(savedCheckup, latestLog));
    setMeals(getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []));
    setAvatarViewMode(getFromStorage<AvatarViewMode>(STORAGE_KEYS.AVATAR_VIEW_MODE, "portrait"));
  }, []);

  const changeAvatarViewMode = (mode: AvatarViewMode) => {
    setAvatarViewMode(mode);
    saveToStorage(STORAGE_KEYS.AVATAR_VIEW_MODE, mode);
  };

  const coachMessages = [
    "작은 습관이 쌓이면 건강한 내일을 만들 수 있어요. 오늘도 함께 실천해봐요! 🌱",
    "오늘 걷기 목표까지 조금만 더 힘내보세요. 건강이가 응원해요! 💪",
    "물 한 잔 마시는 것부터 시작해볼까요? 작은 실천이 큰 변화를 만들어요. 💧",
  ];
  const coachMessage = coachMessages[new Date().getDay() % coachMessages.length];
  const calories = dailyLog.exerciseDone ? 356 : 210;
  const displayName = user.name?.trim() || "사용자";
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const heroImage = user.avatarImage || getDefaultAvatarImage(avatarGender, user.avatarStyle) || "/avatars/default-female-3d.png";
  const customAvatarImage = user.avatarEffect === "illustrated" && user.avatarImage?.startsWith("data:") ? user.avatarImage : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter((meal) => meal.mealDate === today);
  const mealCalories = todayMeals.reduce((sum, meal) => sum + meal.estimatedCalories, 0);

  const summaryItems = [
    { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]" },
    { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]" },
    { icon: Flame, label: "소모 칼로리", value: `${calories}kcal`, color: "text-[#F59E0B]" },
    { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]" },
    { icon: HeartPulse, label: "혈압", value: `${checkup.systolicBp}/${checkup.diastolicBp}`, color: "text-[#E34D59]" },
    { icon: Utensils, label: "오늘 식단", value: `${todayMeals.filter((meal) => meal.mealType !== "snack").length}/3회`, color: "text-[#E58A2B]" },
  ];

  return (
    <MobileShell>
      <AppHeader />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <section className="relative min-h-[760px] overflow-hidden bg-[#1F5A3A] [@media(max-height:700px)]:min-h-[700px]">
          <div className="absolute inset-0"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode={avatarViewMode} mood={dailyLog.steps >= 7000 ? "happy" : "idle"} customImageUrl={customAvatarImage} fill cover priority showWindEffect showLeaves showLightTrails alt={`${displayName}님의 마이 아바타`} /></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/55 to-transparent" />

          <div className="absolute left-2 right-2 top-1 z-30 rounded-xl border border-white/65 bg-white/32 px-3 py-1.5 shadow-[0_8px_20px_rgba(12,62,38,0.12)] backdrop-blur-[9px]">
            <p className="text-xs font-medium leading-[18px] text-[#173425]">안녕하세요, <strong className="text-[#16743B]">{displayName}님!</strong> 오늘도 건강한 하루를 시작해볼까요?</p>
          </div>

          <div className="absolute inset-0 z-20">
            <div className="absolute left-2 top-[430px] space-y-2.5 [@media(max-height:700px)]:top-[390px]">
              {[
                { icon: Footprints, label: "걸음 수", value: `${dailyLog.steps.toLocaleString()}보`, color: "text-[#24944E]" },
                { icon: Flame, label: "소모 칼로리", value: `${calories} kcal`, color: "text-[#F59E0B]" },
                { icon: Moon, label: "수면", value: `${dailyLog.sleepHours}시간`, color: "text-[#4E66B1]" },
                { icon: Droplets, label: "수분", value: `${dailyLog.waterCups}잔`, color: "text-[#27A9D6]" },
              ].map(({ icon: Icon, label, value, color }, index) => (
                <div key={label} className={`w-[116px] rounded-[20px] border border-white/60 bg-white/32 px-2.5 py-2 shadow-[0_12px_30px_rgba(10,66,40,0.18)] backdrop-blur-[9px] ${index % 2 === 0 ? "-rotate-1" : "rotate-1"}`}>
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/65"><Icon size={18} className={color} /></span><div><p className="text-[10px] font-semibold text-[#1F2937]/70">{label}</p><p className="text-sm font-black text-[#102D20]">{value}</p></div></div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-[62px] right-3 max-w-[158px] rounded-2xl rounded-bl-sm border border-white/65 bg-white/55 px-3 py-2.5 shadow-[0_12px_26px_rgba(31,90,58,0.16)] backdrop-blur-[10px]">
              <p className="text-xs font-bold text-[#16743B]">🌿 건강한 습관이</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#163D29]">내일의 나를 만듭니다!</p>
            </div>

            <div className="absolute bottom-[145px] right-4 flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px] border-white/70 bg-white/55 text-center shadow-[0_14px_30px_rgba(31,90,58,0.24)] ring-2 ring-[#4CAF6A]/55 backdrop-blur-[10px] [@media(max-height:700px)]:bottom-[120px]">
              <p className="text-[10px] font-semibold text-gray-500">오늘의 건강관리</p><p className="text-[10px] text-gray-500">참고 점수</p><p className="mt-1 text-4xl font-black text-[#24944E]">{score}</p><p className="text-xs text-[#4CAF6A]">/ 100</p>
            </div>
          </div>
        </section>

        <section className="relative z-30 px-4 pt-3">
          <div className="mx-auto flex w-fit rounded-full border border-gray-100 bg-white p-1 shadow-sm">
            <button onClick={() => changeAvatarViewMode("portrait")} className={`rounded-full px-5 py-2 text-xs font-bold ${avatarViewMode === "portrait" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>상반신 보기</button>
            <button onClick={() => changeAvatarViewMode("fullbody")} className={`rounded-full px-5 py-2 text-xs font-bold ${avatarViewMode === "fullbody" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>전신 보기</button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_14px_35px_rgba(31,41,55,0.12)]">
            {quickMenus.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#F2FAF4] to-[#E8F5EC] px-1 text-center active:scale-95">
                <Icon size={28} className="text-[#24944E]" /><span className="whitespace-pre-line text-xs font-bold leading-relaxed text-[#1F2937]">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 pt-6">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xl font-extrabold text-[#1F2937]"><Target className="text-[#4CAF6A]" />건강이의 오늘 미션</h3><Link href="/notifications" className="flex items-center gap-1 text-sm font-bold text-gray-500"><Bell size={16} />알림 설정</Link></div>
          <div className="space-y-3">{[
            { title: "점심 식단 기록하기", desc: "사진 한 장으로 예상 칼로리를 확인해보세요.", reward: "5P", href: "/meals/new", icon: "🍽️" },
            { title: "목표 걸음 수 채우기", desc: dailyLog.steps >= 7000 ? "오늘의 걷기 목표를 달성했어요!" : `${(7000 - dailyLog.steps).toLocaleString()}보만 더 걸으면 목표 달성이에요.`, reward: "20P", href: "/habits", icon: "👟" },
            { title: "물 2잔 더 마시기", desc: dailyLog.waterCups >= 6 ? "오늘의 수분 목표를 달성했어요!" : "오늘 수분 목표까지 조금 남았어요.", reward: "10P", href: "/habits", icon: "💧" },
          ].map((mission) => <article key={mission.title} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-2xl">{mission.icon}</span><div className="min-w-0 flex-1"><p className="font-extrabold text-[#1F2937]">{mission.title}</p><p className="mt-0.5 text-xs leading-relaxed text-gray-500">{mission.desc}</p><p className="mt-1 text-xs font-bold text-[#4CAF6A]">보상: 헬스포인트 {mission.reward}</p></div><Link href={mission.href} aria-label={`${mission.title} 바로 실행하기`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4CAF6A] text-white"><ChevronRight /></Link></article>)}</div>
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
          <p className="mt-2 text-sm font-bold text-[#1F5A3A]">예상 섭취 칼로리: {mealCalories.toLocaleString()} kcal</p>
        </section>

        <section className="px-4 pb-3"><CoachMessageCard message={coachMessage} style={user.avatarStyle} gender={avatarGender} imageUrl={customAvatarImage || heroImage} /></section>
        <section className="px-4 pb-6"><Link href="/notifications" className="block rounded-2xl border border-green-100 bg-[#EAF7EF] p-4"><p className="flex items-center gap-2 font-extrabold text-[#1F5A3A]"><Bell size={18} />점심시간이에요</p><p className="mt-1 text-sm text-gray-600">식사 전 사진 한 장으로 오늘의 식단을 기록해보세요.</p></Link></section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
