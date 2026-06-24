import type { FamilyChallenge, FamilyCheerMessage, FamilyMember } from "@/types/v3";

export const sampleFamilyMembers: FamilyMember[] = [
  { id: "family-self", name: "사용자", relation: "self", avatarStyle: "3d", mainGoal: "walking", weeklyCompletedCount: 5, todayCompleted: true },
  { id: "family-parent", name: "건강맘", relation: "parent", avatarStyle: "senior", mainGoal: "bloodPressure", weeklyCompletedCount: 3, todayCompleted: false },
  { id: "family-spouse", name: "튼튼이", relation: "spouse", avatarStyle: "emotional", mainGoal: "water", weeklyCompletedCount: 4, todayCompleted: true },
];
export const sampleFamilyChallenges: FamilyChallenge[] = [
  { id: "fc-1", title: "우리 가족 7천보 걷기", description: "가족 모두 하루 7,000보를 향해 걸어봐요.", participantIds: ["family-self", "family-parent", "family-spouse"], progress: 68, rewardPoints: 100, badge: "함께 걷는 가족", endDate: "2026-06-30" },
  { id: "fc-2", title: "가족 물 6잔 챌린지", description: "서로 응원하며 수분 루틴을 만들어요.", participantIds: ["family-self", "family-spouse"], progress: 54, rewardPoints: 100, badge: "촉촉한 가족", endDate: "2026-06-30" },
];
export const sampleFamilyMessages: FamilyCheerMessage[] = [
  { id: "fm-1", memberId: "family-parent", message: "오늘도 같이 걸어봐요!", createdAt: new Date().toISOString() },
];
