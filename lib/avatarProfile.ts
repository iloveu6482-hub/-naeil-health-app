import { getDefaultAvatarImage } from "@/lib/defaultAvatars";
import type { AvatarGender, AvatarViewMode } from "@/types/avatar";
import type { UserProfile } from "@/types/user";

export function isVideoAvatarSource(source?: string) {
  if (!source) return false;

  const lowerSource = source.toLowerCase();
  return lowerSource.startsWith("data:video/") || lowerSource.endsWith(".mp4") || lowerSource.endsWith(".webm");
}

export function getCustomAvatarSource(user: UserProfile, viewMode: AvatarViewMode) {
  if (user.avatarEffect !== "illustrated") return undefined;

  if (viewMode === "fullbody") {
    return user.avatarFullbodyImage;
  }

  return user.avatarPortraitImage || user.avatarImage;
}

export function getHeaderAvatarSource(user: UserProfile, avatarGender: AvatarGender) {
  const customSource = user.avatarPortraitImage || user.avatarImage;

  if (customSource && !isVideoAvatarSource(customSource)) {
    return customSource;
  }

  return getDefaultAvatarImage(avatarGender, user.avatarStyle) || "/avatars/default-female-3d.png";
}
