export const HEALTH_DAY_START_HOUR = 5;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getHealthDayKey(date = new Date()) {
  const healthDate = new Date(date);

  if (healthDate.getHours() < HEALTH_DAY_START_HOUR) {
    healthDate.setDate(healthDate.getDate() - 1);
  }

  return getLocalDateKey(healthDate);
}

