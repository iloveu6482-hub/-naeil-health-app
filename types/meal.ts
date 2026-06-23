export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealAnalysis = {
  id: string;
  mealType: MealType;
  mealDate: string;
  imageUrl?: string;
  foodName: string;
  estimatedCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  summary: string;
  advice: string;
  healthPointReward: number;
  createdAt: string;
};
