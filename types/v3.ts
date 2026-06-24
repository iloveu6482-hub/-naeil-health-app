import type { AvatarStyle } from "@/types/user";

export type AvatarGrowthMode = "basic" | "routineGrowth" | "goalVisualization";
export type AvatarGrowthStage = { level: number; title: string; description: string; requiredPoints: number; requiredChallenges: number; effects: string[] };
export type HealthChangeSnapshot = { id: string; label: "start" | "current" | "previous"; date: string; averageSteps: number; averageSleepHours: number; waterDays: number; mealRecordCount: number; exerciseDays: number; weight?: number; bmi?: number; systolicBloodPressure?: number; fastingGlucose?: number; ldlCholesterol?: number; healthScore: number };
export type CheckupInsight = { id: string; category: "bloodPressure" | "bloodSugar" | "cholesterol" | "liver" | "weight" | "sleep" | "water" | "exercise"; title: string; status: "good" | "caution" | "needsCare"; summary: string; recommendedMissions: string[] };
export type FamilyMember = { id: string; name: string; relation: "self" | "parent" | "spouse" | "child" | "sibling" | "other"; avatarStyle: AvatarStyle; mainGoal: "walking" | "meal" | "water" | "sleep" | "exercise" | "checkup" | "bloodPressure" | "bloodSugar" | "weight"; weeklyCompletedCount: number; todayCompleted: boolean };
export type FamilyChallenge = { id: string; title: string; description: string; participantIds: string[]; progress: number; rewardPoints: number; badge: string; endDate: string };
export type FamilyCheerMessage = { id: string; memberId: string; message: string; createdAt: string };
