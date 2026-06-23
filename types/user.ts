export type AvatarStyle = "3d" | "emotional" | "senior";

export type UserProfile = {
  id: string;
  name: string;
  birthYear: number;
  gender: "male" | "female" | "other";
  avatarStyle: AvatarStyle;
};
