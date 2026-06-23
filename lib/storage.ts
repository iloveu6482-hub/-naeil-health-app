export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function removeFromStorage(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  USER_PROFILE: "naeil_user_profile",
  AVATAR_STYLE: "selectedAvatarStyle",
  HEALTH_CHECKUP: "naeil_health_checkup",
  DAILY_LOGS: "dailyLogs",
  CHALLENGES: "challenges",
  POINT_TRANSACTIONS: "healthPointTransactions",
  MEAL_RECORDS: "mealRecords",
  NOTIFICATION_SETTINGS: "notificationSettings",
  AVATAR_ITEMS: "naeil_avatar_items",
  REWARD_BADGES: "naeil_reward_badges",
  AI_REPORT: "naeil_ai_report",
  CLAIMED_REWARDS: "naeil_claimed_rewards",
  ACCOUNTS: "naeil_accounts",
  AUTH_SESSION: "naeil_auth_session",
};
