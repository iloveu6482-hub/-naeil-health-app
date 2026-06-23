"use client";

import Image from "next/image";
import { Sparkles, Sprout } from "lucide-react";

interface AvatarPortraitCardProps {
  imageUrl?: string;
  name?: string;
  compact?: boolean;
}

export default function AvatarPortraitCard({ imageUrl, name = "나의 건강이", compact = false }: AvatarPortraitCardProps) {
  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-3xl border border-green-100 bg-gradient-to-b from-[#FFFDF4] via-[#EAF7EF] to-[#CDEBD8] shadow-lg ${compact ? "max-w-[230px]" : "max-w-[310px]"}`}>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-[#1F5A3A] shadow-sm backdrop-blur">
        <Sprout size={14} /> {name}
      </div>
      <div className="relative aspect-[3/4]">
        {imageUrl ? (
          <Image src={imageUrl} alt={`${name} 세로형 아바타`} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[#1F5A3A]">
            <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white/80 text-6xl shadow-md">🧑</div>
            <p className="text-lg font-extrabold">나만의 건강이를 만들어보세요</p>
            <p className="mt-2 text-sm text-gray-500">상반신 사진을 올리거나 바로 촬영할 수 있어요.</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#1F5A3A]/35 to-transparent" />
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#1F5A3A] shadow">
          <Sparkles size={14} /> 건강 행동과 함께 성장해요
        </div>
      </div>
    </div>
  );
}
