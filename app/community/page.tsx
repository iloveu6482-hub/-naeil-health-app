"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartHandshake, MessageCircleHeart, Search, Send, UserPlus, UsersRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

type CommunityTab = "health" | "meetup" | "group" | "family" | "challenge";

const communityTabs: Array<{ id: CommunityTab; label: string }> = [
  { id: "health", label: "건강생활" },
  { id: "meetup", label: "모임" },
  { id: "group", label: "그룹" },
  { id: "family", label: "가족" },
  { id: "challenge", label: "챌린지" },
];

const communityCards = [
  {
    href: "/family",
    icon: HeartHandshake,
    title: "가족 커뮤니티",
    desc: "가족 건강 루틴을 함께 기록하고 서로 응원해요.",
    action: "가족 공간 보기",
  },
  {
    href: "/family/members",
    icon: UserPlus,
    title: "가족·친구 추가",
    desc: "함께 건강 습관을 실천할 사람을 등록해요.",
    action: "추가하기",
  },
  {
    href: "/community",
    icon: Search,
    title: "친구 찾기",
    desc: "전화번호나 초대코드로 친구를 찾는 기능은 준비 중이에요.",
    action: "준비중",
    disabled: true,
  },
  {
    href: "/family/members",
    icon: MessageCircleHeart,
    title: "응원 메시지",
    desc: "오늘도 같이 실천하자는 응원을 보내보세요.",
    action: "응원하기",
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("health");
  const showFamilyCommunity = activeTab === "family";

  return (
    <MobileShell>
      <AppHeader title="커뮤니티" />
      <main className="flex-1 overflow-y-auto bg-[#F7FBF8] px-4 pb-24 pt-4">
        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
          {communityTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                activeTab === tab.id
                  ? "bg-[#4CAF6A] text-white shadow-sm"
                  : "bg-white text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!showFamilyCommunity ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-green-100 bg-white p-6 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF7EF] text-3xl">
              🌱
            </span>
            <h1 className="mt-5 text-xl font-black text-[#1F2937]">곧 만나요! 준비 중이에요 🌱</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {communityTabs.find((tab) => tab.id === activeTab)?.label} 커뮤니티 공간을 준비하고 있어요.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
              <UsersRound size={28} />
              <h1 className="mt-3 text-2xl font-black">함께하는 건강 커뮤니티</h1>
              <p className="mt-2 text-sm leading-relaxed text-green-50">
                가족, 친구와 함께 기록하고 응원하면서 건강 습관을 오래 이어가요.
              </p>
              <div className="mt-4 rounded-2xl bg-white/15 p-4">
                <p className="text-sm font-bold text-green-50">오늘의 커뮤니티 미션</p>
                <p className="mt-1 text-lg font-black">한 사람에게 건강 응원 보내기</p>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              {communityCards.map(({ href, icon: Icon, title, desc, action, disabled }) => {
                const card = (
                  <article className={`h-full rounded-2xl border bg-white p-4 shadow-sm ${disabled ? "border-gray-100 opacity-80" : "border-green-100 active:scale-[0.98]"}`}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF7EF]">
                      <Icon size={22} className="text-[#4CAF6A]" />
                    </span>
                    <h2 className="mt-3 font-black text-[#1F2937]">{title}</h2>
                    <p className="mt-1 min-h-12 text-xs leading-relaxed text-gray-500">{desc}</p>
                    <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${disabled ? "bg-gray-100 text-gray-400" : "bg-[#EAF7EF] text-[#1F5A3A]"}`}>
                      {action}
                    </p>
                  </article>
                );

                return disabled ? (
                  <div key={title}>{card}</div>
                ) : (
                  <Link key={title} href={href}>
                    {card}
                  </Link>
                );
              })}
            </section>

            <section className="mt-4 rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF]">
                  <Send size={20} className="text-[#4CAF6A]" />
                </span>
                <div>
                  <h2 className="font-black text-[#1F2937]">초대 기능은 이렇게 확장할게요</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    다음 단계에서 초대코드, 친구 검색, 가족 그룹 채팅, 챌린지 공유를 연결하면 사용자들만의 건강 커뮤니티 공간으로 넓힐 수 있어요.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
