"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import { saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { AvatarStyle } from "@/types/user";
import { sampleUser } from "@/lib/sampleData";
import { Check } from "lucide-react";

const avatarOptions: {
  style: AvatarStyle;
  emoji: string;
  name: string;
  desc: string;
  recommend: string;
  gradient: string;
}[] = [
  {
    style: "3d",
    emoji: "🧑",
    name: "밝은 3D 캐릭터형",
    desc: "생동감 있는 3D 스타일의 건강 아바타입니다.",
    recommend: "활동적인 건강관리를 즐기는 분께 추천",
    gradient: "from-[#4CAF6A] to-[#1F5A3A]",
  },
  {
    style: "emotional",
    emoji: "👩",
    name: "감성 애니메이션형",
    desc: "따뜻하고 감성적인 애니메이션 스타일입니다.",
    recommend: "일상 속 건강습관을 부드럽게 만들고 싶은 분께 추천",
    gradient: "from-[#F7C948] to-[#F59E0B]",
  },
  {
    style: "senior",
    emoji: "🧓",
    name: "시니어 친화형",
    desc: "큰 글씨와 명확한 표현으로 누구나 쉽게 사용할 수 있습니다.",
    recommend: "40대 이상, 처음 건강앱을 시작하는 분께 추천",
    gradient: "from-[#60A5FA] to-[#3B82F6]",
  },
];

export default function AvatarPage() {
  const [selected, setSelected] = useState<AvatarStyle | null>(null);
  const router = useRouter();

  const handleStart = () => {
    if (!selected) return;
    const user = { ...sampleUser, avatarStyle: selected };
    saveToStorage(STORAGE_KEYS.USER_PROFILE, user);
    saveToStorage(STORAGE_KEYS.AVATAR_STYLE, selected);
    router.push("/dashboard");
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-screen bg-[#FAFCFA]">
        <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 pt-14 pb-8 text-white text-center">
          <h1 className="text-2xl font-extrabold mb-1">나만의 건강이 선택</h1>
          <p className="text-green-100 text-sm">함께할 아바타 스타일을 골라보세요</p>
        </div>

        <div className="flex-1 px-4 py-6 flex flex-col gap-4">
          {avatarOptions.map((opt) => {
            const isSelected = selected === opt.style;
            return (
              <button
                key={opt.style}
                onClick={() => setSelected(opt.style)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-[#4CAF6A] bg-[#EAF7EF] shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-3xl shadow`}
                  >
                    {opt.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#1F2937] text-base">{opt.name}</p>
                      {isSelected && (
                        <div className="w-6 h-6 bg-[#4CAF6A] rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
                <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-[#4CAF6A] font-medium">💡 {opt.recommend}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={handleStart}
            disabled={!selected}
            className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
              selected
                ? "bg-[#4CAF6A] text-white shadow-lg active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {selected ? "이 아바타로 시작하기 🌱" : "아바타를 선택해주세요"}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
