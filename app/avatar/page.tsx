"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import CameraCapture from "@/components/avatar/CameraCapture";
import AvatarPortraitCard from "@/components/avatar/AvatarPortraitCard";
import { compressGeneratedAvatar, prepareAvatarSource } from "@/lib/avatarImage";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { AvatarStyle, UserProfile } from "@/types/user";

const avatarOptions: Array<{ style: AvatarStyle; emoji: string; name: string; desc: string; recommend: string; gradient: string }> = [
  { style: "3d", emoji: "🧑", name: "밝은 3D 캐릭터형", desc: "내 얼굴을 참고해 의상·포즈·배경까지 새롭게 생성해요.", recommend: "입체적인 건강 히어로 대시보드에 추천", gradient: "from-[#4CAF6A] to-[#1F5A3A]" },
  { style: "emotional", emoji: "👩", name: "감성 애니메이션형", desc: "부드럽고 따뜻한 애니메이션 스타일입니다.", recommend: "편안한 건강습관 화면을 원하는 분께 추천", gradient: "from-[#F7C948] to-[#F59E0B]" },
  { style: "senior", emoji: "🧓", name: "시니어 친화형", desc: "큰 글씨와 명확한 표현으로 누구나 쉽게 사용해요.", recommend: "40대 이상, 건강앱을 처음 시작하는 분께 추천", gradient: "from-[#60A5FA] to-[#3B82F6]" },
];

export default function AvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(sampleUser);
  const [selected, setSelected] = useState<AvatarStyle>("3d");
  const [avatarImage, setAvatarImage] = useState<string>();
  const [sourceImage, setSourceImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const saved = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    setProfile(saved);
    setSelected(saved.avatarStyle || "3d");
    setAvatarImage(saved.avatarImage);
  }, []);

  const processImage = async (file: File) => {
    setProcessing(true);
    setMessage("");
    try {
      setSourceImage(await prepareAvatarSource(file));
      setAvatarImage(undefined);
      setConsent(false);
      setMessage("사진 준비가 끝났어요. 아래에서 AI 건강이를 생성해주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사진을 준비하지 못했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImage(file);
    event.target.value = "";
  };

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    void processImage(file);
  };

  const handleGenerateAvatar = async () => {
    if (!sourceImage || !consent) return;
    setGenerating(true);
    setMessage("얼굴 특징을 살린 입체적인 건강이를 만들고 있어요. 약 20~60초 정도 걸릴 수 있어요.");
    try {
      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: sourceImage }),
      });
      const result = (await response.json()) as { imageData?: string; error?: string };
      if (!response.ok || !result.imageData) throw new Error(result.error || "AI 아바타를 생성하지 못했습니다.");
      setAvatarImage(await compressGeneratedAvatar(result.imageData));
      setMessage("입체적인 AI 건강이가 완성됐어요. 마음에 들면 저장해주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 아바타를 생성하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const clearImages = () => {
    setAvatarImage(undefined);
    setSourceImage(undefined);
    setConsent(false);
    setMessage("");
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

  const displayImage = avatarImage || sourceImage;
  const saveDisabled = processing || generating || (selected === "3d" && Boolean(sourceImage) && !avatarImage);

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] px-6 pb-8 pt-14 text-center text-white">
          <h1 className="mb-1 text-2xl font-extrabold">나만의 건강이 선택</h1>
          <p className="text-sm text-green-100">{profile.name}님을 닮은 입체적인 건강이를 만들어보세요</p>
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
              <div className="mb-4 flex items-center gap-2"><Sparkles size={20} className="text-[#4CAF6A]" /><h2 className="text-lg font-extrabold text-[#1F2937]">AI 건강이 생성</h2></div>
              <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-[#EAF7EF] to-white p-5">
                <AvatarPortraitCard imageUrl={displayImage} name={avatarImage ? `${profile.name}님의 AI 건강이` : sourceImage ? "AI 생성용 원본 사진" : `${profile.name}님의 건강이`} compact />
                <p className="mt-3 text-center text-sm text-gray-600">사진을 선택하면 AI가 얼굴 특징을 참고해 새로운 의상·포즈·입체 배경을 생성합니다.</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImage} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={processing || generating} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#4CAF6A] px-3 font-bold text-white disabled:opacity-60">{sourceImage ? <RefreshCw size={18} /> : <ImagePlus size={18} />}{processing ? "준비 중..." : "사진 업로드"}</button>
                <button onClick={() => setShowCamera(true)} disabled={processing || generating} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5A3A] px-3 font-bold text-white disabled:opacity-60"><Camera size={18} />바로 촬영</button>
              </div>

              {sourceImage && (
                <div className="mt-4 rounded-2xl border border-green-100 bg-[#F7FBF8] p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-[#4CAF6A]" />
                    <span>본인 사진이 AI 아바타 생성을 위해 OpenAI 이미지 API로 전송되는 것에 동의합니다. 내일의건강 앱 서버에는 별도 저장하지 않습니다.</span>
                  </label>
                  <button onClick={handleGenerateAvatar} disabled={!consent || generating} className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] text-lg font-extrabold text-white shadow-lg disabled:opacity-45"><Sparkles size={21} />{generating ? "AI 건강이 생성 중..." : avatarImage ? "AI 건강이 다시 생성하기" : "AI 건강이 생성하기"}</button>
                </div>
              )}

              {(avatarImage || sourceImage) && <button onClick={clearImages} disabled={generating} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 font-bold text-gray-600 disabled:opacity-50"><Trash2 size={17} />사진과 결과 지우기</button>}
              {message && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm leading-relaxed text-[#1F5A3A]">{message}</p>}
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-400"><Camera size={15} className="mt-0.5 shrink-0" />기존 필터형 이미지는 사진을 다시 선택하고 AI 생성해야 새 아바타로 교체됩니다.</p>
            </section>
          )}
        </main>

        <div className="px-4 pb-8"><button onClick={handleStart} disabled={saveDisabled} className="w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg active:scale-95 disabled:opacity-45">이 아바타 저장하고 시작하기 🌱</button></div>
        {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      </div>
    </MobileShell>
  );
}
