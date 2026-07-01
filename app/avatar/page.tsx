"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Images, Sparkles, Shirt, Trash2, Upload, UserRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { prepareDirectAvatarMedia } from "@/lib/avatarImage";
import { getDefaultAvatars } from "@/lib/defaultAvatars";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { AvatarGender, AvatarStyle, UserProfile } from "@/types/user";

const SAVED_CUSTOM_AVATAR_LIMIT = 8;

type SavedCustomAvatar = {
  id: string;
  label: string;
  createdAt: string;
  portraitImage?: string;
  fullbodyImage?: string;
  style: AvatarStyle;
  gender: AvatarGender;
  origin: "ai" | "direct";
};

type MediaPreviewProps = {
  src?: string;
  alt: string;
  className?: string;
};

function MediaPreview({ src, alt, className = "object-cover object-top" }: MediaPreviewProps) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EAF7EF] text-[#4CAF6A]">
        <Images size={28} />
      </div>
    );
  }

  if (src.startsWith("data:video")) {
    return <video src={src} className={`h-full w-full ${className}`} muted playsInline />;
  }

  return <Image src={src} alt={alt} fill sizes="(max-width: 430px) 100vw, 430px" className={className} />;
}

export default function AvatarPage() {
  const router = useRouter();
  const directPortraitInputRef = useRef<HTMLInputElement>(null);
  const directFullbodyInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(sampleUser);
  const [selected, setSelected] = useState<AvatarStyle>("emotional");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [selectedDefaultId, setSelectedDefaultId] = useState<string>();
  const [customMode, setCustomMode] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string>();
  const [avatarPortraitImage, setAvatarPortraitImage] = useState<string>();
  const [avatarFullbodyImage, setAvatarFullbodyImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [savedCustomAvatars, setSavedCustomAvatars] = useState<SavedCustomAvatar[]>([]);

  const displayName = profile.name?.trim() || "사용자";
  const currentDefaultAvatars = useMemo(() => getDefaultAvatars(avatarGender), [avatarGender]);
  const selectedTemplate = currentDefaultAvatars.find((avatar) => avatar.style === selected);
  const customPreviewImage = avatarPortraitImage || avatarImage || selectedTemplate?.previewImageUrl;
  const saveDisabled = processing || (customMode ? !(avatarPortraitImage || avatarFullbodyImage || avatarImage) : !selectedDefaultId);

  useEffect(() => {
    const saved = getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser);
    const initialStyle = saved.avatarStyle === "3d" ? "emotional" : saved.avatarStyle || "emotional";
    const initialGender = saved.defaultAvatarGender || (saved.gender === "male" ? "male" : "female");
    const hasCustomAvatar = Boolean(saved.avatarPortraitImage || saved.avatarFullbodyImage || saved.avatarImage);

    setProfile(saved);
    setSelected(initialStyle);
    setAvatarGender(initialGender);
    setSelectedDefaultId(saved.defaultAvatarId);
    setCustomMode(saved.avatarEffect === "illustrated" || hasCustomAvatar);
    setAvatarImage(saved.avatarImage);
    setAvatarPortraitImage(saved.avatarPortraitImage);
    setAvatarFullbodyImage(saved.avatarFullbodyImage);

    const savedCustomList = getFromStorage<SavedCustomAvatar[]>(STORAGE_KEYS.SAVED_CUSTOM_AVATARS, []);
    const currentCustomImage = saved.avatarPortraitImage || saved.avatarImage;
    setSavedCustomAvatars(
      savedCustomList.length || !currentCustomImage
        ? savedCustomList
        : [
            {
              id: saved.lastAvatarGeneratedAt || `custom-${Date.now()}`,
              label: "현재 사용 중인 건강이",
              createdAt: saved.lastAvatarGeneratedAt || new Date().toISOString(),
              portraitImage: currentCustomImage,
              fullbodyImage: saved.avatarFullbodyImage,
              style: initialStyle,
              gender: initialGender,
              origin: "direct",
            },
          ],
    );
  }, []);

  const saveCustomList = (next: SavedCustomAvatar[]) => {
    const limited = next.slice(0, SAVED_CUSTOM_AVATAR_LIMIT);
    setSavedCustomAvatars(limited);
    saveToStorage(STORAGE_KEYS.SAVED_CUSTOM_AVATARS, limited);
  };

  const rememberCustomAvatar = (avatar: Omit<SavedCustomAvatar, "id" | "label" | "createdAt" | "style" | "gender" | "origin">) => {
    if (!avatar.portraitImage && !avatar.fullbodyImage) return;

    const now = new Date();
    const labelDate = now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
    const nextAvatar: SavedCustomAvatar = {
      id: `custom-${now.getTime()}`,
      label: `${displayName}님의 건강이 ${labelDate}`,
      createdAt: now.toISOString(),
      portraitImage: avatar.portraitImage,
      fullbodyImage: avatar.fullbodyImage,
      style: selected,
      gender: avatarGender,
      origin: "direct",
    };

    const withoutDuplicate = savedCustomAvatars.filter(
      (item) => item.portraitImage !== nextAvatar.portraitImage || item.fullbodyImage !== nextAvatar.fullbodyImage,
    );
    saveCustomList([nextAvatar, ...withoutDuplicate]);
  };

  const loadCustomAvatar = (avatar: SavedCustomAvatar) => {
    setCustomMode(true);
    setSelectedDefaultId(undefined);
    setSelected(avatar.style);
    setAvatarGender(avatar.gender);
    setAvatarImage(avatar.portraitImage);
    setAvatarPortraitImage(avatar.portraitImage);
    setAvatarFullbodyImage(avatar.fullbodyImage);
    setMessage(`${avatar.label}를 불러왔어요. 아래 다음 버튼을 누르면 적용됩니다.`);
  };

  const handleDirectMedia = async (event: ChangeEvent<HTMLInputElement>, viewMode: "portrait" | "fullbody") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setMessage("");
    try {
      const media = await prepareDirectAvatarMedia(file, viewMode);
      setCustomMode(true);
      setSelectedDefaultId(undefined);

      if (viewMode === "portrait") {
        setAvatarImage(media);
        setAvatarPortraitImage(media);
        rememberCustomAvatar({ portraitImage: media, fullbodyImage: avatarFullbodyImage });
        setMessage("상반신 건강이를 넣었어요. 전신도 따로 넣으면 보기 전환에 함께 적용됩니다.");
      } else {
        setAvatarFullbodyImage(media);
        rememberCustomAvatar({ portraitImage: avatarPortraitImage || avatarImage, fullbodyImage: media });
        setMessage("전신 건강이를 넣었어요. 상반신도 따로 넣으면 더 자연스럽게 사용할 수 있어요.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "파일을 준비하지 못했습니다.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  const selectDefaultAvatar = (avatar: (typeof currentDefaultAvatars)[number]) => {
    setCustomMode(false);
    setSelectedDefaultId(avatar.id);
    setSelected(avatar.style);
    setAvatarGender(avatar.gender);
    setAvatarImage(avatar.imageUrl);
    setAvatarPortraitImage(undefined);
    setAvatarFullbodyImage(undefined);
    setMessage(`${avatar.name} 기본 건강이를 선택했어요.`);
  };

  const clearCustomAvatar = () => {
    setAvatarImage(undefined);
    setAvatarPortraitImage(undefined);
    setAvatarFullbodyImage(undefined);
    setMessage("직접 넣은 파일을 지웠어요. 기준 이미지를 참고해 다시 넣어주세요.");
  };

  const handleStart = () => {
    const nextProfile: UserProfile = {
      ...profile,
      avatarStyle: selected,
      avatarEffect: customMode ? "illustrated" : undefined,
      avatarImage,
      avatarPortraitImage,
      avatarFullbodyImage,
      defaultAvatarId: customMode ? undefined : selectedDefaultId,
      defaultAvatarGender: avatarGender,
    };

    saveToStorage(STORAGE_KEYS.USER_PROFILE, nextProfile);
    saveToStorage(STORAGE_KEYS.AVATAR_STYLE, selected);
    saveToStorage(STORAGE_KEYS.AVATAR_GENDER, avatarGender);
    router.push("/trainer");
  };

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col bg-[#FAFCFA]">
        <header className="bg-[radial-gradient(circle_at_50%_12%,#BFF7C8_0%,#62D982_42%,#28AD61_100%)] px-5 pb-3 pt-5 text-center text-white">
          <h1 className="mb-0.5 text-xl font-extrabold">나만의 건강이 선택</h1>
          <p className="text-xs text-green-100">{displayName}님에게 맞는 건강이를 골라주세요</p>
        </header>

        <main className="flex-1 space-y-3 px-3 py-3">
          <section className="rounded-xl border border-green-100 bg-white p-2.5 shadow-sm">
            <div className="grid grid-cols-3 text-center text-[11px] font-bold">
              <span className="text-[#1F5A3A]">아바타 선택</span>
              <span className="text-gray-400">코치 선택</span>
              <span className="text-gray-400">시작</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF7EF]">
              <div className="h-full w-1/3 rounded-full bg-[#4CAF6A]" />
            </div>
          </section>

          <section className="rounded-xl border border-green-100 bg-white p-3 shadow-sm">
            <div className="mb-3">
              <h2 className="text-base font-extrabold text-[#1F2937]">기본 건강이 선택</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">사진 없이 바로 사용할 수 있는 기본 건강이를 골라주세요.</p>
            </div>

            <div className="mb-3 grid grid-cols-2 rounded-2xl bg-[#F1F7F3] p-1">
              {(["female", "male"] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setAvatarGender(gender)}
                  className={`min-h-9 rounded-lg text-sm font-bold transition ${avatarGender === gender ? "bg-white text-[#1F5A3A] shadow-sm" : "text-gray-500"}`}
                >
                  {gender === "female" ? "여성 건강이" : "남성 건강이"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentDefaultAvatars.map((avatar) => {
                const isSelected = !customMode && selectedDefaultId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => selectDefaultAvatar(avatar)}
                    className={`overflow-hidden rounded-xl border-2 bg-white text-left transition-all ${isSelected ? "border-[#4CAF6A] shadow-[0_10px_25px_rgba(76,175,106,0.24)]" : "border-gray-100"}`}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#EAF7EF]">
                      <Image src={avatar.previewImageUrl} alt={`${avatar.name} 기본 건강이`} fill sizes="(max-width: 430px) 48vw, 190px" className="object-cover" />
                      {isSelected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={14} className="text-white" /></span>}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-extrabold text-[#1F2937]">{avatar.name}</p>
                      <p className="mt-0.5 truncate text-[11px] leading-relaxed text-gray-500">{avatar.description}</p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setCustomMode(true);
                  setSelectedDefaultId(undefined);
                  setMessage("AI 합성은 제공하지 않아요. 아래 기준 이미지를 참고해 직접 만든 상반신/전신 파일을 넣어주세요.");
                }}
                className={`overflow-hidden rounded-xl border-2 bg-white text-left transition-all ${customMode ? "border-[#4CAF6A] shadow-[0_10px_25px_rgba(76,175,106,0.24)]" : "border-gray-100"}`}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#EAF7EF] to-[#D9F6E2]">
                  <Image src="/avatars/selection/avatar-ai-custom.png" alt="나만의 건강이 선택 이미지" fill sizes="(max-width: 430px) 48vw, 190px" className="object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold text-[#1F5A3A] shadow-sm">직접 넣기</span>
                  {customMode && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4CAF6A] shadow"><Check size={14} className="text-white" /></span>}
                </div>
                <div className="p-2">
                  <p className="text-sm font-extrabold text-[#1F2937]">나만의 건강이</p>
                  <p className="mt-0.5 truncate text-[11px] leading-relaxed text-gray-500">직접 만든 파일을 넣어요</p>
                </div>
              </button>
            </div>
          </section>

          {customMode && (
            <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles size={20} className="text-[#4CAF6A]" />
                <h2 className="text-base font-extrabold text-[#1F2937]">나만의 건강이 만들기</h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">
                앱 안에서 AI 합성은 하지 않아요. 아래 기준점처럼 배경, 아바타 위치, 여백을 맞춰 만든 파일을 상반신/전신으로 넣어주세요.
              </p>

              <div className="rounded-2xl bg-[#EAF7EF] p-3">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound size={17} className="text-[#4CAF6A]" />
                  <p className="text-sm font-extrabold text-[#1F2937]">제작 기준점</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative aspect-[3/4] bg-[#EAF7EF]">
                      <Image src="/avatars/guides/custom-portrait-reference.png" alt="상반신 기준 이미지" fill sizes="190px" className="object-cover object-top" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-extrabold text-[#1F2937]">상반신 기준</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">얼굴과 상체가 UI 중앙에 자연스럽게 보이도록 맞춰주세요.</p>
                    </div>
                  </article>
                  <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative aspect-[3/4] bg-[#EAF7EF]">
                      <Image src="/avatars/guides/custom-fullbody-reference.png" alt="전신 기준 이미지" fill sizes="190px" className="object-cover object-top" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-extrabold text-[#1F2937]">전신 기준</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">전신은 발끝까지 보이고 좌우 여백이 충분해야 해요.</p>
                    </div>
                  </article>
                </div>
                <ul className="mt-3 space-y-1 rounded-2xl bg-white/80 p-3 text-xs leading-relaxed text-gray-600">
                  <li>1. 초록 숲길 배경과 밝은 햇살 분위기를 유지하면 앱 화면과 잘 맞아요.</li>
                  <li>2. 상반신은 3:4 비율, 전신은 세로형 3:4 또는 9:16 비율을 권장해요.</li>
                  <li>3. 얼굴이 너무 크게 나오면 메인 UI와 겹칠 수 있어요.</li>
                </ul>
              </div>

              <input ref={directPortraitInputRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden" onChange={(event) => handleDirectMedia(event, "portrait")} />
              <input ref={directFullbodyInputRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden" onChange={(event) => handleDirectMedia(event, "fullbody")} />

              <div className="mt-4 rounded-2xl border border-green-100 bg-[#F7FBF8] p-3">
                <p className="text-sm font-extrabold text-[#1F2937]">내가 만든 파일 직접 넣기</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">상반신과 전신을 따로 넣을 수 있어요. 영상은 3MB 이하 mp4/webm만 권장합니다.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => directPortraitInputRef.current?.click()} disabled={processing} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-60 ${avatarPortraitImage ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]" : "border-gray-200 bg-white text-gray-600"}`}>
                    <Upload size={17} />상반신 넣기
                  </button>
                  <button onClick={() => directFullbodyInputRef.current?.click()} disabled={processing} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-60 ${avatarFullbodyImage ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]" : "border-gray-200 bg-white text-gray-600"}`}>
                    <Upload size={17} />전신 넣기
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <article className="rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EAF7EF]">
                    <MediaPreview src={avatarPortraitImage || avatarImage} alt="상반신 미리보기" />
                  </div>
                  <p className="mt-2 text-center text-xs font-extrabold text-[#1F2937]">상반신 미리보기</p>
                </article>
                <article className="rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EAF7EF]">
                    <MediaPreview src={avatarFullbodyImage} alt="전신 미리보기" />
                  </div>
                  <p className="mt-2 text-center text-xs font-extrabold text-[#1F2937]">전신 미리보기</p>
                </article>
              </div>

              <div className="mt-3 rounded-2xl border border-green-100 bg-[#F7FBF8] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Images size={17} className="text-[#4CAF6A]" />
                    <p className="text-sm font-extrabold text-[#1F2937]">나만의 건강이 불러오기</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#4CAF6A]">최근 {savedCustomAvatars.length}개</span>
                </div>
                {savedCustomAvatars.length ? (
                  <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                    {savedCustomAvatars.map((avatar) => (
                      <button key={avatar.id} onClick={() => loadCustomAvatar(avatar)} className="w-[92px] shrink-0 overflow-hidden rounded-2xl border border-white bg-white text-left shadow-sm transition active:scale-95">
                        <div className="relative h-[92px] bg-[#EAF7EF]">
                          <MediaPreview src={avatar.portraitImage || avatar.fullbodyImage} alt={`${avatar.label} 미리보기`} />
                        </div>
                        <div className="p-2">
                          <p className="truncate text-[11px] font-extrabold text-[#1F2937]">{avatar.label}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-gray-400">직접 등록</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-white p-3 text-xs leading-relaxed text-gray-500">
                    직접 넣은 건강이가 여기에 저장됩니다. 마음에 드는 결과를 언제든 다시 불러올 수 있어요.
                  </p>
                )}
              </div>

              {(avatarPortraitImage || avatarFullbodyImage || avatarImage) && (
                <button onClick={clearCustomAvatar} disabled={processing} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 font-bold text-gray-600 disabled:opacity-50">
                  <Trash2 size={17} />직접 넣은 파일 지우기
                </button>
              )}
              {message && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm leading-relaxed text-[#1F5A3A]">{message}</p>}
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-400">
                <Shirt size={15} className="mt-0.5 shrink-0" />
                AI 합성 대신 기준 이미지에 맞춘 직접 제작 파일을 사용하는 방식입니다.
              </p>
            </section>
          )}
        </main>

        <div className="px-4 pb-8">
          <button onClick={handleStart} disabled={saveDisabled} className="w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg active:scale-95 disabled:opacity-45">
            다음
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
