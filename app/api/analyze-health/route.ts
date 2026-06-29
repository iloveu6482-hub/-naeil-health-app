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

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock?.[1]) return codeBlock[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalizeStatus(status: unknown): "정상" | "주의" | "위험" {
  const value = String(status || "").toLowerCase();
  if (value.includes("위험") || value.includes("danger") || value.includes("high") || value.includes("bad")) return "위험";
  if (value.includes("주의") || value.includes("warning") || value.includes("border") || value.includes("경계")) return "주의";
  return "정상";
}

function normalizeAnalysisResponse(value: unknown): AnalyzeHealthResponse | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const name = typeof raw.name === "string" ? raw.name : typeof raw.item === "string" ? raw.item : "";
      const valueText = raw.value === undefined || raw.value === null ? "" : String(raw.value);
      const unit = raw.unit === undefined || raw.unit === null ? "" : String(raw.unit);
      const comment =
        typeof raw.comment === "string"
          ? raw.comment
          : typeof raw.desc === "string"
            ? raw.desc
            : typeof raw.description === "string"
              ? raw.description
              : "";
      if (!name || !valueText || !comment) return null;
      return {
        name,
        value: valueText,
        unit,
        status: normalizeStatus(raw.status),
        comment,
      };
    })
    .filter((item): item is AnalyzeHealthResponse["items"][number] => Boolean(item));

  if (items.length === 0) return null;

  const summary = {
    정상: items.filter((item) => item.status === "정상").length,
    주의: items.filter((item) => item.status === "주의").length,
    위험: items.filter((item) => item.status === "위험").length,
  };

  const rawSummary = record.summary as Record<string, unknown> | undefined;
  if (rawSummary) {
    summary.정상 = Number(rawSummary.정상 ?? rawSummary.normal ?? summary.정상) || summary.정상;
    summary.주의 = Number(rawSummary.주의 ?? rawSummary.warning ?? summary.주의) || summary.주의;
    summary.위험 = Number(rawSummary.위험 ?? rawSummary.danger ?? summary.위험) || summary.위험;
  }

  const rawChallenges = Array.isArray(record.recommended_challenges)
    ? record.recommended_challenges
    : Array.isArray(record.recommendedChallenges)
      ? record.recommendedChallenges
      : [];
  const recommended_challenges = rawChallenges
    .map((challenge) => {
      if (!challenge || typeof challenge !== "object") return null;
      const raw = challenge as Record<string, unknown>;
      const title = typeof raw.title === "string" ? raw.title : "";
      const reason = typeof raw.reason === "string" ? raw.reason : "";
      if (!title || !reason) return null;
      return { title, reason };
    })
    .filter((challenge): challenge is AnalyzeHealthResponse["recommended_challenges"][number] => Boolean(challenge))
    .slice(0, 2);

  return {
    summary,
    items,
    recommended_challenges:
      recommended_challenges.length > 0
        ? recommended_challenges
        : [{ title: "식후 20분 걷기", reason: "혈당과 간수치 관리에 함께 도움이 되는 기본 습관이에요." }],
    overall_comment:
      typeof record.overall_comment === "string"
        ? record.overall_comment
        : typeof record.overallComment === "string"
          ? record.overallComment
          : "현재 수치는 전반적으로 안정적인 편이지만, 생활 습관을 꾸준히 기록하며 다음 검진까지 흐름을 확인해보세요.",
  };
}

function getStatusFromRange(value: number, warning: (value: number) => boolean, danger: (value: number) => boolean) {
  if (danger(value)) return "위험";
  if (warning(value)) return "주의";
  return "정상";
}

function createFallbackAnalysis(body: AnalyzeHealthRequest): AnalyzeHealthResponse {
  const items: AnalyzeHealthResponse["items"] = [
    {
      name: "공복혈당",
      value: String(body.glucose),
      unit: "mg/dL",
      status: getStatusFromRange(body.glucose, (value) => value >= 100, (value) => value >= 126),
      comment: body.glucose >= 100 ? "식후 걷기와 야식 줄이기를 우선 관리하면 좋아요." : "현재 공복혈당은 일반적인 정상 범위에 가까워요.",
    },
    {
      name: "ALT",
      value: String(body.alt),
      unit: "U/L",
      status: getStatusFromRange(body.alt, (value) => value > 40, (value) => value >= 80),
      comment: body.alt > 40 ? "간 피로 신호일 수 있어 음주와 야식을 줄이는 습관이 중요해요." : "ALT는 안정적인 범위로 보입니다.",
    },
    {
      name: "GGT",
      value: String(body.ggt),
      unit: "U/L",
      status: getStatusFromRange(body.ggt, (value) => value > 60, (value) => value >= 100),
      comment: body.ggt > 60 ? "지방간, 음주, 야식 습관과 함께 관리하면 좋아요." : "GGT는 큰 위험 신호가 두드러지지 않아요.",
    },
    {
      name: "AST",
      value: String(body.ast),
      unit: "U/L",
      status: getStatusFromRange(body.ast, (value) => value > 40, (value) => value >= 80),
      comment: body.ast > 40 ? "간수치 흐름을 함께 보며 무리한 음주와 과식을 줄여보세요." : "AST는 안정적인 범위로 보입니다.",
    },
    {
      name: "HDL 콜레스테롤",
      value: String(body.hdl),
      unit: "mg/dL",
      status: getStatusFromRange(body.hdl, (value) => value < 50, (value) => value < 40),
      comment: body.hdl < 50 ? "꾸준한 걷기와 체중 관리가 좋은 콜레스테롤 개선에 도움이 돼요." : "HDL은 비교적 좋은 흐름입니다.",
    },
    {
      name: "총콜레스테롤",
      value: String(body.totalCholesterol),
      unit: "mg/dL",
      status: getStatusFromRange(body.totalCholesterol, (value) => value >= 200, (value) => value >= 240),
      comment: body.totalCholesterol >= 200 ? "기름진 식사와 야식 빈도를 줄이는 방향이 좋아요." : "총콜레스테롤은 정상 범위에 가까워요.",
    },
    {
      name: "BMI",
      value: String(body.bmi),
      unit: "",
      status: getStatusFromRange(body.bmi, (value) => value >= 23, (value) => value >= 25),
      comment: body.bmi >= 23 ? "체중 관리가 혈당과 간수치 관리에도 함께 도움이 돼요." : "BMI는 안정적인 편입니다.",
    },
    {
      name: "허리둘레",
      value: String(body.waist),
      unit: "cm",
      status: getStatusFromRange(body.waist, (value) => value >= 85, (value) => value >= 90),
      comment: body.waist >= 85 ? "복부 지방 관리를 위해 식후 걷기와 야식 줄이기를 추천해요." : "허리둘레는 관리가 잘 되고 있어요.",
    },
    {
      name: "수축기 혈압",
      value: String(body.sysBP),
      unit: "mmHg",
      status: getStatusFromRange(body.sysBP, (value) => value >= 120, (value) => value >= 140),
      comment: body.sysBP >= 120 ? "염분 섭취와 수면 리듬을 함께 챙겨보면 좋아요." : "수축기 혈압은 안정적인 편입니다.",
    },
    {
      name: "이완기 혈압",
      value: String(body.diaBP),
      unit: "mmHg",
      status: getStatusFromRange(body.diaBP, (value) => value >= 80, (value) => value >= 90),
      comment: body.diaBP >= 80 ? "수면, 스트레스, 짠 음식 섭취를 같이 관리해보세요." : "이완기 혈압은 안정적인 편입니다.",
    },
  ];

  return {
    summary: {
      정상: items.filter((item) => item.status === "정상").length,
      주의: items.filter((item) => item.status === "주의").length,
      위험: items.filter((item) => item.status === "위험").length,
    },
    items,
    recommended_challenges: [
      { title: "식후 20분 걷기", reason: "혈당, 체중, 간수치 관리에 모두 연결되는 기본 챌린지예요." },
      { title: "야식 줄이기", reason: "복부둘레와 간수치 흐름을 안정시키는 데 도움이 돼요." },
    ],
    overall_comment:
      "현재 검진 수치는 생활 습관과 함께 관리하면 좋아지는 항목들이 보입니다. 오늘부터 식후 걷기, 수분 섭취, 야식 줄이기처럼 실천 가능한 습관을 꾸준히 쌓아보세요.",
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      const body = await request.json();
      if (!isAnalyzeHealthRequest(body)) {
        return NextResponse.json({ error: "검진 수치 입력값을 확인해주세요." }, { status: 400 });
      }
      return NextResponse.json(createFallbackAnalysis(body));
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
      return NextResponse.json(createFallbackAnalysis(body));
    }

    const text = extractText(result);
    if (!text) {
      return NextResponse.json(createFallbackAnalysis(body));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      console.error("Analyze health JSON parse failed", text);
      return NextResponse.json(createFallbackAnalysis(body));
    }

    const normalized = normalizeAnalysisResponse(parsed);
    if (!normalized || !isAnalyzeHealthResponse(normalized)) {
      console.error("Analyze health schema mismatch", parsed);
      return NextResponse.json(createFallbackAnalysis(body));
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Analyze health error", error);
    return NextResponse.json({ error: "분석에 실패했어요. 다시 시도해주세요." }, { status: 500 });
  }
}
