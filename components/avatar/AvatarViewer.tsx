"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import AvatarWindEffect from "@/components/avatar/AvatarWindEffect";
import { getAvatarImagePath, getAvatarRotationImagePath, getFallbackAvatarImagePath } from "@/lib/avatarAssets";
import { saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { AvatarGender, AvatarMood, AvatarRotationView, AvatarStyle, AvatarViewMode } from "@/types/avatar";

type AvatarViewerProps = {
  style: AvatarStyle;
  gender: AvatarGender;
  viewMode: AvatarViewMode;
  mood?: AvatarMood;
  rotationView?: AvatarRotationView;
  customImageUrl?: string;
  showControls?: boolean;
  showWindEffect?: boolean;
  showLeaves?: boolean;
  showLightTrails?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  fill?: boolean;
  cover?: boolean;
  priority?: boolean;
  className?: string;
  alt?: string;
  onViewModeChange?: (mode: AvatarViewMode) => void;
};

const sizeClasses = { sm: "h-16 w-16", md: "h-32 w-28", lg: "h-72 w-full", xl: "h-[430px] w-full" };

export default function AvatarViewer({ style, gender, viewMode, mood = "idle", rotationView, customImageUrl, showControls = false, showWindEffect = true, showLeaves = true, showLightTrails = true, size = "lg", fill = false, cover = false, priority = false, className = "", alt = "마이 아바타", onViewModeChange }: AvatarViewerProps) {
  const requested = customImageUrl || (rotationView ? getAvatarRotationImagePath({ style, gender, rotationView }) : getAvatarImagePath({ style, gender, viewMode, mood }));
  const fullbodyFallback = getAvatarImagePath({ style, gender, viewMode: "fullbody", mood });
  const portraitFallback = customImageUrl || getFallbackAvatarImagePath({ style, gender });
  const [source, setSource] = useState(requested);
  const [fallbackStep, setFallbackStep] = useState(0);
  useEffect(() => { setSource(requested); setFallbackStep(0); }, [requested]);
  const changeMode = (mode: AvatarViewMode) => { saveToStorage(STORAGE_KEYS.AVATAR_VIEW_MODE, mode); onViewModeChange?.(mode); };
  const handleError = () => {
    if (customImageUrl) return;
    if (fallbackStep === 0 && source !== fullbodyFallback) { setSource(fullbodyFallback); setFallbackStep(1); return; }
    if (source !== portraitFallback) { setSource(portraitFallback); setFallbackStep(2); }
  };
  const intensity = mood === "reward" ? "active" : mood === "cheer" || mood === "happy" ? "normal" : "soft";

  const isPortraitFallback = viewMode === "fullbody" && fallbackStep >= 2;
  const imageFitClass = cover
    ? "object-cover object-center"
    : viewMode === "portrait"
    ? "object-contain object-top"
    : "object-contain object-bottom";

  return <div data-avatar-mood={mood} data-avatar-view={viewMode} className={`${fill ? "absolute inset-0" : `relative ${sizeClasses[size]}`} ${className}`}>
    <div className="relative h-full w-full cursor-none overflow-hidden rounded-[inherit]">
      {showWindEffect && <AvatarWindEffect intensity={intensity} showLeaves={showLeaves} showLightTrails={showLightTrails} />}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Image src={source} alt={alt} fill priority={priority} unoptimized={source.startsWith("data:")} onError={handleError} className={imageFitClass} />
      </div>
      {isPortraitFallback && <div className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">전신 이미지 준비 중 · 상반신으로 표시</div>}
    </div>
    {showControls && <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 rounded-full border border-white/70 bg-white/85 p-1 shadow-md backdrop-blur"><button onClick={() => changeMode("portrait")} className={`rounded-full px-4 py-2 text-xs font-bold ${viewMode === "portrait" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>상반신 보기</button><button onClick={() => changeMode("fullbody")} className={`rounded-full px-4 py-2 text-xs font-bold ${viewMode === "fullbody" ? "bg-[#4CAF6A] text-white" : "text-gray-500"}`}>전신 보기</button></div>}
  </div>;
}
