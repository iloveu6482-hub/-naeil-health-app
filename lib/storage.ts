export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const legacyKeys: Record<string, string> = {
    selectedAvatarStyle: "naeil_avatar_style",
    healthPointTransactions: "naeil_point_transactions",
    dailyLogs: "naeil_daily_logs",
    challenges: "naeil_challenges",
  };
  let stored = localStorage.getItem(key);
  if (!stored && legacyKeys[key]) {
    stored = localStorage.getItem(legacyKeys[key]);
    if (stored) localStorage.setItem(key, stored);
  }
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
  AVATAR_GENDER: "selectedAvatarGender",
  AVATAR_VIEW_MODE: "avatarViewMode",
  AVATAR_OUTFIT: "avatarOutfit",
  AVATAR_THEME: "avatarTheme",
  AVATAR_GROWTH_MODE: "avatarGrowthMode",
  AVATAR_GROWTH_STAGE: "avatarGrowthStage",
  HEALTH_CHECKUP_RECORDS: "healthCheckupRecords",
  CHECKUP_INSIGHTS: "checkupInsights",
  HEALTH_CHANGE_SNAPSHOTS: "healthChangeSnapshots",
  FAMILY_MEMBERS: "familyMembers",
  FAMILY_CHALLENGES: "familyChallenges",
  FAMILY_CHEER_MESSAGES: "familyCheerMessages",
  OWNED_AVATAR_ITEMS: "ownedAvatarItems",
  EQUIPPED_AVATAR_ITEMS: "equippedAvatarItems",
  AVATAR_ITEMS: "naeil_avatar_items",
  REWARD_BADGES: "naeil_reward_badges",
  AI_REPORT: "naeil_ai_report",
  CLAIMED_REWARDS: "naeil_claimed_rewards",
  ACCOUNTS: "naeil_accounts",
  AUTH_SESSION: "naeil_auth_session",
  SELECTED_AI_COACH_ID: "selectedAiCoachId",
  SAVED_LOGIN_EMAIL: "naeil_saved_login_email",
};
