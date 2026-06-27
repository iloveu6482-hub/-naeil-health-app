import type { DailyLog } from "@/types/health";
import type { MealAnalysis } from "@/types/meal";

export type LifestyleScoreItemId = "activity" | "meal" | "sleep" | "water" | "exercise";

export type LifestyleScoreItem = {
  id: LifestyleScoreItemId;
  title: string;
  valueText: string;
  score: number;
  maxScore: number;
  formula: string;
  currentKey: string;
};

export function getTodayMealCount(dailyLog: DailyLog, meals: MealAnalysis[]) {
  const today = new Date().toISOString().slice(0, 10);
  const recordedMeals = meals.filter((meal) => meal.mealDate === today && meal.mealType !== "snack").length;
  return Math.max(recordedMeals, dailyLog.mealsCount || 0);
}

export function calculateActivityScore(steps: number) {
  if (steps < 2000) return 0;
  return Math.min(35, Math.floor(steps / 200));
}

export function getActivityScoreKey(steps: number) {
  if (steps >= 7000) return "7000";
  if (steps >= 5600) return "5600";
  if (steps >= 4200) return "4200";
  if (steps >= 2800) return "2800";
  if (steps >= 2000) return "2000";
  return "under2000";
}

export function calculateMealScore(mealsCount: number) {
  if (mealsCount <= 1) return 0;
  if (mealsCount === 2) return 18;
  return 25;
}

export function getMealScoreKey(mealsCount: number) {
  if (mealsCount >= 3) return "threeVeg";
  if (mealsCount === 2) return "twoVeg";
  return "one";
}

export function calculateSleepScore(hours: number) {
  if (hours >= 7 && hours <= 9) return 25;
  if ((hours >= 6 && hours < 7) || (hours > 9 && hours <= 10)) return 17;
  if (hours >= 5 && hours < 6) return 8;
  return 0;
}

export function getSleepScoreKey(hours: number) {
  if (hours >= 7 && hours <= 9) return "optimal";
  if (hours >= 6 && hours < 7) return "short";
  if (hours > 9 && hours <= 10) return "long";
  if (hours >= 5 && hours < 6) return "low";
  return "out";
}

export function calculateWaterScore(cups: number) {
  if (cups <= 1) return 0;
  return Math.min(15, Math.floor(cups * 2));
}

export function getWaterScoreKey(cups: number) {
  if (cups >= 8) return "eight";
  if (cups >= 6) return "six";
  if (cups >= 4) return "four";
  if (cups >= 2) return "two";
  return "one";
}

export function getExerciseScoreKey(done: boolean) {
  return done ? "on" : "off";
}

export function buildLifestyleScoreItems(dailyLog: DailyLog, meals: MealAnalysis[]): LifestyleScoreItem[] {
  const todayMealCount = getTodayMealCount(dailyLog, meals);

  return [
    {
      id: "activity",
      title: "신체활동",
      valueText: `오늘 ${dailyLog.steps.toLocaleString()}보 걸었어요`,
      score: calculateActivityScore(dailyLog.steps),
      maxScore: 35,
      formula: dailyLog.steps < 2000 ? "2,000보 미만 = 0점" : `${dailyLog.steps.toLocaleString()}보 ÷ 200 = ${Math.floor(dailyLog.steps / 200)} → 상한 35점`,
      currentKey: getActivityScoreKey(dailyLog.steps),
    },
    {
      id: "meal",
      title: "식단",
      valueText: `오늘 ${todayMealCount}끼 기록했어요`,
      score: calculateMealScore(todayMealCount),
      maxScore: 25,
      formula: todayMealCount >= 3 ? "3끼 이상 + 채소 기준 = 25점" : todayMealCount === 2 ? "2끼 + 채소 기준 = 18점" : "1끼 이하 = 0점",
      currentKey: getMealScoreKey(todayMealCount),
    },
    {
      id: "sleep",
      title: "수면",
      valueText: `오늘 ${dailyLog.sleepHours}시간 잤어요`,
      score: calculateSleepScore(dailyLog.sleepHours),
      maxScore: 25,
      formula: dailyLog.sleepHours >= 7 && dailyLog.sleepHours <= 9 ? "7~9시간 최적 구간 = 25점" : `${dailyLog.sleepHours}시간 수면 구간 점수 반영`,
      currentKey: getSleepScoreKey(dailyLog.sleepHours),
    },
    {
      id: "water",
      title: "음수",
      valueText: `오늘 물 ${dailyLog.waterCups}잔 마셨어요`,
      score: calculateWaterScore(dailyLog.waterCups),
      maxScore: 15,
      formula: dailyLog.waterCups <= 1 ? "1잔 이하 = 0점" : `${dailyLog.waterCups}잔 × 2 = ${dailyLog.waterCups * 2} → 상한 15점`,
      currentKey: getWaterScoreKey(dailyLog.waterCups),
    },
    {
      id: "exercise",
      title: "운동 실천",
      valueText: dailyLog.exerciseDone ? "오늘 별도 운동을 실천했어요" : "오늘 별도 운동 기록이 없어요",
      score: dailyLog.exerciseDone ? 5 : 0,
      maxScore: 5,
      formula: dailyLog.exerciseDone ? "운동 실천 ON = 보너스 5점" : "운동 실천 OFF = 0점",
      currentKey: getExerciseScoreKey(dailyLog.exerciseDone),
    },
  ];
}

export function calculateLifestyleScore(dailyLog: DailyLog, meals: MealAnalysis[] = []) {
  const total = buildLifestyleScoreItems(dailyLog, meals).reduce((sum, item) => sum + item.score, 0);
  return Math.min(100, total);
}
