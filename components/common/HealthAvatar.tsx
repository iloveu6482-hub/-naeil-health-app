"use client";

import Image from "next/image";
import type { AvatarStyle } from "@/types/user";

interface HealthAvatarProps {
  style: AvatarStyle;
  size?: "xs" | "sm" | "md" | "lg";
  equippedItems?: string[];
  imageUrl?: string;
}

const avatarImages: Record<AvatarStyle, string> = {
  "3d": "/avatars/default-female-3d.png",
  emotional: "/avatars/default-female-emotional.png",
  webtoon: "/avatars/default-female-webtoon.png",
  senior: "/avatars/default-female-senior.png",
};

const avatarColors: Record<AvatarStyle, string> = {
  "3d": "from-[#4CAF6A] to-[#1F5A3A]",
  emotional: "from-[#F7C948] to-[#F59E0B]",
  webtoon: "from-[#34D399] to-[#047857]",
  senior: "from-[#60A5FA] to-[#3B82F6]",
};

const sizeMap = {
  xs: { wrapper: "w-8 h-8", text: "text-sm" },
  sm: { wrapper: "w-16 h-16", text: "text-xl" },
  md: { wrapper: "w-24 h-24", text: "text-3xl" },
  lg: { wrapper: "w-32 h-32", text: "text-5xl" },
};

export default function HealthAvatar({
  style,
  size = "md",
  equippedItems = [],
  imageUrl,
}: HealthAvatarProps) {
  const { wrapper, text } = sizeMap[size];

  return (
    <div className={`relative ${wrapper}`}>
      <div
        className={`${wrapper} rounded-full bg-gradient-to-br ${avatarColors[style]} flex items-center justify-center shadow-lg overflow-hidden`}
      >
        <Image
          src={imageUrl || avatarImages[style]}
          alt="건강이 아바타"
          fill
          unoptimized={Boolean(imageUrl)}
          className={`object-cover ${imageUrl ? "scale-[1.03] contrast-[1.04] saturate-[1.08]" : ""}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className={`${text} select-none`}>🌱</span>
      </div>
      {equippedItems.length > 0 && (
        <div className="absolute -bottom-1 -right-1 bg-[#F7C948] rounded-full w-5 h-5 flex items-center justify-center text-xs">
          ✨
        </div>
      )}
    </div>
  );
}
