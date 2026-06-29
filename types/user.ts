export type AvatarStyle = "3d" | "emotional" | "webtoon" | "senior";
export type AvatarGender = "male" | "female";

export type UserProfile = {
  id: string;
  name: string;
  birthYear: number;
  gender: "male" | "female" | "other";
  avatarStyle: AvatarStyle;
  height?: number;
  weight?: number;
  bmi?: number;
  avatarImage?: string;
  avatarPortraitImage?: string;
  avatarFullbodyImage?: string;
  avatarEffect?: "illustrated";
  defaultAvatarId?: string;
  defaultAvatarGender?: AvatarGender;
  avatarGenerationCount?: number;
  lastAvatarGeneratedAt?: string;
  avatarRegenerationMonth?: string;
  avatarRegenerationCount?: number;
  isPremium?: boolean;
};

export type LocalAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type AuthSession = {
  userId: string;
  email: string;
};
