"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, HeartPulse, Ruler, Settings, Shirt, Sprout, TrendingUp, UserRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getHeaderAvatarSource } from "@/lib/avatarProfile";
import { calculatePointBalance } from "@/lib/rewards";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { PointTransaction } from "@/types/reward";

const myMenuItems = [
  { href: "/settings", icon: Settings, title: "내 정보·설정", desc: "프로필, 키·몸무게, BMI를 관리해요." },
  { href: "/health-change", icon: TrendingUp, title: "나의 변화도", desc: "몸무게와 건강 습관 변화를 확인해요." },
  { href: "/avatar-shop", icon: Shirt, title: "아바타 꾸미기", desc: "테마와 의상을 골라 건강이를 꾸며요." },
  { href: "/checkup/insights", icon: HeartPulse, title: "검진 관리", desc: "검진 수치와 관리 방향을 살펴봐요." },
];

export default function MyPage() {
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setUser(getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser));
    setPoints(calculatePointBalance(getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, [])));
  }, []);

  const displayName = user.name?.trim() || "사용자";
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const profileAvatar = getHeaderAvatarSource(user, avatarGender);

  return (
    <MobileShell>
      <AppHeader title="나의" />
      <main className="flex-1 overflow-y-auto bg-[#F7FBF8] px-4 pb-24 pt-4">
        <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#EAF7EF] shadow-md ring-2 ring-[#BDE8CA]">
              <Image src={profileAvatar} alt={`${displayName}님의 프로필`} fill unoptimized={profileAvatar.startsWith("data:")} className="scale-[1.16] rounded-full object-cover object-[center_18%]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#4CAF6A]">내 건강 프로필</p>
              <h1 className="mt-1 truncate text-2xl font-black text-[#1F2937]">{displayName}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-black text-[#1F5A3A]">
                  <Sprout size={13} />
                  {points.toLocaleString()}P
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F7FBF8] px-3 py-1 text-xs font-black text-gray-500">
                  <UserRound size={13} />
                  {user.birthYear ? `${user.birthYear}년생` : "기본정보 설정"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
              <Ruler size={22} />
            </span>
            <div>
              <p className="text-sm font-bold text-green-50">현재 관리 수치</p>
              <p className="mt-1 text-lg font-black">
                BMI {user.bmi ?? "-"} · {user.height ?? "-"}cm · {user.weight ?? "-"}kg
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3">
          {myMenuItems.map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:scale-[0.98]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF]">
                <Icon size={21} className="text-[#4CAF6A]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-[#1F2937]">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{desc}</span>
              </span>
              <ChevronRight size={19} className="shrink-0 text-gray-300" />
            </Link>
          ))}
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
