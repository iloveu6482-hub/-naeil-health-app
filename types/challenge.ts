export type Challenge = {
  id: string;
  title: string;
  description: string;
  targetType: "steps" | "water" | "sleep" | "meal" | "exercise";
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "failed";
  rewardPoints: number;
  isRewardClaimed: boolean;
};
