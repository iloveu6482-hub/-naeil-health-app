import type { HealthCheckup, DailyLog } from "@/types/health";

export function calculateHealthScore(
  checkup: HealthCheckup,
  dailyLog: DailyLog
): number {
  let score = 0;

  if (checkup.systolicBp < 130 && checkup.diastolicBp < 85) score += 15;
  if (checkup.fastingGlucose < 100) score += 15;
  if (checkup.bmi >= 18.5 && checkup.bmi < 25) score += 10;
  if (checkup.totalCholesterol < 200) score += 10;
  if (dailyLog.sleepHours >= 7) score += 15;
  if (dailyLog.steps >= 7000) score += 15;
  if (dailyLog.waterCups >= 6) score += 10;
  if (dailyLog.exerciseDone) score += 10;

  return Math.min(score, 100);
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "매우 좋음";
  if (score >= 60) return "양호";
  if (score >= 40) return "주의 필요";
  return "관리 필요";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#4CAF6A";
  if (score >= 60) return "#F7C948";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}
