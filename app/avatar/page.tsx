"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import CameraCapture from "@/components/avatar/CameraCapture";
import AvatarPortraitCard from "@/components/avatar/AvatarPortraitCard";
import AnimatedAvatar from "@/components/avatar/AnimatedAvatar";
import { compressGeneratedAvatar, prepareAvatarSource } from "@/lib/avatarImage";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import { samplePointTransactions } from "@/lib/sampleData";
import { calculatePointBalance, createSpendTransaction } from "@/lib/rewards";
import { getDefaultAvatars } from "@/lib/defaultAvatars";
import type { DefaultAvatar } from "@/lib/defaultAvatars";
import type { AvatarGender, AvatarStyle, UserProfile } from "@/types/user";
import type { PointTransaction } from "@/types/reward";

const AVATAR_REGENERATION_COST = 1500;
const MONTHLY_REGENERATION_LIMIT = 1;

export default function AvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(sampleUser);
  const [selected, setSelected] = useState<AvatarStyle>("3d");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [selectedDefaultId, setSelectedDefaultId] = useState<string>();
  const [avatarImage, setAvatarImage] = useState<string>();
  const [sourceImage, setSourceImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const displayName = profile.name?.trim() || "사용자";

  useEffect(() => {
    const saved = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    setProfile(saved);
    setSelected(saved.avatarStyle || "3d");
    setAvatarGender(saved.defaultAvatarGender || (saved.gender === "male" ? "male" : "female"));
    setSelectedDefaultId(saved.defaultAvatarId);
    setAvatarImage(saved.avatarImage);
    const transactions = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
    setPointBalance(calculatePointBalance(transactions));
  }, []);

  const processImage = async (file: File) => {
    setProcessing(true);
    setMessage("");
    try {
      setSourceImage(await prepareAvatarSource(file));
      setAvatarImage(undefined);
      setSelected("3d");
      setSelectedDefaultId(undefined);
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
    const generationCount = profile.avatarGenerationCount || 0;
    const isFirstGeneration = generationCount === 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRegenerationCount = profile.avatarRegenerationMonth === currentMonth ? profile.avatarRegenerationCount || 0 : 0;
    const generationCost = isFirstGeneration || profile.isPremium ? 0 : AVATAR_REGENERATION_COST;

    if (!isFirstGeneration && monthlyRegenerationCount >= MONTHLY_REGENERATION_LIMIT) {
      setMessage("이번 달 AI 건강이 재생성 기회를 이미 사용했어요. 다음 달에 다시 이용해주세요.");
      return;
    }
    if (generationCost > pointBalance) {
      setMessage(`AI 건강이 재생성에는 ${AVATAR_REGENERATION_COST.toLocaleString()}P가 필요해요. 현재 ${pointBalance.toLocaleString()}P를 보유하고 있어요.`);
      return;
    }

    setGenerating(true);
    setMessage(isFirstGeneration ? "첫 AI 건강이를 무료로 만들고 있어요. 약 20~60초 정도 걸릴 수 있어요." : "헬스포인트는 생성 성공 후에만 차감돼요. AI 건강이를 만들고 있어요.");
    try {
      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: sourceImage }),
      });
      const result = (await response.json()) as { imageData?: string; error?: string };
      if (!response.ok || !result.imageData) throw new Error(result.error || "AI 아바타를 생성하지 못했습니다.");
      const generatedImage = await compressGeneratedAvatar(result.imageData);
      let nextBalance = pointBalance;

      if (generationCost > 0) {
        const transactions = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
        const spendTransaction = createSpendTransaction(profile.id, generationCost, "AI 건강이 재생성");
        const updatedTransactions = [...transactions, spendTransaction];
        saveToStorage(STORAGE_KEYS.POINT_TRANSACTIONS, updatedTransactions);
        nextBalance = calculatePointBalance(updatedTransactions);
        setPointBalance(nextBalance);
        window.dispatchEvent(new Event("pointsUpdated"));
      }

      const nextProfile: UserProfile = {
        ...profile,
        avatarStyle: "3d",
        avatarImage: generatedImage,
        avatarEffect: "illustrated",
        defaultAvatarId: undefined,
        defaultAvatarGender: undefined,
        avatarGenerationCount: generationCount + 1,
        lastAvatarGeneratedAt: new Date().toISOString(),
        avatarRegenerationMonth: isFirstGeneration ? profile.avatarRegenerationMonth : currentMonth,
        avatarRegenerationCount: isFirstGeneration ? profile.avatarRegenerationCount || 0 : monthlyRegenerationCount + 1,
      };
      saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
      setProfile(nextProfile);
      setAvatarImage(generatedImage);
      setMessage(generationCost > 0 ? `AI 건강이가 완성됐어요. ${generationCost.toLocaleString()}P가 차감되어 ${nextBalance.toLocaleString()}P가 남았어요.` : "첫 AI 건강이가 무료로 완성됐어요. 마음에 들면 저장해주세요.");
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

  const selectDefaultAvatar = (avatar: DefaultAvatar) => {
    setAvatarGender(avatar.gender);
    setSelected(avatar.style);
    setSelectedDefaultId(avatar.id);
    setAvatarImage(avatar.imageUrl);
    setSourceImage(undefined);
    setConsent(false);
    setMessage(`${avatar.name} 기본 건강이를 선택했어요. 아래 저장 버튼을 눌러주세요.`);
  };

  const handleStart = () => {
    const nextProfile: UserProfile = {
      ...profile,
      avatarStyle: selected,
      avatarImage,
      avatarEffect: selectedDefaultId ? undefined : selected === "3d" && avatarImage ? "illustrated" : undefined,
      defaultAvatarId: selectedDefaultId,
      defaultAvatarGender: selectedDefaultId ? avatarGender : undefined,
    };
    saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
    saveToStorage(STORAGE_KEYS.AVATAR_STYLE, selected);
    saveToStorage(STORAGE_KEYS.AVATAR_GENDER, avatarGender);
    router.push("/trainer");
  };

  const displayImage = avatarImage || sourceImage;
  const saveDisabled = processing || generating || !avatarImage || (selected === "3d" && Boolean(sourceImage) && !avatarImage);
  const generationCount = profile.avatarGenerationCount || 0;
  const isFirstGeneration = generationCount === 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRegenerationCount = profile.avatarRegenerationMonth === currentMonth ? profile.avatarRegenerationCount || 0 : 0;
  const monthlyLimitReached = !isFirstGeneration && monthlyRegenerationCount >= MONTHLY_REGENERATION_LIMIT;
  const generationCost = isFirstGeneration || profile.isPremium ? 0 : AVATAR_REGENERATION_COST;
  const insufficientPoints = generationCost > pointBalance;

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-[radial-gradient(circle_at_50%_12%,#BFF7C8_0%,#62D982_42%,#28AD61_100%)] px-6 pb-5 pt-8 text-center text-white">
          <h1 className="mb-0.5 text-2xl font-extrabold">나만의 건강이 선택</h1>
          <p className="text-sm text-green-100">{displayName}님을 닮은 입체적인 건강이를 만들어보세요</p>
        </header>

        <main className="flex-1 space-y-4 px-4 py-6">
          <section className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-3 text-center text-xs font-bold">
              <span className="text-[#1F5A3A]">① 아바타 선택</span>
              <span className="text-gray-400">② 코치 선택</span>
              <span className="text-gray-400">③ 시작</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EAF7EF]">
              <div className="h-full w-1/3 rounded-full bg-[#4CAF6A]" />
            </div>
          </section>

          <section className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-[#1F2937]">사진 없이 기본 건강이 선택</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">AI 비용 없이 바로 사용할 수 있어요. 성별과 스타일을 골라주세요.</p>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-[#F1F7F3] p-1">
              {(["female", "male"] as const).map((gender) => (
                <button key={gender} onClick={() => setAvatarGender(gender)} className={`min-h-11 rounded-xl text-sm font-bold transition ${avatarGender === gender ? "bg-white text-[#1F5A3A] shadow-sm" : "text-gray-500"}`}>
                  {gender === "female" ? "여성 건강이" : "남성 건강이"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getDefaultAvatars(avatarGender).map((avatar) => {
                const isSelected = selectedDefaultId === avatar.id;
                return (
                  <button key={avatar.id} onClick={() => selectDefaultAvatar(avatar)} className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition-all ${isSelected ? "border-[#4CAF6A] shadow-[0_10px_25px_rgba(76,175,106,0.24)]" : "border-gray-100"}`}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#EAF7EF]">
                      <AnimatedAvatar style={avatar.style} gender={avatar.gender} viewMode="portrait" mood={isSelected ? "happy" : "idle"} fill glow={isSelected} alt={`${avatar.name} ${avatarGender === "female" ? "여성" : "남성"} 기본 아바타`} />
                      {isSelected && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={16} className="text-white" /></span>}
                    </div>
                    <div className="p-3"><p className="font-extrabold text-[#1F2937]">{avatar.name}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">{avatar.description}</p></div>
                  </button>
                );
              })}
            </div>
          </section>

          {selected === "3d" && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2"><Sparkles size={20} className="text-[#4CAF6A]" /><h2 className="text-lg font-extrabold text-[#1F2937]">내 사진으로 AI 건강이 생성</h2></div>
              <p className="mb-4 text-sm text-gray-500">직접 촬영하거나 사진을 올리고 싶은 경우에만 이용하세요.</p>
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
                  <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-[#1F2937]">{isFirstGeneration ? "첫 AI 건강이" : "AI 건강이 재생성"}</span><span className={`rounded-full px-3 py-1 text-sm font-extrabold ${isFirstGeneration ? "bg-[#EAF7EF] text-[#1F5A3A]" : "bg-amber-50 text-amber-700"}`}>{isFirstGeneration ? "최초 1회 무료" : `${AVATAR_REGENERATION_COST.toLocaleString()}P`}</span></div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{isFirstGeneration ? "회원당 첫 생성은 무료로 제공됩니다." : `재생성은 월 ${MONTHLY_REGENERATION_LIMIT}회 가능하며, 생성 성공 후에만 포인트가 차감됩니다.`}</p>
                    <p className="mt-1 text-xs font-semibold text-[#4CAF6A]">현재 보유: {pointBalance.toLocaleString()}P</p>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-[#4CAF6A]" />
                    <span>본인 사진이 AI 아바타 생성을 위해 OpenAI 이미지 API로 전송되는 것에 동의합니다. 내일의건강 앱 서버에는 별도 저장하지 않습니다.</span>
                  </label>
                  <button onClick={handleGenerateAvatar} disabled={!consent || generating || monthlyLimitReached || insufficientPoints} className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] text-lg font-extrabold text-white shadow-lg disabled:opacity-45"><Sparkles size={21} />{generating ? "AI 건강이 생성 중..." : monthlyLimitReached ? "이번 달 재생성 완료" : insufficientPoints ? `${AVATAR_REGENERATION_COST.toLocaleString()}P 필요` : isFirstGeneration ? "첫 AI 건강이 무료 생성" : `${AVATAR_REGENERATION_COST.toLocaleString()}P로 재생성`}</button>
                </div>
              )}

              {(avatarImage || sourceImage) && <button onClick={clearImages} disabled={generating} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 font-bold text-gray-600 disabled:opacity-50"><Trash2 size={17} />사진과 결과 지우기</button>}
              {message && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm leading-relaxed text-[#1F5A3A]">{message}</p>}
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-400"><Camera size={15} className="mt-0.5 shrink-0" />기존 필터형 이미지는 사진을 다시 선택하고 AI 생성해야 새 아바타로 교체됩니다.</p>
            </section>
          )}
        </main>

        <div className="px-4 pb-8"><button onClick={handleStart} disabled={saveDisabled} className="w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg active:scale-95 disabled:opacity-45">다음</button></div>
        {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      </div>
    </MobileShell>
  );
}
