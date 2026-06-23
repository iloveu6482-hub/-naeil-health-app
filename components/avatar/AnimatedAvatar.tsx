"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { AvatarStyle } from "@/types/user";

export type AvatarMood = "idle" | "happy" | "cheer" | "reward";

type Props = {
  style: AvatarStyle;
  mood?: AvatarMood;
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
  fill?: boolean;
  glow?: boolean;
  priority?: boolean;
  alt?: string;
};

const sizes = { sm: "h-16 w-16", md: "h-28 w-28", lg: "h-44 w-44" };
const fallback: Record<AvatarStyle, string> = { "3d": "/avatars/default-female-3d.png", emotional: "/avatars/default-female-emotional.png", webtoon: "/avatars/default-female-webtoon.png", senior: "/avatars/default-female-senior.png" };

export default function AnimatedAvatar({ style, mood = "idle", size = "md", imageUrl, fill = false, glow = true, priority = false, alt = "건강이 아바타" }: Props) {
  const fallbackSource = imageUrl || fallback[style];
  const [source, setSource] = useState(imageUrl || `/avatars/avatar-${style}-${mood}.png`);
  useEffect(() => setSource(imageUrl || `/avatars/avatar-${style}-${mood}.png`), [imageUrl, mood, style]);
  return <div data-avatar-mood={mood} className={`group ${fill ? "absolute inset-0" : `relative ${sizes[size]}`}`}>
    {glow && <span aria-hidden className="avatar-glow absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/35 blur-2xl" />}
    <div className="avatar-float absolute inset-0 transition-transform duration-500 group-hover:scale-[1.015] group-active:scale-[0.99]"><div className="avatar-breathe relative h-full w-full"><Image src={source} alt={alt} fill priority={priority} unoptimized={source.startsWith("data:")} className="object-cover object-top" onError={() => { if (source !== fallbackSource) setSource(fallbackSource); }} /></div></div>
  </div>;
}
