import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type HealthAnalysisRequest = {
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
};

type HealthAnalysisResponse = {
  summary: string;
  risks: Array<{
    name: string;
    value: string;
    status: "danger" | "warning";
    desc: string;
  }>;
  recommendedCoach: "onyu" | "haru" | "kangtaeo" | "rumi";
  coachReason: string;
};

const requiredFields: Array<keyof HealthAnalysisRequest> = [
  "glucose",
  "alt",
  "ggt",
  "ast",
  "hdl",
  "totalCholesterol",
  "bmi",
  "waist",
  "sysBP",
  "diaBP",
];

function isHealthAnalysisRequest(value: unknown): value is HealthAnalysisRequest {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return requiredFields.every((field) => typeof record[field] === "number" && Number.isFinite(record[field]));
}

function isHealthAnalysisResponse(value: unknown): value is HealthAnalysisResponse {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  const coaches = new Set(["onyu", "haru", "kangtaeo", "rumi"]);

  return (
    typeof record.summary === "string" &&
    Array.isArray(record.risks) &&
    record.risks.every((risk) => {
      if (!risk || typeof risk !== "object") return false;
      const item = risk as Record<string, unknown>;
      return (
        typeof item.name === "string" &&
        typeof item.value === "string" &&
        (item.status === "danger" || item.status === "warning") &&
        typeof item.desc === "string"
      );
    }) &&
    typeof record.recommendedCoach === "string" &&
    coaches.has(record.recommendedCoach) &&
    typeof record.coachReason === "string"
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API 설정이 필요합니다." }, { status: 503 });
    }

    const body = await request.json();
    if (!isHealthAnalysisRequest(body)) {
      return NextResponse.json({ error: "검진 수치 입력값을 확인해주세요." }, { status: 400 });
    }

    const systemPrompt = [
      "너는 한국어 헬스케어 앱 '내일의건강'의 건강검진 분석 도우미다.",
      "의료 진단이 아니라 건강 습관 가이드 관점으로만 설명한다.",
      "반드시 JSON 객체 하나만 반환한다.",
      "JSON 앞뒤에 설명, 마크다운, 코드블록, 주석, 추가 문장을 절대 붙이지 않는다.",
      '응답 형식은 정확히 {"summary":"핵심 과제 한 줄 요약","risks":[{"name":"항목명","value":"수치","status":"danger 또는 warning","desc":"한줄 설명"}],"recommendedCoach":"onyu | haru | kangtaeo | rumi","coachReason":"추천 이유 한 줄"} 이다.',
      "recommendedCoach는 onyu, haru, kangtaeo, rumi 중 하나만 선택한다.",
      "위험 항목이 명확하지 않으면 가장 우선 관리하면 좋은 항목을 warning으로 1개 이상 포함한다.",
    ].join("\n");

    const userPrompt = [
      "아래 건강검진 수치를 분석해줘.",
      `공복혈당: ${body.glucose}`,
      `ALT: ${body.alt}`,
      `GGT: ${body.ggt}`,
      `AST: ${body.ast}`,
      `HDL콜레스테롤: ${body.hdl}`,
      `총콜레스테롤: ${body.totalCholesterol}`,
      `BMI: ${body.bmi}`,
      `허리둘레: ${body.waist}`,
      `수축기 혈압: ${body.sysBP}`,
      `이완기 혈압: ${body.diaBP}`,
    ].join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 900,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Health analysis failed", response.status, result.error?.message);
      return NextResponse.json({ error: "검진 분석을 완료하지 못했습니다." }, { status: 502 });
    }

    const text = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "검진 분석 결과가 비어 있습니다." }, { status: 502 });
    }

    let analysis: unknown;
    try {
      analysis = JSON.parse(text);
    } catch {
      console.error("Health analysis JSON parse failed", text);
      return NextResponse.json({ error: "검진 분석 결과 형식이 올바르지 않습니다." }, { status: 502 });
    }

    if (!isHealthAnalysisResponse(analysis)) {
      console.error("Health analysis schema mismatch", analysis);
      return NextResponse.json({ error: "검진 분석 결과 구조가 올바르지 않습니다." }, { status: 502 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Health analysis error", error);
    return NextResponse.json({ error: "검진 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
