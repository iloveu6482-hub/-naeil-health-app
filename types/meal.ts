export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealCategory =
  | "korean"
  | "western"
  | "chinese"
  | "japanese"
  | "snack"
  | "custom";

export type MealAnalysis = {
  id: string;
  mealType: MealType;
  mealDate: string;
  imageUrl?: string;
  inputMethod?: "menu" | "manual";
  category?: MealCategory;
  selectedMenus?: string[];
  includesVegetables?: boolean;
  mealCondition?: "balanced" | "normal" | "heavy" | "late" | "skipped";
  memo?: string;
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
