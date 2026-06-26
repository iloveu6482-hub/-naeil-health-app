const DEFAULT_WEIGHT_KG = 70;
const AVERAGE_STEP_METERS = 0.7;
const WALKING_KCAL_PER_KG_KM = 0.57;

export function calculateWalkingCalories(steps: number, weightKg?: number): number {
  const safeSteps = Math.max(0, Number.isFinite(steps) ? steps : 0);
  const safeWeight = weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  const distanceKm = (safeSteps * AVERAGE_STEP_METERS) / 1000;

  return Math.round(distanceKm * safeWeight * WALKING_KCAL_PER_KG_KM);
}
