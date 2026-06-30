"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import CameraCapture from "@/components/avatar/CameraCapture";
import { compressGeneratedAvatar, prepareAvatarSource, prepareDirectAvatarMedia } from "@/lib/avatarImage";
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
const AVATAR_GENERATION_TOTAL_LIMIT = 3;
const likenessOptions = [
  { value: "soft", label: "은은하게", desc: "건강이 스타일을 더 살려요" },
  { value: "balanced", label: "중간", desc: "나와 건강이의 균형" },
  { value: "strong", label: "많이", desc: "내 얼굴 특징을 더 반영해요" },
] as const;

type LikenessLevel = (typeof likenessOptions)[number]["value"];

export default function AvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directPortraitInputRef = useRef<HTMLInputElement>(null);
  const directFullbodyInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(sampleUser);
  const [selected, setSelected] = useState<AvatarStyle>("emotional");
  const [aiAvatarSelected, setAiAvatarSelected] = useState(false);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [selectedDefaultId, setSelectedDefaultId] = useState<string>();
  const [avatarImage, setAvatarImage] = useState<string>();
  const [avatarPortraitImage, setAvatarPortraitImage] = useState<string>();
  const [avatarFullbodyImage, setAvatarFullbodyImage] = useState<string>();
  const [sourceImage, setSourceImage] = useState<string>();
  const [likenessLevel, setLikenessLevel] = useState<LikenessLevel>("balanced");
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const displayName = profile.name?.trim() || "사용자";

  useEffect(() => {
    const saved = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const initialStyle = saved.avatarStyle === "3d" ? "emotional" : saved.avatarStyle || "emotional";
    setProfile(saved);
    setSelected(initialStyle);
    setAiAvatarSelected(saved.avatarEffect === "illustrated");
    setAvatarGender(saved.defaultAvatarGender || (saved.gender === "male" ? "male" : "female"));
    setSelectedDefaultId(saved.defaultAvatarId);
    setAvatarImage(saved.avatarImage);
    setAvatarPortraitImage(saved.avatarPortraitImage);
    setAvatarFullbodyImage(saved.avatarFullbodyImage);
    const transactions = getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, samplePointTransactions);
    setPointBalance(calculatePointBalance(transactions));
  }, []);

  const processImage = async (file: File) => {
    setProcessing(true);
    setMessage("");
    try {
      setSourceImage(await prepareAvatarSource(file));
      setAvatarImage(undefined);
      setSelected("emotional");
      setAiAvatarSelected(true);
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

  const readTemplateImageData = async (templateUrl: string) => {
    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error("선택한 건강이 템플릿을 불러오지 못했습니다.");
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("건강이 템플릿을 준비하지 못했습니다."));
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateAvatar = async () => {
    if (!sourceImage || !consent) return;
    const generationCount = profile.avatarGenerationCount || 0;
    const isFirstGeneration = generationCount === 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRegenerationCount = profile.avatarRegenerationMonth === currentMonth ? profile.avatarRegenerationCount || 0 : 0;
    const generationCost = isFirstGeneration || profile.isPremium ? 0 : AVATAR_REGENERATION_COST;

    if (generationCount >= AVATAR_GENERATION_TOTAL_LIMIT) {
      setMessage(`AI 건강이 생성은 최대 ${AVATAR_GENERATION_TOTAL_LIMIT}회까지 가능해요. 직접 만든 상반신/전신 파일은 계속 넣을 수 있어요.`);
      return;
    }
    if (!isFirstGeneration && monthlyRegenerationCount >= MONTHLY_REGENERATION_LIMIT) {
      setMessage("이번 달 AI 건강이 재생성 기회를 이미 사용했어요. 다음 달에 다시 이용해주세요.");
      return;
    }
    if (generationCost > pointBalance) {
      setMessage(`AI 건강이 재생성에는 ${AVATAR_REGENERATION_COST.toLocaleString()}P가 필요해요. 현재 ${pointBalance.toLocaleString()}P를 보유하고 있어요.`);
      return;
    }

    setGenerating(true);
    setMessage(isFirstGeneration ? "선택한 건강이 템플릿에 내 얼굴 느낌을 반영하고 있어요. 약 20~60초 정도 걸릴 수 있어요." : "헬스포인트는 생성 성공 후에만 차감돼요. 건강이 템플릿에 내 얼굴 느낌을 반영하고 있어요.");
    try {
      const selectedTemplate = getDefaultAvatars(avatarGender).find((avatar) => avatar.style === selected);
      const templateImageData = selectedTemplate ? await readTemplateImageData(selectedTemplate.previewImageUrl) : undefined;
      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: sourceImage,
          templateImageData,
          likenessLevel,
          templateStyle: selected,
          templateGender: avatarGender,
          generationCount,
        }),
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
        avatarStyle: selected,
        avatarImage: generatedImage,
        avatarPortraitImage: generatedImage,
        avatarFullbodyImage,
        avatarEffect: "illustrated",
        defaultAvatarId: undefined,
        defaultAvatarGender: avatarGender,
        avatarGenerationCount: generationCount + 1,
        lastAvatarGeneratedAt: new Date().toISOString(),
        avatarRegenerationMonth: isFirstGeneration ? profile.avatarRegenerationMonth : currentMonth,
        avatarRegenerationCount: isFirstGeneration ? profile.avatarRegenerationCount || 0 : monthlyRegenerationCount + 1,
      };
      saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
      setProfile(nextProfile);
      setAvatarImage(generatedImage);
      setAvatarPortraitImage(generatedImage);
      setMessage(generationCost > 0 ? `AI 건강이가 완성됐어요. ${generationCost.toLocaleString()}P가 차감되어 ${nextBalance.toLocaleString()}P가 남았어요.` : "첫 AI 건강이가 무료로 완성됐어요. 마음에 들면 저장해주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 아바타를 생성하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const clearImages = () => {
    setAvatarImage(undefined);
    setAvatarPortraitImage(undefined);
    setAvatarFullbodyImage(undefined);
    setSourceImage(undefined);
    setConsent(false);
    setMessage("");
  };

  const handleDirectMedia = async (event: ChangeEvent<HTMLInputElement>, viewMode: "portrait" | "fullbody") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setMessage("");
    try {
      const mediaData = await prepareDirectAvatarMedia(file, viewMode);
      setAiAvatarSelected(true);
      setSelectedDefaultId(undefined);
      setAvatarImage(viewMode === "portrait" ? mediaData : avatarImage);
      if (viewMode === "portrait") setAvatarPortraitImage(mediaData);
      if (viewMode === "fullbody") setAvatarFullbodyImage(mediaData);
      setSourceImage(undefined);
      setConsent(false);
      setMessage(viewMode === "portrait" ? "상반신 건강이를 직접 넣었어요. 전신도 따로 넣을 수 있어요." : "전신 건강이를 직접 넣었어요. 상반신도 따로 넣을 수 있어요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "파일을 준비하지 못했습니다.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  const selectDefaultAvatar = (avatar: DefaultAvatar) => {
    setAvatarGender(avatar.gender);
    setSelected(avatar.style);
    setAiAvatarSelected(false);
    setSelectedDefaultId(avatar.id);
    setAvatarImage(avatar.imageUrl);
    setAvatarPortraitImage(undefined);
    setAvatarFullbodyImage(undefined);
    setSourceImage(undefined);
    setConsent(false);
    setMessage(`${avatar.name} 기본 건강이를 선택했어요. 아래 저장 버튼을 눌러주세요.`);
  };

  const handleStart = () => {
    const nextProfile: UserProfile = {
      ...profile,
      avatarStyle: selected,
      avatarImage: avatarPortraitImage || avatarImage,
      avatarPortraitImage,
      avatarFullbodyImage,
      avatarEffect: aiAvatarSelected && (avatarPortraitImage || avatarFullbodyImage || avatarImage) ? "illustrated" : undefined,
      defaultAvatarId: selectedDefaultId,
      defaultAvatarGender: selectedDefaultId ? avatarGender : undefined,
    };
    saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
    saveToStorage(STORAGE_KEYS.AVATAR_STYLE, selected);
    saveToStorage(STORAGE_KEYS.AVATAR_GENDER, avatarGender);
    router.push("/trainer");
  };

  const selectedTemplate = getDefaultAvatars(avatarGender).find((avatar) => avatar.style === selected);
  const displayImage = avatarPortraitImage || avatarImage || (aiAvatarSelected ? selectedTemplate?.previewImageUrl : undefined) || sourceImage;
  const displayCardName = avatarImage
    ? `${profile.name}님의 AI 건강이`
    : aiAvatarSelected && selectedTemplate
      ? `${selectedTemplate.name} 기반 건강이`
      : sourceImage
        ? "AI 생성용 원본 사진"
        : `${profile.name}님의 건강이`;
  const saveDisabled = processing || generating || !(avatarPortraitImage || avatarFullbodyImage || avatarImage) || (aiAvatarSelected && Boolean(sourceImage) && !avatarImage);
  const generationCount = profile.avatarGenerationCount || 0;
  const isFirstGeneration = generationCount === 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRegenerationCount = profile.avatarRegenerationMonth === currentMonth ? profile.avatarRegenerationCount || 0 : 0;
  const monthlyLimitReached = !isFirstGeneration && monthlyRegenerationCount >= MONTHLY_REGENERATION_LIMIT;
  const generationCost = isFirstGeneration || profile.isPremium ? 0 : AVATAR_REGENERATION_COST;
  const insufficientPoints = generationCost > pointBalance;
  const generationLimitReached = generationCount >= AVATAR_GENERATION_TOTAL_LIMIT;
  const aiTemplateAvatars = getDefaultAvatars(avatarGender);

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-[radial-gradient(circle_at_50%_12%,#BFF7C8_0%,#62D982_42%,#28AD61_100%)] px-5 pb-3 pt-5 text-center text-white">
          <h1 className="mb-0.5 text-xl font-extrabold">나만의 건강이 선택</h1>
          <p className="text-xs text-green-100">{displayName}님에게 맞는 건강이를 만들어보세요</p>
        </header>

        <main className="flex-1 space-y-3 px-3 py-3">
          <section className="rounded-xl border border-green-100 bg-white p-2.5 shadow-sm">
            <div className="grid grid-cols-3 text-center text-[11px] font-bold">
              <span className="text-[#1F5A3A]">① 아바타 선택</span>
              <span className="text-gray-400">② 코치 선택</span>
              <span className="text-gray-400">③ 시작</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF7EF]">
              <div className="h-full w-1/3 rounded-full bg-[#4CAF6A]" />
            </div>
          </section>

          <section className="rounded-xl border border-green-100 bg-white p-2.5 shadow-sm">
            <div className="mb-3">
              <h2 className="text-base font-extrabold text-[#1F2937]">사진 없이 기본 건강이 선택</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">AI 비용 없이 바로 사용할 수 있어요. 성별과 스타일을 골라주세요.</p>
            </div>

            <div className="mb-3 grid grid-cols-2 rounded-2xl bg-[#F1F7F3] p-1">
              {(["female", "male"] as const).map((gender) => (
                <button key={gender} onClick={() => setAvatarGender(gender)} className={`min-h-9 rounded-lg text-sm font-bold transition ${avatarGender === gender ? "bg-white text-[#1F5A3A] shadow-sm" : "text-gray-500"}`}>
                  {gender === "female" ? "여성 건강이" : "남성 건강이"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getDefaultAvatars(avatarGender).map((avatar) => {
                const isSelected = !aiAvatarSelected && selectedDefaultId === avatar.id;
                return (
                  <button key={avatar.id} onClick={() => selectDefaultAvatar(avatar)} className={`overflow-hidden rounded-xl border-2 bg-white text-left transition-all ${isSelected ? "border-[#4CAF6A] shadow-[0_10px_25px_rgba(76,175,106,0.24)]" : "border-gray-100"}`}>
                    <div className="relative aspect-square overflow-hidden bg-[#EAF7EF]">
                      <Image src={avatar.previewImageUrl} alt={`${avatar.name} ${avatarGender === "female" ? "여성" : "남성"} 기본 아바타`} fill sizes="(max-width: 430px) 48vw, 190px" className="object-cover" />
                      {isSelected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={14} className="text-white" /></span>}
                    </div>
                    <div className="p-2"><p className="text-sm font-extrabold text-[#1F2937]">{avatar.name}</p><p className="mt-0.5 truncate text-[11px] leading-relaxed text-gray-500">{avatar.description}</p></div>
                  </button>
                );
              })}
              <button onClick={() => { setAiAvatarSelected(true); setSelectedDefaultId(undefined); setAvatarImage(avatarPortraitImage); setSourceImage(undefined); setMessage("사진을 올리거나 직접 만든 이미지/영상을 넣어 나만의 건강이를 만들 수 있어요."); }} className={`overflow-hidden rounded-xl border-2 bg-white text-left transition-all ${aiAvatarSelected ? "border-[#4CAF6A] shadow-[0_10px_25px_rgba(76,175,106,0.24)]" : "border-gray-100"}`}>
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#EAF7EF] to-[#D9F6E2]">
                  <Image src="/avatars/selection/avatar-ai-custom.png" alt="나만의 AI 건강이 선택 이미지" fill sizes="(max-width: 430px) 48vw, 190px" className="object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold text-[#1F5A3A] shadow-sm">AI 생성</span>
                  {aiAvatarSelected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={14} className="text-white" /></span>}
                </div>
                <div className="p-2"><p className="text-sm font-extrabold text-[#1F2937]">나만의 AI 건강이</p><p className="mt-0.5 truncate text-[11px] leading-relaxed text-gray-500">내 사진으로 만드는 맞춤 건강이</p></div>
              </button>
            </div>
          </section>

          {aiAvatarSelected && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2"><Sparkles size={20} className="text-[#4CAF6A]" /><h2 className="text-base font-extrabold text-[#1F2937]">나만의 건강이 만들기</h2></div>
              <p className="mb-3 text-sm text-gray-500">사진으로 AI 합성을 하거나, 직접 만든 이미지·짧은 영상을 상반신/전신으로 넣을 수 있어요.</p>
              <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-[#EAF7EF] to-white p-4">
                <div className="mb-4 w-full">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-extrabold text-[#1F2937]">누구를 기반으로 만들까요?</p>
                      <p className="mt-0.5 text-xs text-gray-500">사진 업로드 전에 합성할 기본 건강이를 골라주세요.</p>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-2 rounded-2xl bg-white/70 p-1">
                    {(["female", "male"] as const).map((gender) => (
                      <button key={gender} onClick={() => setAvatarGender(gender)} className={`min-h-9 rounded-xl text-sm font-bold transition ${avatarGender === gender ? "bg-white text-[#1F5A3A] shadow-sm" : "text-gray-500"}`}>
                        {gender === "female" ? "여성" : "남성"}
                      </button>
                    ))}
                  </div>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {aiTemplateAvatars.map((avatar) => {
                      const isTemplateSelected = selected === avatar.style;
                      return (
                        <button key={avatar.id} onClick={() => { setSelected(avatar.style); setSelectedDefaultId(undefined); setAvatarImage(undefined); setAvatarPortraitImage(undefined); setConsent(false); }} className={`w-[82px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white text-left transition ${isTemplateSelected ? "border-[#4CAF6A] shadow-[0_8px_18px_rgba(76,175,106,0.22)]" : "border-white/70"}`}>
                          <div className="relative h-[68px] overflow-hidden bg-[#EAF7EF]">
                            <Image src={avatar.previewImageUrl} alt={`${avatar.name} 기반 건강이`} fill sizes="82px" className="object-cover object-top" />
                            {isTemplateSelected && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={12} className="text-white" /></span>}
                          </div>
                          <p className="truncate px-1.5 py-1.5 text-center text-[11px] font-extrabold text-[#1F2937]">{avatar.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full max-w-[230px] overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="relative h-[180px] bg-[#EAF7EF]">
                    {displayImage && <Image src={displayImage} alt={displayCardName} fill sizes="230px" className="object-contain object-center p-1" />}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[#1F5A3A] shadow-sm">{displayCardName}</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-gray-600">AI 생성은 선택한 건강이 템플릿의 구도와 배경을 유지하고 얼굴 느낌만 반영합니다.</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImage} />
              <input ref={directPortraitInputRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden" onChange={(event) => handleDirectMedia(event, "portrait")} />
              <input ref={directFullbodyInputRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden" onChange={(event) => handleDirectMedia(event, "fullbody")} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={processing || generating} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#4CAF6A] px-3 font-bold text-white disabled:opacity-60">{sourceImage ? <RefreshCw size={18} /> : <ImagePlus size={18} />}{processing ? "준비 중..." : "사진 업로드"}</button>
                <button onClick={() => setShowCamera(true)} disabled={processing || generating} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5A3A] px-3 font-bold text-white disabled:opacity-60"><Camera size={18} />바로 촬영</button>
              </div>
              <div className="mt-3 rounded-2xl border border-green-100 bg-[#F7FBF8] p-3">
                <p className="text-sm font-extrabold text-[#1F2937]">내가 만든 파일 직접 넣기</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">상반신과 전신을 따로 넣을 수 있어요. 영상은 3MB 이하 mp4/webm만 권장합니다.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => directPortraitInputRef.current?.click()} disabled={processing || generating} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-60 ${avatarPortraitImage ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]" : "border-gray-200 bg-white text-gray-600"}`}><Upload size={17} />상반신 넣기</button>
                  <button onClick={() => directFullbodyInputRef.current?.click()} disabled={processing || generating} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-60 ${avatarFullbodyImage ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]" : "border-gray-200 bg-white text-gray-600"}`}><Upload size={17} />전신 넣기</button>
                </div>
              </div>

              {sourceImage && (
                <div className="mt-4 rounded-2xl border border-green-100 bg-[#F7FBF8] p-4">
                  <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#EAF7EF]">
                        <Image src={sourceImage} alt="AI 합성용으로 업로드한 원본 사진" fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#1F2937]">업로드한 원본 사진</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">이 얼굴 느낌을 아래 닮은 정도에 맞춰 선택한 기본 건강이에 반영해요.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-extrabold text-[#1F2937]">닮은 정도 선택</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {likenessOptions.map((option) => (
                        <button key={option.value} onClick={() => setLikenessLevel(option.value)} className={`rounded-xl border px-2 py-2 text-center transition ${likenessLevel === option.value ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]" : "border-gray-100 bg-white text-gray-500"}`}>
                          <p className="text-xs font-extrabold">{option.label}</p>
                          <p className="mt-1 text-[10px] leading-snug">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-[#1F2937]">{isFirstGeneration ? "첫 AI 건강이" : "AI 건강이 재생성"}</span><span className={`rounded-full px-3 py-1 text-sm font-extrabold ${isFirstGeneration ? "bg-[#EAF7EF] text-[#1F5A3A]" : "bg-amber-50 text-amber-700"}`}>{generationLimitReached ? "생성 제한 완료" : isFirstGeneration ? "최초 1회 무료" : `${AVATAR_REGENERATION_COST.toLocaleString()}P`}</span></div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{generationLimitReached ? `AI 생성은 최대 ${AVATAR_GENERATION_TOTAL_LIMIT}회까지 가능해요. 직접 만든 파일은 계속 넣을 수 있습니다.` : isFirstGeneration ? `회원당 첫 생성은 무료로 제공됩니다. 전체 생성 가능 횟수는 ${AVATAR_GENERATION_TOTAL_LIMIT}회입니다.` : `재생성은 월 ${MONTHLY_REGENERATION_LIMIT}회, 전체 최대 ${AVATAR_GENERATION_TOTAL_LIMIT}회까지 가능하며 생성 성공 후에만 포인트가 차감됩니다.`}</p>
                    <p className="mt-1 text-xs font-semibold text-[#4CAF6A]">AI 생성 사용: {Math.min(generationCount, AVATAR_GENERATION_TOTAL_LIMIT)} / {AVATAR_GENERATION_TOTAL_LIMIT}회</p>
                    <p className="mt-1 text-xs font-semibold text-[#4CAF6A]">현재 보유: {pointBalance.toLocaleString()}P</p>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-[#4CAF6A]" />
                    <span>본인 사진이 AI 아바타 생성을 위해 OpenAI 이미지 API로 전송되는 것에 동의합니다. 내일의건강 앱 서버에는 별도 저장하지 않습니다.</span>
                  </label>
                  <button onClick={handleGenerateAvatar} disabled={!consent || generating || generationLimitReached || monthlyLimitReached || insufficientPoints} className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F5A3A] to-[#4CAF6A] text-lg font-extrabold text-white shadow-lg disabled:opacity-45"><Sparkles size={21} />{generating ? "AI 건강이 생성 중..." : generationLimitReached ? "AI 생성 3회 완료" : monthlyLimitReached ? "이번 달 재생성 완료" : insufficientPoints ? `${AVATAR_REGENERATION_COST.toLocaleString()}P 필요` : isFirstGeneration ? "첫 AI 건강이 무료 생성" : `${AVATAR_REGENERATION_COST.toLocaleString()}P로 재생성`}</button>
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
