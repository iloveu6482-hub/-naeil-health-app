export type AiHealthReport = {
  id: string;
  healthScore: number;
  summary: string;
  goodPoints: string[];
  cautionPoints: string[];
  recommendations: string[];
  weeklyMission: string[];
  coachMessage: string;
  disclaimer: string;
};
