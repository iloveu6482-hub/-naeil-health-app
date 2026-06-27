export type PointTransaction = {
  id: string;
  userId: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  createdAt: string;
};

export type AvatarItemCategory = "outfit" | "shoes" | "accessory" | "background" | "theme";

export type AvatarItem = {
  id: string;
  name: string;
  category: AvatarItemCategory;
  price: number;
  description: string;
  imageUrl?: string;
  outfitKey?: import("@/types/avatar").AvatarOutfit;
  themeKey?: import("@/types/avatar").AvatarTheme;
  resetTheme?: boolean;
  isOwned: boolean;
  isEquipped: boolean;
};

export type RewardBadge = {
  id: string;
  title: string;
  description: string;
  condition: string;
  earnedAt?: string;
};
