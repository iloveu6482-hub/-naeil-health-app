"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  HeartHandshake,
  HeartPulse,
  Leaf,
  MessageCircle,
  Moon,
  PencilLine,
  PlayCircle,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

type CommunityTab = "home" | "avatar" | "records" | "family" | "meetup";
type CharacterFilter = "전체" | "웹툰형" | "감성형" | "시니어형" | "코치";

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

const storyCharacters = [
  { name: "한지훈", type: "웹툰형", avatar: "지훈", hasNew: true },
  { name: "서아린", type: "웹툰형", avatar: "아린", hasNew: true },
  { name: "윤서준", type: "감성형", avatar: "서준", hasNew: false },
  { name: "서유나", type: "감성형", avatar: "유나", hasNew: true },
  { name: "박성호", type: "시니어형", avatar: "성호", hasNew: false },
  { name: "윤정희", type: "시니어형", avatar: "정희", hasNew: true },
  { name: "하루쌤", type: "코치", avatar: "하루", hasNew: true },
  { name: "루미", type: "코치", avatar: "루미", hasNew: false },
  { name: "강태오", type: "코치", avatar: "태오", hasNew: true },
  { name: "온유쌤", type: "코치", avatar: "온유", hasNew: false },
];

const toonEpisodes = [
  {
    category: "프롤로그",
    title: "내일의건강 커뮤니티가 열렸다",
    desc: "아바타와 코치들이 처음 만나는 이야기",
    readTime: "3분",
    hasImage: true,
  },
  {
    category: "프롤로그",
    title: "첫 번째 미션은 물 한 잔",
    desc: "작은 건강 습관이 시작되는 순간",
    readTime: "3분",
    hasImage: true,
  },
  {
    category: "시즌1",
    title: "아바타라고 다 건강한 건 아닙니다",
    desc: "건강해 보이지만 사실은 각자 사정이 있는 아바타들",
    readTime: "5분",
    hasImage: false,
  },
];

const avatarDailyPosts = [
  {
    name: "윤서준",
    type: "감성형 힐링 아바타",
    body: "오늘은 운동보다 운동화 신는 게 더 어려운 날이었어요. 그래도 10분은 걸었습니다.",
    tags: ["산책", "마음기록", "작은실천"],
  },
  {
    name: "서유나",
    type: "감성형 여성 아바타",
    body: "물 한 잔 챙긴 것도 오늘의 루틴이에요. 천천히 가도 괜찮아요.",
    tags: ["수분", "힐링", "꾸준함"],
  },
  {
    name: "한지훈",
    type: "웹툰형 남성 아바타",
    body: "계획만 세워서는 아무것도 시작되지 않습니다. 일단 움직였습니다.",
    tags: ["실행력", "걷기", "루틴시작"],
  },
  {
    name: "서아린",
    type: "웹툰형 여성 아바타",
    body: "운동 전 준비운동은 선택이 아니라 안전입니다. 오늘도 가볍게 몸부터 풀어요.",
    tags: ["스트레칭", "활동형", "건강습관"],
  },
];

const coachMessages = [
  {
    name: "하루쌤",
    type: "부드러운 칭찬형 코치",
    message: "잘하고 있어요. 오늘의 한 걸음이 정말 중요해요.",
    routine: "물 한 잔, 가벼운 스트레칭",
  },
  {
    name: "루미",
    type: "친근한 친구형 코치",
    message: "완벽보다 시작! 우리 오늘도 같이 해봐요.",
    routine: "홈트 5분, 걷기 10분",
  },
  {
    name: "강태오 코치",
    type: "강한 동기부여형 코치",
    message: "핑계는 짧게, 실천은 길게. 지금 바로 움직입시다.",
    routine: "근력운동, 습관 챌린지",
  },
  {
    name: "온유쌤",
    type: "시니어 친화형 코치",
    message: "천천히 하셔도 괜찮아요. 건강은 매일의 습관에서 시작돼요.",
    routine: "산책, 관절 스트레칭, 식사기록",
  },
];

const characterCards = [
  { name: "한지훈", filter: "웹툰형" as CharacterFilter, type: "웹툰형 남성 아바타", keywords: ["활동형", "실행력", "꾸준함"], count: 8, action: "지훈 보기" },
  { name: "서아린", filter: "웹툰형" as CharacterFilter, type: "웹툰형 여성 아바타", keywords: ["활동형", "자신감", "건강미"], count: 6, action: "아린 보기" },
  { name: "윤서준", filter: "감성형" as CharacterFilter, type: "감성형 남성 아바타", keywords: ["차분함", "공감형", "힐링"], count: 5, action: "서준 보기" },
  { name: "서유나", filter: "감성형" as CharacterFilter, type: "감성형 여성 아바타", keywords: ["따뜻함", "섬세함", "공감력"], count: 7, action: "유나 보기" },
  { name: "박성호", filter: "시니어형" as CharacterFilter, type: "시니어 남성 아바타", keywords: ["안정감", "배려심", "꾸준함"], count: 4, action: "성호 보기" },
  { name: "윤정희", filter: "시니어형" as CharacterFilter, type: "시니어 여성 아바타", keywords: ["다정함", "여유", "안정감"], count: 5, action: "정희 보기" },
  { name: "하루쌤", filter: "코치" as CharacterFilter, type: "부드러운 칭찬형 코치", keywords: ["칭찬", "안정감", "생활습관"], count: 10, action: "하루쌤 보기" },
  { name: "루미", filter: "코치" as CharacterFilter, type: "친근한 친구형 코치", keywords: ["친근함", "에너지", "응원"], count: 9, action: "루미 보기" },
  { name: "강태오", filter: "코치" as CharacterFilter, type: "강한 동기부여형 코치", keywords: ["추진력", "목표달성", "운동습관"], count: 8, action: "태오 보기" },
  { name: "온유쌤", filter: "코치" as CharacterFilter, type: "시니어 친화형 코치", keywords: ["배려", "안정감", "생활관리"], count: 6, action: "온유쌤 보기" },
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
const characterFilters: CharacterFilter[] = ["전체", "웹툰형", "감성형", "시니어형", "코치"];

const meetupCards = [
  { title: "초보 걷기 모임", desc: "이번 주 목표: 하루 5,000보 걷기", members: "참여자 32명" },
  { title: "건강검진 관리 모임", desc: "검진 결과를 확인하고 생활습관을 함께 관리해요.", members: "참여자 18명" },
];

const bragCards = ["운동복만 입고 끝내려다가 홈트 5분 했어요!", "오늘 물 한 잔 기록 완료했어요."];

function SectionTitle({
  children,
  desc,
}: {
  children: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="mb-3 mt-5">
      <h2 className="text-lg font-black text-[#1F2937]">{children}</h2>
      {desc ? <p className="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p> : null}
    </div>
  );
}

function EmptyActionCard({
  icon: Icon,
  title,
  desc,
  action,
  href,
}: {
  icon: LucideIcon;
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

function InitialBadge({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-base" : size === "sm" ? "h-10 w-10 text-xs" : "h-13 w-13 text-sm";

  return (
    <span className={`${sizeClass} relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EAF7EF] to-[#BEE8CA] font-black text-[#1F5A3A] ring-2 ring-white shadow-sm`}>
      {name.slice(-2)}
    </span>
  );
}

function AvatarPlaza() {
  const [filter, setFilter] = useState<CharacterFilter>("전체");
  const filteredCharacters = filter === "전체" ? characterCards : characterCards.filter((card) => card.filter === filter);

  return (
    <>
      <section className="rounded-3xl bg-gradient-to-br from-[#1F5A3A] via-[#3E9D5C] to-[#8BD78E] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-green-50">읽고 보는 캐릭터 커뮤니티</p>
            <h1 className="mt-2 text-2xl font-black">아바타 광장</h1>
            <p className="mt-2 text-sm leading-relaxed text-green-50">
              아바타와 코치들의 이야기, 내건툰 연재와 캐릭터 일상을 만나보세요.
            </p>
          </div>
          <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles size={26} />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href="#naeguntoon" className="flex min-h-11 items-center justify-center rounded-2xl bg-white px-3 text-sm font-black text-[#1F5A3A]">
            내건툰 보기
          </a>
          <a href="#avatar-feed" className="flex min-h-11 items-center justify-center rounded-2xl bg-white/20 px-3 text-sm font-black text-white ring-1 ring-white/30">
            오늘의 아바타 보기
          </a>
        </div>
      </section>

      <section className="scrollbar-hide -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {storyCharacters.map((character) => (
          <button key={character.name} type="button" className="w-18 shrink-0 text-center">
            <span className="relative mx-auto block h-14 w-14 rounded-full bg-gradient-to-br from-[#EAF7EF] to-[#BDE8CA] p-1 shadow-sm">
              <InitialBadge name={character.avatar} />
              {character.hasNew ? <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-[#4CAF6A]" /> : null}
            </span>
            <span className="mt-1 block truncate text-xs font-black text-[#1F2937]">{character.name}</span>
          </button>
        ))}
      </section>

      <section id="naeguntoon">
        <SectionTitle desc="아바타와 코치들이 함께 만드는 건강생활 이야기">내건툰 연재</SectionTitle>
        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {toonEpisodes.map((episode, index) => (
            <article key={episode.title} className="w-[260px] shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="relative h-32 bg-gradient-to-br from-[#DDF4E5] to-[#FFF8CF] p-4">
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#1F5A3A]">{episode.category}</span>
                <div className="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75">
                  {index === 0 ? <BookOpen className="text-[#4CAF6A]" /> : index === 1 ? <Droplets className="text-[#20B8D6]" /> : <Sparkles className="text-[#D7A500]" />}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-black text-[#1F2937]">{episode.title}</h3>
                <p className="mt-1 min-h-10 text-sm leading-relaxed text-gray-500">{episode.desc}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>읽는 시간 {episode.readTime}</span>
                  <span>{episode.hasImage ? "이미지 포함" : "텍스트 중심"}</span>
                </div>
                <button className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-2xl bg-[#EAF7EF] text-sm font-black text-[#1F5A3A]">
                  <PlayCircle size={16} /> 이어보기
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="avatar-feed">
        <SectionTitle>오늘의 아바타 일상</SectionTitle>
        <div className="space-y-3">
          {avatarDailyPosts.map((post) => (
            <article key={post.name} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <InitialBadge name={post.name} />
                <div>
                  <h3 className="font-black text-[#1F2937]">{post.name}</h3>
                  <p className="text-xs font-bold text-gray-400">{post.type}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#374151]">{post.body}</p>
              <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#EAF7EF] to-white p-4">
                <div className="flex min-h-24 items-center justify-center rounded-2xl border border-white/80 bg-white/50 text-sm font-black text-[#4CAF6A]">
                  오늘의 작은 실천 장면
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F3F7F4] px-2 py-1 text-xs font-bold text-gray-500">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black text-[#1F5A3A]">
                <button className="flex min-h-9 items-center justify-center gap-1 rounded-full bg-[#EAF7EF]"><Heart size={14} />응원해요</button>
                <button className="flex min-h-9 items-center justify-center gap-1 rounded-full bg-[#F3F7F4]"><Bookmark size={14} />저장</button>
                <button className="flex min-h-9 items-center justify-center gap-1 rounded-full bg-[#F3F7F4]"><MessageCircle size={14} />댓글</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SectionTitle>오늘의 코치 한마디</SectionTitle>
      <section className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {coachMessages.map((coach) => (
          <article key={coach.name} className="w-[235px] shrink-0 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <InitialBadge name={coach.name} />
              <div>
                <h3 className="font-black text-[#1F2937]">{coach.name}</h3>
                <p className="text-xs font-bold text-[#4CAF6A]">{coach.type}</p>
              </div>
            </div>
            <p className="mt-3 min-h-14 text-sm leading-relaxed text-[#374151]">{coach.message}</p>
            <div className="mt-3 rounded-2xl bg-[#EAF7EF] p-3">
              <p className="text-xs font-black text-[#4CAF6A]">추천 루틴</p>
              <p className="mt-1 text-sm font-bold text-[#1F5A3A]">{coach.routine}</p>
            </div>
          </article>
        ))}
      </section>

      <SectionTitle>캐릭터별 모아보기</SectionTitle>
      <section className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {characterFilters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              filter === item ? "bg-[#4CAF6A] text-white" : "bg-white text-gray-500"
            }`}
          >
            {item}
          </button>
        ))}
      </section>
      <section className="mt-3 grid grid-cols-2 gap-3">
        {filteredCharacters.map((character) => (
          <article key={character.name} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <InitialBadge name={character.name} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate font-black text-[#1F2937]">{character.name}</h3>
                <p className="truncate text-xs text-gray-400">{character.type}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {character.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword} className="rounded-full bg-[#F3F7F4] px-2 py-1 text-[11px] font-bold text-gray-500">
                  {keyword}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-[#4CAF6A]">최근 콘텐츠 {character.count}개</p>
            <button className="mt-3 flex min-h-9 w-full items-center justify-center rounded-xl bg-[#EAF7EF] text-xs font-black text-[#1F5A3A]">
              {character.action}
            </button>
          </article>
        ))}
      </section>
    </>
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
              <p className="text-xs font-black text-[#4CAF6A]">오늘의 아바타툰</p>
              <h3 className="mt-2 text-lg font-black text-[#1F2937]">아바타라고 다 건강한 건 아닙니다</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">아바타와 코치들이 함께 만드는 건강생활 이야기</p>
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

        {activeTab === "avatar" && <AvatarPlaza />}

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
                <Link key={label} href="/habits" className="rounded-2xl bg-white p-3 text-center shadow-sm active:scale-[0.98]">
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
