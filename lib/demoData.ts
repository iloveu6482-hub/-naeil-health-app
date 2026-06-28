import { STORAGE_KEYS, saveToStorage } from "@/lib/storage";
import type { DailyLog, HealthCheckup } from "@/types/health";
import type { AuthSession, LocalAccount, UserProfile } from "@/types/user";
import type { PointTransaction } from "@/types/reward";

type DemoUserProfile = UserProfile & {
  age: number;
  height: number;
  weight: number;
};

type DemoCheckupInsight = {
  summary: string;
  risks: Array<{
    name: string;
    value: string;
    status: "danger" | "warning";
    desc: string;
  }>;
  recommendedCoach: "kangtaeo";
  coachReason: string;
};

type DemoHealthCheckupRecord = {
  id: string;
  date: string;
  glucose: number;
  alt: number;
  ggt: number;
  ast: number;
  hdl: number;
  totalCholesterol: number;
  bmi: number;
  waist: number;
  sysBP: number;
  diaBP: number;
  aiInsight?: DemoCheckupInsight;
};

type DemoWeeklyReport = {
  id: string;
  weekStart: string;
  weekEnd: string;
  weekScore: number;
  grade: "잘하고 있어요";
  best: string;
  worst: string;
  message: string;
  nextWeekGoal: string;
  generatedAt: string;
};

const demoUser: DemoUserProfile = {
  id: "demo-user",
  name: "정충일",
  age: 46,
  birthYear: 1980,
  gender: "male",
  height: 168.1,
  weight: 72.8,
  avatarStyle: "webtoon",
  defaultAvatarGender: "male",
};

const demoCheckupInsight: DemoCheckupInsight = {
  summary: "지방간과 혈당이 핵심 과제입니다. 지금 잡으면 6개월 내 정상 가능해요.",
  risks: [
    { name: "공복혈당", value: "126", status: "danger", desc: "당뇨 의심" },
    { name: "ALT", value: "85.4", status: "danger", desc: "정상의 2.4배" },
    { name: "GGT", value: "108", status: "danger", desc: "지방간 연관" },
    { name: "혈압", value: "134/90", status: "warning", desc: "고혈압 의심" },
    { name: "HDL", value: "45.1", status: "warning", desc: "낮음" },
  ],
  recommendedCoach: "kangtaeo",
  coachReason: "직접적인 수치 피드백이 지금 단계에 가장 효과적",
};

const demoCheckupRecords: DemoHealthCheckupRecord[] = [
  {
    id: "demo-checkup-2024-10-15",
    date: "2024-10-15",
    glucose: 118,
    alt: 62,
    ggt: 89,
    ast: 35,
    hdl: 42,
    totalCholesterol: 215,
    bmi: 26.8,
    waist: 91,
    sysBP: 138,
    diaBP: 92,
  },
  {
    id: "demo-checkup-2025-04-09",
    date: "2025-04-09",
    glucose: 126,
    alt: 85.4,
    ggt: 108,
    ast: 40.2,
    hdl: 45.1,
    totalCholesterol: 200,
    bmi: 25.8,
    waist: 89,
    sysBP: 134,
    diaBP: 90,
    aiInsight: demoCheckupInsight,
  },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getMonday(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function deterministicValue(seed: number, min: number, max: number, decimals = 0) {
  const raw = min + ((seed * 37) % 100) / 100 * (max - min);
  const factor = 10 ** decimals;
  return Math.round(raw * factor) / factor;
}

function buildDailyLogs(today = new Date()): Array<DailyLog & { score: number }> {
  const scores = [45, 52, 48, 58, 55, 60, 50, 66, 72, 68, 78, 82, 75, 85];

  return scores.map((score, index) => {
    const date = addDays(today, index - 14);
    const highScore = score >= 65;

    return {
      id: `demo-daily-${toDateKey(date)}`,
      logDate: toDateKey(date),
      steps: Math.round(deterministicValue(index + 1, highScore ? 7600 : 6000, highScore ? 10000 : 8200)),
      sleepHours: deterministicValue(index + 3, highScore ? 6.6 : 5.5, highScore ? 7.5 : 6.8, 1),
      waterCups: Math.round(deterministicValue(index + 5, highScore ? 6 : 4, 8)),
      mealsCount: highScore || index % 3 !== 0 ? 3 : 2,
      medicationTaken: false,
      exerciseDone: highScore,
      conditionScore: Math.round(deterministicValue(index + 7, highScore ? 72 : 60, highScore ? 85 : 72)),
      score,
    };
  });
}

function buildLegacyCheckup(record: DemoHealthCheckupRecord): HealthCheckup {
  return {
    id: record.id,
    checkupDate: record.date,
    height: demoUser.height,
    weight: demoUser.weight,
    bmi: record.bmi,
    waist: record.waist,
    systolicBp: record.sysBP,
    diastolicBp: record.diaBP,
    fastingGlucose: record.glucose,
    totalCholesterol: record.totalCholesterol,
    hdl: record.hdl,
    ldl: 128,
    triglyceride: 180,
    ast: record.ast,
    alt: record.alt,
    gammaGtp: record.ggt,
    creatinine: 0.9,
    uricAcid: 6.1,
    hemoglobin: 15.1,
    smokingStatus: "none",
    drinkingFrequency: "low",
    exerciseFrequency: "medium",
  };
}

function buildLastWeekReport(today = new Date()): DemoWeeklyReport {
  const weekStart = getMonday(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = addDays(weekStart, 6);

  return {
    id: `demo-weekly-${toDateKey(weekStart)}`,
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    weekScore: 71,
    grade: "잘하고 있어요",
    best: "수면",
    worst: "운동",
    message: "좋습니다. 최근 7일은 초반보다 확실히 올라왔습니다. 이제 운동만 고정하면 혈당과 지방간 관리에 직접적인 변화가 생깁니다.",
    nextWeekGoal: "식후 20분 걷기 매일",
    generatedAt: new Date().toISOString(),
  };
}

function buildPointTransactions(today = new Date()): PointTransaction[] {
  return [1, 3, 6, 9, 12].map((daysAgo, index) => ({
    id: `demo-point-${index + 1}`,
    userId: demoUser.id,
    type: "earn",
    amount: [20, 15, 10, 20, 15][index],
    reason: ["7,000보 이상 걷기 달성", "수면 7시간 이상 기록", "물 6잔 이상 달성", "생활습관 기록 완료", "식단 기록 완료"][index],
    createdAt: addDays(today, -daysAgo).toISOString(),
  }));
}

export function loadDemoData() {
  if (typeof window === "undefined") return;

  const today = new Date();
  const todayKey = toDateKey(today);
  const dailyLogs = buildDailyLogs(today);
  const latestCheckup = demoCheckupRecords[1];
  const accounts: LocalAccount[] = [
    {
      id: demoUser.id,
      name: demoUser.name,
      email: "demo@naeil.health",
      passwordHash: "demo-password",
      createdAt: new Date().toISOString(),
    },
  ];
  const session: AuthSession = {
    userId: demoUser.id,
    email: "demo@naeil.health",
  };

  saveToStorage(STORAGE_KEYS.USER_PROFILE, demoUser);
  saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
  saveToStorage(STORAGE_KEYS.AUTH_SESSION, session);
  saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, demoCheckupRecords);
  saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP, buildLegacyCheckup(latestCheckup));
  saveToStorage(STORAGE_KEYS.CHECKUP_INSIGHTS, demoCheckupInsight);
  saveToStorage(STORAGE_KEYS.DAILY_LOGS, dailyLogs);
  saveToStorage(STORAGE_KEYS.WEEKLY_REPORTS, [buildLastWeekReport(today)]);
  saveToStorage(STORAGE_KEYS.SELECTED_AI_COACH_ID, "kangtaeo");
  saveToStorage(STORAGE_KEYS.TODAY_COACH_MESSAGE, {
    message:
      "💪 오늘 걸음수 9,400보 달성했어요. 혈당 관리에 직접 효과 있습니다. 내일은 식후 걷기 20분 추가해보세요.",
    date: todayKey,
    coachId: "kangtaeo",
  });
  saveToStorage(STORAGE_KEYS.POINT_TRANSACTIONS, buildPointTransactions(today));
  saveToStorage(STORAGE_KEYS.AVATAR_GENDER, "male");
  saveToStorage(STORAGE_KEYS.AVATAR_STYLE, "webtoon");
  saveToStorage(STORAGE_KEYS.AVATAR_VIEW_MODE, "portrait");
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
  window.sessionStorage.clear();
}
