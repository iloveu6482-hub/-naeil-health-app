export type AvatarStyle = "3d" | "emotional" | "senior";

export type UserProfile = {
  id: string;
  name: string;
  birthYear: number;
  gender: "male" | "female" | "other";
  avatarStyle: AvatarStyle;
  avatarImage?: string;
  avatarEffect?: "illustrated";
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
