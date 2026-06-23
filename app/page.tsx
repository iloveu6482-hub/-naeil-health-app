"use client";

import Link from "next/link";
import Image from "next/image";
import MobileShell from "@/components/layout/MobileShell";
import { Sprout, FileSearch, Brain, Heart, Gift } from "lucide-react";

const features = [
  { icon: FileSearch, label: "건강검진 결과 분석", desc: "검진 수치를 쉽게 이해해요", color: "bg-blue-50 text-blue-600" },
  { icon: Brain, label: "AI 맞춤 리포트", desc: "개인화된 건강 인사이트", color: "bg-purple-50 text-purple-600" },
  { icon: Heart, label: "생활습관 코칭", desc: "매일 건강한 습관 형성", color: "bg-red-50 text-red-500" },
  { icon: Gift, label: "헬스포인트 보상", desc: "건강 행동으로 쌓는 앱 포인트", color: "bg-[#EAF7EF] text-[#4CAF6A]" },
];

export default function HomePage() {
  return (
    <MobileShell>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#EAF7EF] to-[#FAFCFA]">
        <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 pt-16 pb-10 text-white text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-5xl">🌱</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sprout size={22} className="text-green-300" />
            <h1 className="text-3xl font-extrabold tracking-tight">내일의건강</h1>
          </div>
          <p className="text-green-100 text-sm leading-relaxed mt-2">
            오늘의 건강을 이해하고, 더 나은 내일을 준비하는
          </p>
          <p className="text-green-100 text-sm font-semibold">
            AI 건강관리 파트너
          </p>
          <div className="mt-4 bg-white/10 rounded-xl px-4 py-2 text-xs text-green-100">
            건강 데이터를 행동으로, 행동을 보상으로 이어주는 AI 건강관리 플랫폼
          </div>
        </div>

        <div className="flex justify-center -mt-6 mb-0 z-10 relative">
          <div className="flex gap-3">
            {[
              { image: "/avatars/default-female-3d.png", label: "3D형" },
              { image: "/avatars/default-female-emotional.png", label: "감성형" },
              { image: "/avatars/default-female-webtoon.png", label: "웹툰형" },
              { image: "/avatars/default-female-senior.png", label: "시니어형" },
            ].map((avatar) => (
              <div key={avatar.label} className="flex flex-col items-center gap-1">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#4CAF6A] bg-white shadow-lg">
                  <Image src={avatar.image} alt={`${avatar.label} 기본 건강이`} fill className="object-cover" />
                </div>
                <span className="text-xs text-gray-500">{avatar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-[#1F2937] mb-4 text-center">핵심 서비스</h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm font-bold text-[#1F2937]">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-10 mt-auto pt-4">
          <Link
            href="/login"
            className="block w-full bg-[#4CAF6A] hover:bg-[#3d9e5d] active:scale-95 transition-all text-white text-center text-lg font-bold py-4 rounded-2xl shadow-lg"
          >
            로그인하고 시작하기 🌱
          </Link>
          <Link href="/signup" className="mt-3 block w-full rounded-2xl border-2 border-[#4CAF6A] py-3 text-center font-bold text-[#1F5A3A]">
            처음이라면 회원가입
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">
            무료로 시작 · MVP 데이터는 현재 브라우저에 저장
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
