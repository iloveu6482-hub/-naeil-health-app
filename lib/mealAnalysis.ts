import type { MealAnalysis, MealType } from "@/types/meal";

export const MEAL_DISCLAIMER = "식단 분석은 사진 기반의 참고용 예상 정보입니다. 정확한 영양 상담이나 치료 목적의 식단 관리는 전문가 상담을 권장합니다.";

export async function mockAnalyzeMealImage(mealType: MealType, imageUrl?: string): Promise<MealAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const samples: Record<MealType, Omit<MealAnalysis, "id" | "mealDate" | "imageUrl" | "createdAt">> = {
    breakfast: { mealType: "breakfast", foodName: "현미밥, 계란, 나물 반찬", estimatedCalories: 520, carbs: 62, protein: 24, fat: 16, summary: "탄수화물과 단백질이 적절히 포함된 균형 잡힌 아침 식사로 보입니다.", advice: "채소 반찬을 함께 유지하고, 국물 섭취는 조금 줄이면 더 좋습니다.", healthPointReward: 5 },
    lunch: { mealType: "lunch", foodName: "비빔밥", estimatedCalories: 680, carbs: 88, protein: 22, fat: 20, summary: "채소가 포함되어 있지만 탄수화물 비중이 다소 높을 수 있습니다.", advice: "식후 10분 정도 가볍게 걷는 습관을 함께 실천해보세요.", healthPointReward: 5 },
    dinner: { mealType: "dinner", foodName: "닭가슴살 샐러드와 고구마", estimatedCalories: 450, carbs: 48, protein: 32, fat: 12, summary: "단백질과 식이섬유가 포함된 가벼운 저녁 식사로 보입니다.", advice: "현재 구성을 유지하되, 너무 늦은 시간의 식사는 피하는 것이 좋습니다.", healthPointReward: 5 },
    snack: { mealType: "snack", foodName: "카페라떼와 빵", estimatedCalories: 390, carbs: 52, protein: 9, fat: 14, summary: "간식으로는 칼로리와 탄수화물 비중이 다소 높을 수 있습니다.", advice: "다음 간식은 견과류, 과일, 무가당 음료처럼 가벼운 선택을 고려해보세요.", healthPointReward: 3 },
  };
  return { id: `meal-${Date.now()}`, mealDate: new Date().toISOString().slice(0, 10), imageUrl, createdAt: new Date().toISOString(), ...samples[mealType] };
}

export function getMealTypeLabel(mealType: MealType) {
  return ({ breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" } as const)[mealType];
}

export function prepareMealImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("이미지 파일을 선택해주세요."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("사진을 불러오지 못했습니다."));
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
