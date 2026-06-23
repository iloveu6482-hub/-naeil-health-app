export type HealthCheckup = {
  id: string;
  checkupDate: string;
  height: number;
  weight: number;
  bmi: number;
  waist: number;
  systolicBp: number;
  diastolicBp: number;
  fastingGlucose: number;
  totalCholesterol: number;
  hdl: number;
  ldl: number;
  triglyceride: number;
  ast: number;
  alt: number;
  gammaGtp: number;
  smokingStatus: "none" | "past" | "current";
  drinkingFrequency: "none" | "low" | "medium" | "high";
  exerciseFrequency: "low" | "medium" | "high";
};

export type DailyLog = {
  id: string;
  logDate: string;
  steps: number;
  sleepHours: number;
  waterCups: number;
  mealsCount: number;
  medicationTaken: boolean;
  exerciseDone: boolean;
  conditionScore: number;
  memo?: string;
};
