import type { MealAnalysis } from "@/types/meal";

export const sampleMeals: MealAnalysis[] = [
  {
    id: "meal-001", mealType: "breakfast", mealDate: "2026-06-23", imageUrl: "",
    foodName: "현미밥, 계란, 나물 반찬", estimatedCalories: 520, carbs: 62, protein: 24, fat: 16,
    summary: "탄수화물과 단백질이 적절히 포함된 균형 잡힌 아침 식사로 보입니다.",
    advice: "채소 반찬을 함께 유지하고, 국물 섭취는 조금 줄이면 더 좋습니다.",
    healthPointReward: 5, createdAt: "2026-06-23T08:10:00",
  },
  {
    id: "meal-002", mealType: "lunch", mealDate: "2026-06-23", imageUrl: "",
    foodName: "비빔밥", estimatedCalories: 680, carbs: 88, protein: 22, fat: 20,
    summary: "채소가 포함되어 있지만 탄수화물 비중이 다소 높을 수 있습니다.",
    advice: "식후 10분 정도 가볍게 걷는 습관을 함께 실천해보세요.",
    healthPointReward: 5, createdAt: "2026-06-23T12:30:00",
  },
];
