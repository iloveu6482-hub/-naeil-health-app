import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type AnalyzeHealthRequest = {
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

type AnalyzeHealthResponse = {
  summary: {
    정상: number;
    주의: number;
    위험: number;
  };
  items: Array<{
    name: string;
    value: string;
    unit: string;
    status: "정상" | "주의" | "위험";
    comment: string;
  }>;
  recommended_challenges: Array<{
    title: string;
    reason: string;
  }>;
  overall_comment: string;
};

const requiredFields: Array<keyof AnalyzeHealthRequest> = [
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

function isAnalyzeHealthRequest(value: unknown): value is AnalyzeHealthRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return requiredFields.every((field) => typeof record[field] === "number" && Number.isFinite(record[field]));
}

function isAnalyzeHealthResponse(value: unknown): value is AnalyzeHealthResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const summary = record.summary as Record<string, unknown> | undefined;

  return (
    Boolean(summary) &&
    typeof summary?.정상 === "number" &&
    typeof summary?.주의 === "number" &&
    typeof summary?.위험 === "number" &&
    Array.isArray(record.items) &&
    record.items.every((item) => {
      if (!item || typeof item !== "object") return false;
      const result = item as Record<string, unknown>;
      return (
        typeof result.name === "string" &&
        typeof result.value === "string" &&
        typeof result.unit === "string" &&
        (result.status === "정상" || result.status === "주의" || result.status === "위험") &&
        typeof result.comment === "string"
      );
    }) &&
    Array.isArray(record.recommended_challenges) &&
    record.recommended_challenges.every((item) => {
      if (!item || typeof item !== "object") return false;
      const result = item as Record<string, unknown>;
      return typeof result.title === "string" && typeof result.reason === "string";
    }) &&
    typeof record.overall_comment === "string"
  );
}

function extractText(result: { content?: Array<{ type?: string; text?: string }> }) {
  return result.content?.find((item) => item.type === "text")?.text?.trim();
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API 설정이 필요합니다." }, { status: 503 });
    }

    const body = await request.json();
    if (!isAnalyzeHealthRequest(body)) {
      return NextResponse.json({ error: "검진 수치 입력값을 확인해주세요." }, { status: 400 });
    }

    const system = "당신은 건강검진 결과를 분석하는 전문 AI 코치입니다. 수치를 보고 정상/주의/위험을 판단하고, 일반인이 이해하기 쉽게 한 줄로 설명해주세요. 반드시 JSON 형식으로만 응답하세요. JSON 외 텍스트, 마크다운, 코드블록은 절대 포함하지 마세요.";
    const user = `다음 건강검진 수치를 분석해줘:
공복혈당: ${body.glucose} mg/dL
ALT: ${body.alt} U/L
GGT: ${body.ggt} U/L
AST: ${body.ast} U/L
HDL 콜레스테롤: ${body.hdl} mg/dL
총콜레스테롤: ${body.totalCholesterol} mg/dL
BMI: ${body.bmi}
허리둘레: ${body.waist} cm
수축기 혈압: ${body.sysBP} mmHg
이완기 혈압: ${body.diaBP} mmHg

응답 형식:
{
  "summary": { "정상": N, "주의": N, "위험": N },
  "items": [
    { "name": "항목명", "value": "수치", "unit": "단위", "status": "정상|주의|위험", "comment": "한 줄 설명" }
  ],
  "recommended_challenges": [
    { "title": "챌린지명", "reason": "추천 이유 한 줄" }
  ],
  "overall_comment": "전체 총평 2~3문장"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Analyze health failed", response.status, result.error?.message);
      return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 502 });
    }

    const text = extractText(result);
    if (!text) {
      return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Analyze health JSON parse failed", text);
      return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 502 });
    }

    if (!isAnalyzeHealthResponse(parsed)) {
      console.error("Analyze health schema mismatch", parsed);
      return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze health error", error);
    return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 500 });
  }
}
