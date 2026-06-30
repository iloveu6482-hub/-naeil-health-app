import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type CheckupOcrRequest = {
  fileData?: string;
  fileName?: string;
  mimeType?: string;
};

type CheckupOcrResult = {
  institution?: string;
  date?: string;
  glucose?: number;
  alt?: number;
  ggt?: number;
  ast?: number;
  hdl?: number;
  totalCholesterol?: number;
  bmi?: number;
  waist?: number;
  sysBP?: number;
  diaBP?: number;
};

const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const numericFields: Array<keyof CheckupOcrResult> = [
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

function parseDataUrl(fileData?: string, explicitMimeType?: string) {
  const match = fileData?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = explicitMimeType || match[1];
  if (!supportedMimeTypes.has(mimeType)) return null;

  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength > 10 * 1024 * 1024) return null;

  return { base64, mimeType };
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

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0];
  if (!normalized) return undefined;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeOcrResult(value: unknown): CheckupOcrResult | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const result: CheckupOcrResult = {};
  const numericResult = result as Record<keyof CheckupOcrResult, number | string | undefined>;

  if (typeof record.institution === "string") result.institution = record.institution;
  if (typeof record.date === "string") result.date = record.date;

  numericFields.forEach((field) => {
    const numberValue = toNumber(record[field]);
    if (numberValue !== undefined) numericResult[field] = numberValue;
  });

  const foundNumericCount = numericFields.filter((field) => result[field] !== undefined).length;
  return foundNumericCount >= 3 ? result : null;
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "검진표 자동 입력을 위해 Claude API 키가 필요합니다." }, { status: 503 });
    }

    const body = (await request.json()) as CheckupOcrRequest;
    const parsedFile = parseDataUrl(body.fileData, body.mimeType);
    if (!parsedFile) {
      return NextResponse.json({ error: "JPG, PNG, WEBP 또는 PDF 파일을 10MB 이하로 올려주세요." }, { status: 400 });
    }

    const fileBlock =
      parsedFile.mimeType === "application/pdf"
        ? {
            type: "document",
            source: {
              type: "base64",
              media_type: parsedFile.mimeType,
              data: parsedFile.base64,
            },
          }
        : {
            type: "image",
            source: {
              type: "base64",
              media_type: parsedFile.mimeType,
              data: parsedFile.base64,
            },
          };

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
        temperature: 0,
        system:
          "You extract Korean health checkup lab values from an uploaded image or PDF. Return only one JSON object. Do not include markdown or explanations.",
        messages: [
          {
            role: "user",
            content: [
              fileBlock,
              {
                type: "text",
                text: [
                  "이 검진표에서 아래 항목만 찾아 JSON으로 반환해줘.",
                  "없는 값은 키를 생략해.",
                  "날짜는 YYYY-MM-DD 형식으로 변환해.",
                  "항목 매핑:",
                  "glucose=공복혈당, alt=ALT, ggt=GGT/감마GTP, ast=AST, hdl=HDL콜레스테롤, totalCholesterol=총콜레스테롤, bmi=BMI, waist=허리둘레, sysBP=수축기혈압/최고혈압, diaBP=이완기혈압/최저혈압",
                  '응답 예시: {"institution":"검진기관","date":"2026-06-30","glucose":98,"alt":24,"ggt":42,"ast":28,"hdl":54,"totalCholesterol":198,"bmi":24.1,"waist":86,"sysBP":118,"diaBP":76}',
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    const apiResult = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Checkup OCR failed", response.status, apiResult.error?.message);
      return NextResponse.json({ error: "검진표 수치를 읽지 못했어요. 선명한 파일로 다시 시도해주세요." }, { status: 502 });
    }

    const text = extractText(apiResult);
    if (!text) {
      return NextResponse.json({ error: "검진표에서 수치를 찾지 못했어요." }, { status: 422 });
    }

    const parsed = JSON.parse(extractJson(text)) as unknown;
    const normalized = normalizeOcrResult(parsed);
    if (!normalized) {
      return NextResponse.json({ error: "검진표에서 충분한 수치를 찾지 못했어요. 일부 수치는 직접 입력해주세요." }, { status: 422 });
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Checkup OCR error", error);
    return NextResponse.json({ error: "검진표 자동 입력 중 오류가 발생했어요." }, { status: 500 });
  }
}
