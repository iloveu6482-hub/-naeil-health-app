import type { AvatarGender, AvatarMood, AvatarOutfit, AvatarRotationView, AvatarStyle, AvatarTheme, AvatarViewMode } from "@/types/avatar";

export function getAvatarImagePath({ style, gender, viewMode }: { style: AvatarStyle; gender: AvatarGender; viewMode: AvatarViewMode; mood?: AvatarMood }) {
  return `/avatars/${viewMode}/avatar-${style}-${gender}.png`;
}

export function getFallbackAvatarImagePath({ style, gender }: { style: AvatarStyle; gender: AvatarGender }) {
  return `/avatars/portrait/avatar-${style}-${gender}.png`;
}

export function getAvatarRotationImagePath({ style, gender, rotationView }: { style: AvatarStyle; gender: AvatarGender; rotationView: AvatarRotationView }) {
  return `/avatars/rotation/${style}-${gender}/${rotationView}.png`;
}

export function getAvatarOutfitImagePath({ style, gender, viewMode, outfit }: { style: AvatarStyle; gender: AvatarGender; viewMode: AvatarViewMode; outfit: AvatarOutfit }) {
  return `/avatars/outfits/${viewMode}/avatar-${style}-${gender}-${outfit}.webp`;
}

export function getAvatarThemeImagePath({ style, gender, viewMode, theme }: { style: AvatarStyle; gender: AvatarGender; viewMode: AvatarViewMode; theme: AvatarTheme }) {
  return `/avatars/themes/${theme}/${viewMode}/avatar-${style}-${gender}.png`;
}
