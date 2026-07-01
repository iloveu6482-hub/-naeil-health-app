"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  Footprints,
  HeartHandshake,
  HeartPulse,
  MessageCircleHeart,
  Moon,
  PencilLine,
  Sparkles,
  Trophy,
  UsersRound,
  Utensils,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

type CommunityTab = "home" | "avatar" | "records" | "family" | "meetup";

const communityTabs: Array<{ id: CommunityTab; label: string }> = [
  { id: "home", label: "홈" },
  { id: "avatar", label: "아바타" },
  { id: "records", label: "기록" },
  { id: "family", label: "가족" },
  { id: "meetup", label: "모임" },
];

const quickCards = [
  {
    tab: "avatar" as CommunityTab,
    icon: Sparkles,
    title: "아바타 광장",
    desc: "아바타와 코치들의 이야기를 만나보세요.",
    action: "아바타 보기",
  },
  {
    tab: "records" as CommunityTab,
    icon: PencilLine,
    title: "내 기록 공유",
    desc: "오늘의 건강기록을 남겨보세요.",
    action: "기록 올리기",
  },
  {
    tab: "family" as CommunityTab,
    icon: HeartHandshake,
    title: "가족 건강방",
    desc: "가족과 함께 건강을 챙겨보세요.",
    action: "가족방 만들기",
  },
  {
    tab: "meetup" as CommunityTab,
    icon: UsersRound,
    title: "모임/챌린지",
    desc: "함께 실천하고 응원해보세요.",
    action: "참여하기",
  },
];

const avatarStories = [
  {
    title: "아바타라고 다 건강한 건 아닙니다",
    desc: "아바타와 코치들이 함께 만드는 건강생활 이야기",
    tag: "오늘의 아바타툰",
  },
  {
    title: "하루쌤의 물 한 잔 루틴",
    desc: "작은 기록이 어떻게 내일의 몸을 바꾸는지 알려드려요.",
    tag: "코치 이야기",
  },
];

const recordTypes = [
  { icon: Footprints, label: "걷기" },
  { icon: Dumbbell, label: "운동" },
  { icon: Utensils, label: "식사" },
  { icon: Droplets, label: "수분" },
  { icon: Moon, label: "수면" },
  { icon: ClipboardList, label: "복약" },
  { icon: HeartPulse, label: "혈압/혈당" },
  { icon: CalendarCheck, label: "건강검진" },
];

const visibilityOptions = ["나만 보기", "가족에게 공유", "모임에 공유", "전체 공개"];

const meetupCategories = ["걷기", "홈트", "식단", "수면", "혈압관리", "건강검진", "시니어 건강", "가족 건강"];

const meetupCards = [
  {
    title: "초보 걷기 모임",
    desc: "이번 주 목표: 하루 5,000보 걷기",
    members: "참여자 32명",
  },
  {
    title: "건강검진 관리 모임",
    desc: "검진 결과를 확인하고 생활습관을 함께 관리해요.",
    members: "참여자 18명",
  },
];

const bragCards = [
  "운동복만 입고 끝내려다가 홈트 5분 했어요!",
  "오늘 물 한 잔 기록 완료했어요.",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-5 text-lg font-black text-[#1F2937]">{children}</h2>;
}

function EmptyActionCard({
  icon: Icon,
  title,
  desc,
  action,
  href,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
  action: string;
  href: string;
}) {
  return (
    <section className="rounded-3xl border border-green-100 bg-white p-5 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7EF]">
        <Icon size={25} className="text-[#4CAF6A]" />
      </span>
      <h2 className="mt-4 text-lg font-black text-[#1F2937]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#4CAF6A] px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]"
      >
        {action}
      </Link>
    </section>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("home");

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
                activeTab === tab.id ? "bg-[#4CAF6A] text-white shadow-sm" : "bg-white text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "home" && (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] p-5 text-white shadow-sm">
              <UsersRound size={28} />
              <h1 className="mt-3 text-2xl font-black">내일의건강 커뮤니티가 열렸어요 🌱</h1>
              <p className="mt-2 text-sm leading-relaxed text-green-50">
                오늘의 기록을 나누고, 가족과 함께하고, 아바타와 코치의 응원을 받아보세요.
              </p>
              <Link
                href="/habits"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-black text-[#1F5A3A]"
              >
                오늘 기록하기
              </Link>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-[#4CAF6A]">오늘의 커뮤니티 미션</p>
                <p className="mt-2 text-sm font-black text-[#1F2937]">작은 건강 기록 하나를 남겨보세요.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-[#4CAF6A]">오늘의 코치 한마디</p>
                <p className="mt-2 text-sm font-black text-[#1F2937]">혼자보다 함께하면 루틴이 더 오래갑니다.</p>
              </div>
            </section>

            <SectionTitle>빠른 진입</SectionTitle>
            <section className="grid grid-cols-2 gap-3">
              {quickCards.map(({ tab, icon: Icon, title, desc, action }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="rounded-2xl border border-green-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF7EF]">
                    <Icon size={21} className="text-[#4CAF6A]" />
                  </span>
                  <h3 className="mt-3 font-black text-[#1F2937]">{title}</h3>
                  <p className="mt-1 min-h-10 text-xs leading-relaxed text-gray-500">{desc}</p>
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-black text-[#1F5A3A]">
                    {action}
                  </p>
                </button>
              ))}
            </section>

            <SectionTitle>오늘의 아바타 이야기</SectionTitle>
            <article className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black text-[#4CAF6A]">{avatarStories[0].tag}</p>
              <h3 className="mt-2 text-lg font-black text-[#1F2937]">{avatarStories[0].title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{avatarStories[0].desc}</p>
              <button
                type="button"
                onClick={() => setActiveTab("avatar")}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#EAF7EF] text-sm font-black text-[#1F5A3A]"
              >
                보러가기
              </button>
            </article>

            <SectionTitle>오늘의 건강 자랑</SectionTitle>
            <section className="space-y-2">
              {bragCards.map((brag) => (
                <article key={brag} className="rounded-2xl bg-white p-4 text-sm font-bold text-[#1F2937] shadow-sm">
                  “{brag}”
                </article>
              ))}
            </section>

            <SectionTitle>진행 중인 챌린지</SectionTitle>
            <Link href="/challenges" className="block rounded-3xl bg-[#FFF8CF] p-4 shadow-sm active:scale-[0.98]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#9A7B00]">참여자 128명</p>
                  <h3 className="mt-1 text-lg font-black text-[#1F2937]">7일 물 마시기 챌린지</h3>
                  <p className="mt-1 text-sm text-gray-600">오늘 달성률 64%</p>
                </div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80">
                  <Trophy size={28} className="text-[#D7A500]" />
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-[#D7A500]" style={{ width: "64%" }} />
              </div>
            </Link>
          </>
        )}

        {activeTab === "avatar" && (
          <>
            <EmptyActionCard
              icon={Sparkles}
              title="아바타 광장을 준비하고 있어요"
              desc="아바타툰, 코치 이야기, 캐릭터별 건강 루틴 콘텐츠가 이곳에 모일 예정이에요."
              action="아바타 꾸미러 가기"
              href="/avatar"
            />
            <SectionTitle>아바타 이야기 목록</SectionTitle>
            <section className="space-y-3">
              {avatarStories.map((story) => (
                <article key={story.title} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-[#4CAF6A]">{story.tag}</p>
                  <h3 className="mt-1 font-black text-[#1F2937]">{story.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{story.desc}</p>
                </article>
              ))}
            </section>
          </>
        )}

        {activeTab === "records" && (
          <>
            <EmptyActionCard
              icon={PencilLine}
              title="아직 남긴 건강기록이 없어요"
              desc="오늘의 작은 실천부터 기록해보세요. 기록은 나만 보기, 가족 공유, 모임 공유로 확장할 수 있어요."
              action="건강기록 올리기"
              href="/habits"
            />
            <SectionTitle>기록 유형 선택</SectionTitle>
            <section className="grid grid-cols-4 gap-2">
              {recordTypes.map(({ icon: Icon, label }) => (
                <Link
                  key={label}
                  href="/habits"
                  className="rounded-2xl bg-white p-3 text-center shadow-sm active:scale-[0.98]"
                >
                  <Icon className="mx-auto text-[#4CAF6A]" size={22} />
                  <p className="mt-2 text-xs font-black text-[#1F2937]">{label}</p>
                </Link>
              ))}
            </section>
            <SectionTitle>공개 범위</SectionTitle>
            <section className="grid grid-cols-2 gap-2">
              {visibilityOptions.map((option) => (
                <div key={option} className="rounded-2xl border border-green-100 bg-white p-3 text-sm font-bold text-[#1F5A3A]">
                  {option}
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === "family" && (
          <>
            <EmptyActionCard
              icon={HeartHandshake}
              title="아직 가족 건강방이 없어요"
              desc="부모님, 배우자, 자녀와 함께 건강기록을 나누고 서로 응원해보세요."
              action="가족방 만들기"
              href="/family"
            />
            <SectionTitle>가족방 예시</SectionTitle>
            <Link href="/family" className="block rounded-3xl border border-green-100 bg-white p-4 shadow-sm active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#1F2937]">우리 가족 건강방</h3>
                  <p className="mt-1 text-sm text-gray-500">참여자 4명 · 오늘 완료한 기록 3개</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </div>
              <p className="mt-3 rounded-2xl bg-[#EAF7EF] p-3 text-sm font-bold text-[#1F5A3A]">
                미확인 복약 알림 1개가 있어요.
              </p>
            </Link>
          </>
        )}

        {activeTab === "meetup" && (
          <>
            <EmptyActionCard
              icon={UsersRound}
              title="아직 참여 중인 모임이 없어요"
              desc="나와 맞는 건강 모임을 찾고, 챌린지를 함께 실천해보세요."
              action="모임 둘러보기"
              href="/community"
            />
            <SectionTitle>모임 카테고리</SectionTitle>
            <section className="flex flex-wrap gap-2">
              {meetupCategories.map((category) => (
                <span key={category} className="rounded-full bg-white px-3 py-2 text-sm font-black text-[#1F5A3A] shadow-sm">
                  {category}
                </span>
              ))}
            </section>
            <SectionTitle>추천 모임</SectionTitle>
            <section className="space-y-3">
              {meetupCards.map((meetup) => (
                <article key={meetup.title} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-[#4CAF6A]">{meetup.members}</p>
                  <h3 className="mt-1 font-black text-[#1F2937]">{meetup.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{meetup.desc}</p>
                </article>
              ))}
            </section>
            <SectionTitle>모임 챌린지</SectionTitle>
            <Link href="/challenges" className="flex items-center justify-between rounded-3xl bg-[#FFF8CF] p-4 shadow-sm">
              <div>
                <p className="text-xs font-black text-[#9A7B00]">함께 실천</p>
                <h3 className="mt-1 font-black text-[#1F2937]">7일 물 마시기 챌린지</h3>
              </div>
              <Trophy className="text-[#D7A500]" />
            </Link>
          </>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
