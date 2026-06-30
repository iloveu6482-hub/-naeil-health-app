import type { HealthCheckup, DailyLog } from "@/types/health";
import type { CheckupInsight } from "@/types/v3";

export function createCheckupInsights(checkup: HealthCheckup, log?: DailyLog): CheckupInsight[] {
  const result: CheckupInsight[] = [];
  result.push(checkup.systolicBp < 130 && checkup.diastolicBp < 85
    ? { id: "bp", category: "bloodPressure", title: "혈압", status: "good", summary: "혈압이 안정적으로 관리되는 편입니다.", recommendedMissions: ["국물은 절반만 먹기", "하루 20분 걷기"] }
    : { id: "bp", category: "bloodPressure", title: "혈압 관리", status: checkup.systolicBp >= 140 ? "needsCare" : "caution", summary: "혈압 관리를 위해 짠 음식과 활동량을 살펴보면 좋습니다.", recommendedMissions: ["국물 섭취 줄이기", "물 충분히 마시기", "가볍게 걷기"] });
  result.push(checkup.fastingGlucose < 100
    ? { id: "sugar", category: "bloodSugar", title: "공복혈당", status: "good", summary: "공복혈당이 안정적인 편입니다.", recommendedMissions: ["규칙적인 식사 유지하기"] }
    : { id: "sugar", category: "bloodSugar", title: "혈당 관리", status: checkup.fastingGlucose >= 126 ? "needsCare" : "caution", summary: "식사 구성과 식후 활동을 점검해보면 좋습니다.", recommendedMissions: ["식후 10분 걷기", "단 음료 줄이기", "식사 메뉴 기록"] });
  result.push(checkup.ldl < 130 && checkup.totalCholesterol < 200
    ? { id: "chol", category: "cholesterol", title: "콜레스테롤", status: "good", summary: "콜레스테롤 수치가 관리 범위에 가까운 편입니다.", recommendedMissions: ["채소와 생선 챙기기"] }
    : { id: "chol", category: "cholesterol", title: "콜레스테롤 관리", status: "caution", summary: "기름진 음식과 유산소 활동을 함께 점검해보세요.", recommendedMissions: ["가공식품 줄이기", "주 5일 걷기"] });
  if (checkup.bmi >= 25 || checkup.waist >= 85) result.push({ id: "weight", category: "weight", title: "체중·허리둘레 관리", status: "caution", summary: "무리하지 않는 식사 기록과 꾸준한 걷기가 도움이 될 수 있습니다.", recommendedMissions: ["식사 메뉴 기록", "7,000보 걷기", "야식 줄이기"] });
  if (log && log.sleepHours < 7) result.push({ id: "sleep", category: "sleep", title: "수면 습관", status: "caution", summary: "수면 시간이 조금 부족할 수 있습니다.", recommendedMissions: ["수면 7시간", "취침 전 스마트폰 줄이기"] });
  return result;
}

export const insightStatus = { good: { label: "좋음", color: "bg-green-50 text-green-700" }, caution: { label: "주의", color: "bg-orange-50 text-orange-700" }, needsCare: { label: "관리 필요", color: "bg-red-50 text-red-700" } } as const;
