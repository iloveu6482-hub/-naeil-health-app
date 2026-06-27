"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { aiCoaches, defaultAiCoach } from "@/lib/coachData";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";

export default function TrainerPage() {
  const router = useRouter();
  const [selectedCoachId, setSelectedCoachId] = useState(defaultAiCoach.id);

  useEffect(() => {
    const savedCoachId = getFromStorage<string>(STORAGE_KEYS.SELECTED_AI_COACH_ID, defaultAiCoach.id);
    setSelectedCoachId(aiCoaches.some((coach) => coach.id === savedCoachId) ? savedCoachId : defaultAiCoach.id);
  }, []);

  const selectCoach = (coachId: string) => {
    setSelectedCoachId(coachId);
    saveToStorage(STORAGE_KEYS.SELECTED_AI_COACH_ID, coachId);
  };

  const start = () => {
    saveToStorage(STORAGE_KEYS.SELECTED_AI_COACH_ID, selectedCoachId);
    router.push("/dashboard");
  };

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-[radial-gradient(circle_at_50%_12%,#BFF7C8_0%,#62D982_42%,#28AD61_100%)] px-6 pb-3 pt-5 text-center text-white">
          <h1 className="mb-0.5 text-xl font-extrabold">AI 코치 선택</h1>
          <p className="text-xs text-green-50">나의 건강 루틴을 함께할 코치를 골라보세요</p>
        </header>

        <main className="flex-1 space-y-3 px-4 py-3">
          <section className="rounded-2xl border border-green-100 bg-white p-2.5 shadow-sm">
            <div className="grid grid-cols-3 text-center text-xs font-bold">
              <span className="text-[#1F5A3A]">① 아바타 선택</span>
              <span className="text-[#1F5A3A]">② 코치 선택</span>
              <span className="text-gray-400">③ 시작</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF7EF]">
              <div className="h-full w-2/3 rounded-full bg-[#4CAF6A]" />
            </div>
          </section>

          <section className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
            <div className="mb-2">
              <h2 className="text-base font-extrabold text-[#1F2937]">AI 코치진 설정</h2>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">대시보드에서 나를 안내할 코치를 선택하세요. 설정에서 다시 바꿀 수 있어요.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {aiCoaches.map((coach) => {
                const isSelected = selectedCoachId === coach.id;
                return (
                  <button key={coach.id} onClick={() => selectCoach(coach.id)} className={`rounded-2xl border-2 bg-white p-2.5 text-left transition-all active:scale-[0.99] ${isSelected ? "border-[#4CAF6A] shadow-[0_8px_18px_rgba(76,175,106,0.20)]" : "border-gray-100"}`}>
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#EAF7EF]">
                      <Image src={coach.imageUrl} alt={`${coach.name} AI 코치`} fill sizes="(max-width: 480px) 44vw, 180px" className="object-cover object-center" />
                      {isSelected && <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={14} className="text-white" /></span>}
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-extrabold text-[#1F2937]">{coach.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-[#4CAF6A]">{coach.type}</p>
                      <p className="mt-1 overflow-hidden text-[11px] leading-4 text-gray-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{coach.quote}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        <div className="grid grid-cols-[auto_1fr] gap-2 px-4 pb-4">
          <button onClick={() => router.push("/avatar")} className="flex min-h-12 items-center justify-center rounded-2xl border border-green-200 bg-white px-4 font-bold text-[#1F5A3A] active:scale-95">
            <ChevronLeft size={20} />
            이전
          </button>
          <button onClick={start} className="min-h-12 rounded-2xl bg-[#4CAF6A] text-base font-bold text-white shadow-lg active:scale-95">
            시작하기
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
