export type PointTransaction = {
  id: string;
  userId: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  createdAt: string;
};

export type AvatarItem = {
  id: string;
  name: string;
  category: "outfit" | "background" | "accessory" | "style";
  price: number;
  description: string;
  imageUrl?: string;
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
