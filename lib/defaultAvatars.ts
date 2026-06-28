import type { AvatarGender, AvatarStyle } from "@/types/user";
import { getFallbackAvatarImagePath } from "@/lib/avatarAssets";

export type DefaultAvatar = {
  id: string;
  gender: AvatarGender;
  style: AvatarStyle;
  name: string;
  description: string;
  imageUrl: string;
  previewImageUrl: string;
};

const styleDetails: Record<AvatarStyle, Pick<DefaultAvatar, "name" | "description">> = {
  "3d": {
    name: "나만의 AI 건강이",
    description: "내 사진으로 만드는 맞춤 건강이",
  },
  emotional: {
    name: "감성형",
    description: "부드럽고 따뜻한 애니메이션 스타일",
  },
  webtoon: {
    name: "웹툰형",
    description: "활동적이고 선명한 웹툰 히어로 스타일",
  },
  senior: {
    name: "시니어형",
    description: "편안하고 신뢰감 있는 시니어 친화 스타일",
  },
};

const makeAvatar = (gender: AvatarGender, style: AvatarStyle): DefaultAvatar => ({
  id: `${gender}-${style}`,
  gender,
  style,
  ...styleDetails[style],
  imageUrl: getFallbackAvatarImagePath({ style, gender }),
  previewImageUrl: `/avatars/selection/avatar-${style}-${gender}.jpg`,
});

export const defaultAvatars: DefaultAvatar[] = (["male", "female"] as const).flatMap((gender) =>
  (["emotional", "webtoon", "senior"] as const).map((style) => makeAvatar(gender, style)),
);

export function getDefaultAvatars(gender: AvatarGender) {
  return defaultAvatars.filter((avatar) => avatar.gender === gender);
}

export function getDefaultAvatar(id?: string) {
  return defaultAvatars.find((avatar) => avatar.id === id);
}

export function getDefaultAvatarImage(gender: AvatarGender, style: AvatarStyle) {
  return defaultAvatars.find((avatar) => avatar.gender === gender && avatar.style === style)?.imageUrl;
}
