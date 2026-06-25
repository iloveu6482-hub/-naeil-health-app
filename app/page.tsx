"use client";

import Image from "next/image";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import {
  BrainCircuit,
  Check,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Footprints,
  Leaf,
  LockKeyhole,
  Shield,
  Sprout,
  UserRound,
} from "lucide-react";

const features = [
  { icon: ClipboardCheck, label: "건강검진 결과 분석", desc: "검진 수치를\n쉽게 이해해요", tone: "from-[#E7F7E9] to-[#F8FFF9]", iconColor: "text-[#238D4A]" },
  { icon: BrainCircuit, label: "AI 맞춤 리포트", desc: "개인화된\n건강 인사이트", tone: "from-[#E8F8EE] to-[#F9FFFB]", iconColor: "text-[#24945A]" },
  { icon: Footprints, label: "AI 트레이너 코칭", desc: "내 성향에 맞게\n습관을 도와줘요", tone: "from-[#EAF8E9] to-[#FBFFFA]", iconColor: "text-[#2A8B4D]" },
  { icon: Coins, label: "헬스포인트 보상", desc: "건강 행동으로\n쌓는 앱 포인트", tone: "from-[#FFF5CE] to-[#FFFDF4]", iconColor: "text-[#E8A317]" },
];

const avatars = [
  { image: "/avatars/default-female-3d.png", label: "3D형", selected: true },
  { image: "/avatars/default-female-emotional.png", label: "감성형" },
  { image: "/avatars/default-male-webtoon.png", label: "웹툰형" },
  { image: "/avatars/default-male-senior.png", label: "시니어형" },
];

export default function HomePage() {
  return (
    <MobileShell>
      <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#EAF8EF_0%,#F8FCF9_46%,#FFFFFF_100%)]">
        <section className="relative overflow-hidden rounded-b-[38px] bg-[radial-gradient(circle_at_50%_12%,#BFF7C8_0%,#62D982_42%,#28AD61_100%)] px-5 pb-16 pt-5 text-center text-white">
          <div className="pointer-events-none absolute -left-14 top-28 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-10 h-56 w-56 rounded-full bg-lime-100/25 blur-3xl" />
          <Leaf className="pointer-events-none absolute left-9 top-32 rotate-[-28deg] text-white/35" size={42} />
          <Leaf className="pointer-events-none absolute right-12 top-56 rotate-[26deg] text-white/25" size={35} />

          <div className="relative mx-auto -mb-1 h-20 w-20 overflow-hidden rounded-full bg-white shadow-[0_12px_28px_rgba(19,118,65,0.24)] ring-4 ring-white/55">
            <Image src="/logo.png" alt="내일의건강 로고" fill priority className="scale-[1.85] object-cover" />
          </div>

          <h1 className="text-[34px] font-black tracking-[-0.055em] drop-shadow-sm">내일의건강</h1>
          <p className="mt-1 text-sm font-medium leading-snug text-green-50">건강검진 결과를 쉽게 이해하고<br />매일의 습관으로 바꾸는 AI 건강관리</p>
          <span className="mt-2 inline-flex rounded-full bg-gradient-to-r from-[#D8F7DF] to-[#B9EDC6] px-5 py-1.5 text-sm font-extrabold text-[#17663A] shadow-[0_8px_22px_rgba(0,0,0,0.15)]">AI 건강관리 파트너</span>
        </section>

        <main className="relative z-10 -mt-10 space-y-2.5 px-3 pb-4">
          <section className="rounded-[24px] border border-white bg-white/95 p-3 shadow-[0_12px_28px_rgba(29,82,51,0.13)] backdrop-blur">
            <h2 className="mb-2 flex items-center justify-center gap-1.5 text-sm font-extrabold text-[#1E293B]"><Sprout size={17} className="text-[#24944E]" />먼저 나에게 맞는 건강 아바타를 선택해보세요</h2>
            <div className="grid grid-cols-4 gap-1.5">
              {avatars.map((avatar) => (
                <div key={avatar.label} className={`relative rounded-xl border-2 p-1.5 pb-2 text-center transition ${avatar.selected ? "border-[#24944E] bg-[#F4FCF6] shadow-[0_6px_14px_rgba(36,148,78,0.16)]" : "border-gray-100 bg-white shadow-sm"}`}>
                  {avatar.selected && <span className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#2DAE5B] text-white shadow"><Check size={14} strokeWidth={3} /></span>}
                  <div className="relative mx-auto h-16 w-16 max-w-full overflow-hidden rounded-full bg-[#EAF7EF]">
                    <Image src={avatar.image} alt={`${avatar.label} 기본 건강이`} fill className="object-cover" />
                  </div>
                  <p className={`mt-1 text-xs font-extrabold ${avatar.selected ? "text-[#208347]" : "text-[#334155]"}`}>{avatar.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400"><Shield size={12} fill="currentColor" />코치진은 로그인 후 아바타 설정에서 언제든 변경할 수 있어요</p>
          </section>

          <section className="rounded-[24px] border border-white bg-white/95 p-3 shadow-[0_12px_28px_rgba(29,82,51,0.11)]">
            <h2 className="mb-2 text-center text-base font-black tracking-tight text-[#1E293B]">내일의건강이 특별한 이유 <span className="text-[#2EAD5A]">♥</span></h2>
            <div className="grid grid-cols-2 gap-2">
              {features.map(({ icon: Icon, label, desc, tone, iconColor }) => (
                <div key={label} className="flex min-h-[82px] items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-[0_5px_14px_rgba(31,41,55,0.07)]">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} shadow-inner`}><Icon size={23} className={iconColor} strokeWidth={2.1} /></div>
                  <div><p className="text-xs font-extrabold leading-snug text-[#1E293B]">{label}</p><p className="mt-0.5 whitespace-pre-line text-[10px] leading-snug text-gray-500">{desc}</p></div>
                </div>
              ))}
            </div>

            <Link href="/login" className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#37B95D] to-[#168443] px-4 text-base font-extrabold text-white shadow-[0_8px_18px_rgba(22,132,67,0.24)] active:scale-[0.98]">
              <span className="flex items-center gap-2"><Leaf size={19} fill="currentColor" className="text-lime-200" />로그인하고 시작하기</span><ChevronRight size={22} />
            </Link>
            <Link href="/signup" className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-2 border-[#24944E] bg-white px-4 text-sm font-extrabold text-[#208347] active:scale-[0.98]">
              <span className="flex items-center gap-2"><UserRound size={19} />처음이라면 회원가입</span><ChevronRight size={21} />
            </Link>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-gray-400"><LockKeyhole size={11} />무료로 시작할 수 있어요 · 체험 데이터는 현재 기기에 저장됩니다</p>
          </section>
        </main>
      </div>
    </MobileShell>
  );
}
