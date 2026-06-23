"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import HealthAvatar from "@/components/common/HealthAvatar";
import { createIllustratedAvatar } from "@/lib/avatarImage";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { AvatarStyle, UserProfile } from "@/types/user";

const avatarOptions: Array<{ style: AvatarStyle; emoji: string; name: string; desc: string; recommend: string; gradient: string }> = [
  { style: "3d", emoji: "🧑", name: "밝은 3D 캐릭터형", desc: "내 사진을 따뜻하고 밝은 그림형 아바타로 만들어요.", recommend: "대시보드와 건강 요약 화면에 추천", gradient: "from-[#4CAF6A] to-[#1F5A3A]" },
  { style: "emotional", emoji: "👩", name: "감성 애니메이션형", desc: "부드럽고 따뜻한 애니메이션 스타일입니다.", recommend: "일상 속 건강습관을 편안하게 이어가고 싶은 분께 추천", gradient: "from-[#F7C948] to-[#F59E0B]" },
  { style: "senior", emoji: "🧓", name: "시니어 친화형", desc: "큰 글씨와 명확한 표현으로 누구나 쉽게 사용해요.", recommend: "40대 이상, 건강앱을 처음 시작하는 분께 추천", gradient: "from-[#60A5FA] to-[#3B82F6]" },
];

export default function AvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(sampleUser);
  const [selected, setSelected] = useState<AvatarStyle>("3d");
  const [avatarImage, setAvatarImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    setProfile(saved);
    setSelected(saved.avatarStyle || "3d");
    setAvatarImage(saved.avatarImage);
  }, []);

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setMessage("");
    try {
      setAvatarImage(await createIllustratedAvatar(file));
      setMessage("사진을 밝은 그림형 아바타로 만들었어요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사진을 변환하지 못했습니다.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  const handleStart = () => {
    const nextProfile: UserProfile = {
      ...profile,
      avatarStyle: selected,
      avatarImage: selected === "3d" ? avatarImage : undefined,
      avatarEffect: selected === "3d" && avatarImage ? "illustrated" : undefined,
    };
    saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
    saveToStorage(STORAGE_KEYS.AVATAR_STYLE, selected);
    router.push("/dashboard");
  };

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 pb-8 pt-14 text-center text-white">
          <h1 className="mb-1 text-2xl font-extrabold">나만의 건강이 선택</h1>
          <p className="text-sm text-green-100">{profile.name}님과 함께할 아바타를 만들어보세요</p>
        </header>

        <main className="flex-1 space-y-4 px-4 py-6">
          {avatarOptions.map((option) => {
            const isSelected = selected === option.style;
            return (
              <button key={option.style} onClick={() => setSelected(option.style)} className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${isSelected ? "border-[#4CAF6A] bg-[#EAF7EF] shadow-md" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${option.gradient} text-3xl shadow`}>{option.emoji}</div>
                  <div className="flex-1"><div className="flex items-center justify-between"><p className="text-base font-bold text-[#1F2937]">{option.name}</p>{isSelected && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A]"><Check size={14} className="text-white" /></span>}</div><p className="mt-1 text-sm text-gray-600">{option.desc}</p></div>
                </div>
                <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-[#4CAF6A]">💡 {option.recommend}</p>
              </button>
            );
          })}

          {selected === "3d" && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><Sparkles size={20} className="text-[#4CAF6A]" /><h2 className="text-lg font-extrabold text-[#1F2937]">내 사진으로 건강이 만들기</h2></div>
              <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-[#EAF7EF] to-white p-5">
                <HealthAvatar style="3d" size="lg" imageUrl={avatarImage} />
                <p className="mt-3 text-center text-sm text-gray-600">정면 얼굴이 잘 보이는 사진을 선택하면 더 자연스러워요.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImage} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={processing} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#4CAF6A] px-3 font-bold text-white disabled:opacity-60">{avatarImage ? <RefreshCw size={18} /> : <ImagePlus size={18} />}{processing ? "변환 중..." : avatarImage ? "사진 다시 선택" : "내 사진 선택"}</button>
                <button onClick={() => setAvatarImage(undefined)} disabled={!avatarImage} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 font-bold text-gray-600 disabled:opacity-40"><Trash2 size={18} />사진 지우기</button>
              </div>
              {message && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm text-[#1F5A3A]">{message}</p>}
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-400"><Camera size={15} className="mt-0.5 shrink-0" />사진은 외부 서버로 전송되지 않으며 현재 브라우저에서 그림형으로 변환됩니다.</p>
            </section>
          )}
        </main>

        <div className="px-4 pb-8"><button onClick={handleStart} disabled={processing} className="w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg active:scale-95 disabled:opacity-60">이 아바타 저장하고 시작하기 🌱</button></div>
      </div>
    </MobileShell>
  );
}
