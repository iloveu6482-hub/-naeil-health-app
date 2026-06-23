import type { HealthCheckup, DailyLog } from "@/types/health";
import type { AiHealthReport } from "@/types/report";
import { calculateHealthScore } from "@/lib/healthRules";

export const HEALTH_DISCLAIMER =
  "본 서비스는 의료 진단이나 치료 목적이 아닌 건강검진 결과 이해 보조 및 생활습관 개선 정보 제공을 위한 서비스입니다. 정확한 진단과 치료는 의료기관 및 전문의 상담을 권장합니다.";

export function generateRuleBasedReport(
  checkup: HealthCheckup,
  dailyLog: DailyLog
): AiHealthReport {
  const healthScore = calculateHealthScore(checkup, dailyLog);

  const goodPoints: string[] = [];
  const cautionPoints: string[] = [];
  const recommendations: string[] = [];
  const weeklyMission: string[] = [];

  if (checkup.systolicBp < 130 && checkup.diastolicBp < 85) {
    goodPoints.push("혈압은 안정적으로 관리되고 있는 편입니다.");
  } else {
    cautionPoints.push(
      "혈압 관리를 위해 짠 음식 섭취와 활동량을 함께 살펴보면 좋습니다."
    );
    recommendations.push(
      "국물 섭취를 줄이고 하루 20~30분 가볍게 걷는 습관을 실천해보세요."
    );
  }

  if (checkup.fastingGlucose < 100) {
    goodPoints.push("공복혈당은 안정적인 편입니다.");
  } else {
    cautionPoints.push(
      "혈당 관리를 위해 식사 구성과 식후 활동을 점검해보면 좋습니다."
    );
    recommendations.push(
      "식후 10분 걷기와 당류 섭취 줄이기를 실천해보세요."
    );
  }

  if (checkup.totalCholesterol < 200) {
    goodPoints.push("총콜레스테롤 수치가 관리 범위에 가까운 편입니다.");
  } else {
    cautionPoints.push(
      "콜레스테롤 관리를 위해 식습관과 유산소 활동을 점검해보면 좋습니다."
    );
    recommendations.push(
      "튀김, 가공식품, 포화지방 섭취를 줄이고 채소와 생선 섭취를 늘려보세요."
    );
  }

  if (checkup.bmi >= 18.5 && checkup.bmi < 25) {
    goodPoints.push("체질량지수(BMI)가 적정 범위에 있습니다.");
  } else if (checkup.bmi >= 25) {
    cautionPoints.push(
      "체중 관리가 도움이 될 수 있는 상태입니다. 꾸준한 활동이 좋습니다."
    );
    recommendations.push(
      "하루 30분 가볍게 걷기부터 시작해 규칙적인 활동 습관을 만들어보세요."
    );
  }

  if (dailyLog.sleepHours >= 7) {
    goodPoints.push("수면 시간이 충분한 편입니다.");
  } else {
    cautionPoints.push(
      "수면 시간이 부족하면 컨디션과 생활 리듬에 영향을 줄 수 있습니다."
    );
    recommendations.push(
      "취침 시간을 일정하게 유지하고 자기 전 스마트폰 사용을 줄여보세요."
    );
  }

  if (dailyLog.steps >= 7000) {
    goodPoints.push("오늘의 걷기 활동이 좋은 편입니다.");
  } else {
    cautionPoints.push("오늘은 활동량이 다소 부족할 수 있습니다.");
    recommendations.push(
      "가벼운 산책이나 계단 이용처럼 부담 없는 활동부터 시작해보세요."
    );
  }

  if (dailyLog.waterCups >= 6) {
    goodPoints.push("충분한 수분 섭취를 실천하고 있습니다.");
  } else {
    cautionPoints.push("수분 섭취가 조금 부족할 수 있습니다.");
    recommendations.push(
      "식사 전후로 물 한 잔씩 마시는 습관부터 시작해보세요."
    );
  }

  weeklyMission.push("식후 10분 걷기 실천하기");
  weeklyMission.push("하루 물 6잔 이상 마시기");
  weeklyMission.push("수면 7시간 유지하기");

  return {
    id: "report-001",
    healthScore,
    summary:
      healthScore >= 80
        ? "전반적으로 건강관리가 잘 이루어지고 있습니다. 현재의 좋은 습관을 꾸준히 유지해보세요."
        : healthScore >= 60
        ? "대체로 무난한 편이지만, 일부 생활습관은 조금씩 개선해보면 좋습니다."
        : "생활습관 관리가 필요한 항목이 있습니다. 무리하지 말고 작은 실천부터 시작해보세요.",
    goodPoints,
    cautionPoints,
    recommendations,
    weeklyMission,
    coachMessage:
      "작은 습관이 쌓이면 건강한 내일을 만들 수 있어요. 오늘도 건강이와 함께 한 가지씩 실천해봐요.",
    disclaimer: HEALTH_DISCLAIMER,
  };
}

export async function generateAiReportWithApi(): Promise<never> {
  throw new Error("추후 AI API 연동 예정입니다.");
}
