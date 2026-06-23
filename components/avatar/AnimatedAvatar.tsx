"use client";

import AvatarViewer from "@/components/avatar/AvatarViewer";
import type { AvatarGender, AvatarMood, AvatarStyle, AvatarViewMode } from "@/types/avatar";

type Props = {
  style: AvatarStyle;
  gender?: AvatarGender;
  mood?: AvatarMood;
  viewMode?: AvatarViewMode;
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
  fill?: boolean;
  glow?: boolean;
  priority?: boolean;
  alt?: string;
};

export type { AvatarMood } from "@/types/avatar";

export default function AnimatedAvatar({ style, gender = "female", mood = "idle", viewMode = "portrait", size = "md", imageUrl, fill = false, glow = true, priority = false, alt = "건강이 아바타" }: Props) {
  return <AvatarViewer style={style} gender={gender} viewMode={viewMode} mood={mood} customImageUrl={imageUrl} size={size} fill={fill} priority={priority} showWindEffect={glow} showLeaves={glow} showLightTrails={glow} alt={alt} />;
}
