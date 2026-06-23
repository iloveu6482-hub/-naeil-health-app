import type { HealthCheckup } from "@/types/health";
import { sampleCheckup } from "@/lib/sampleData";

export async function mockAnalyzeCheckupImage(file?: File): Promise<HealthCheckup> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { ...sampleCheckup, id: `checkup-${Date.now()}` };
}

export async function analyzeCheckupImageWithApi(): Promise<never> {
  throw new Error("추후 OCR API 연동 예정입니다.");
}
