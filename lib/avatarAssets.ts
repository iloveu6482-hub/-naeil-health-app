import type { AvatarGender, AvatarMood, AvatarOutfit, AvatarRotationView, AvatarStyle, AvatarTheme, AvatarViewMode } from "@/types/avatar";

export function getAvatarImagePath({ style, gender, viewMode }: { style: AvatarStyle; gender: AvatarGender; viewMode: AvatarViewMode; mood?: AvatarMood }) {
  const videoPortraits = new Set([
    "emotional-female",
    "emotional-male",
    "senior-female",
    "senior-male",
    "webtoon-female",
    "webtoon-male",
  ]);

  if (viewMode === "portrait" && videoPortraits.has(`${style}-${gender}`)) {
    return `/avatars/portrait/avatar-${style}-${gender}.mp4`;
  }

  if (viewMode === "fullbody" && style === "emotional" && gender === "male") {
    return "/avatars/fullbody/avatar-emotional-male.mp4";
  }

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
  const summerVideoPortraits = new Set([
    "emotional-female",
    "emotional-male",
    "senior-female",
    "senior-male",
    "webtoon-female",
    "webtoon-male",
  ]);

  if (theme === "summer" && viewMode === "portrait" && summerVideoPortraits.has(`${style}-${gender}`)) {
    return `/avatars/themes/${theme}/${viewMode}/avatar-${style}-${gender}.mp4`;
  }

  return `/avatars/themes/${theme}/${viewMode}/avatar-${style}-${gender}.png`;
}
