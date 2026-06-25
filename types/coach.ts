export type CoachTone = "senior" | "soft" | "strong" | "friendly" | "analytic";

export type AiCoach = {
  id: string;
  name: string;
  role: string;
  type: string;
  tone: CoachTone;
  description: string;
  imageUrl: string;
  faceImageUrl?: string;
  quote: string;
  features: string[];
  recommendedFor: string[];
};
