import type { AvatarGrowthStage, HealthChangeSnapshot } from "@/types/v3";

export const avatarGrowthStages: AvatarGrowthStage[] = [
  { level: 1, title: "건강 시작러", description: "나의 건강 루틴을 시작했어요.", requiredPoints: 0, requiredChallenges: 0, effects: ["기본 배경"] },
  { level: 2, title: "루틴 적응러", description: "건강 기록이 차곡차곡 쌓이고 있어요.", requiredPoints: 200, requiredChallenges: 1, effects: ["건강 잎 효과"] },
  { level: 3, title: "건강 루틴러", description: "꾸준한 실천이 습관으로 이어지고 있어요.", requiredPoints: 500, requiredChallenges: 3, effects: ["밝은 배경", "루틴 배지"] },
  { level: 4, title: "꾸준한 실천러", description: "가족과 함께 건강한 변화를 만들고 있어요.", requiredPoints: 1000, requiredChallenges: 6, effects: ["건강 빛 효과", "보상 테마"] },
  { level: 5, title: "내일의 건강인", description: "작은 실천으로 더 나은 내일을 만들었어요.", requiredPoints: 2000, requiredChallenges: 10, effects: ["프리미엄 배경", "성장 배지"] },
];

export function getGrowthStage(points: number, completedChallenges: number) {
  return [...avatarGrowthStages].reverse().find((stage) => points >= stage.requiredPoints && completedChallenges >= stage.requiredChallenges) || avatarGrowthStages[0];
}

export const sampleSnapshots: HealthChangeSnapshot[] = [
  { id: "start", label: "start", date: "2026-05-01", averageSteps: 3200, averageSleepHours: 5.8, waterDays: 3, mealRecordCount: 0, exerciseDays: 1, weight: 74.2, bmi: 24.8, systolicBloodPressure: 128, fastingGlucose: 104, ldlCholesterol: 135, healthScore: 58 },
  { id: "current", label: "current", date: "2026-06-24", averageSteps: 7842, averageSleepHours: 7.2, waterDays: 6, mealRecordCount: 12, exerciseDays: 4, weight: 72.4, bmi: 24.1, systolicBloodPressure: 118, fastingGlucose: 98, ldlCholesterol: 122, healthScore: 90 },
];
