import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type TrendRecord = {
  date: string;
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

type ClaudeTrendResponse = {
  trend: "improving" | "stable" | "worsening";
  improved: string[];
  worsened: string[];
  message: string;
  nextAction: string;
};

function isTrendRecord(value: unknown): value is TrendRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.date === "string" &&
    ["glucose", "alt", "ggt", "ast", "hdl", "totalCholesterol", "bmi", "waist", "sysBP", "diaBP"].every(
      (key) => typeof record[key] === "number" && Number.isFinite(record[key])
    )
  );
}

function isClaudeTrendResponse(value: unknown): value is ClaudeTrendResponse {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    (record.trend === "improving" || record.trend === "stable" || record.trend === "worsening") &&
    Array.isArray(record.improved) &&
    record.improved.every((item) => typeof item === "string") &&
    Array.isArray(record.worsened) &&
    record.worsened.every((item) => typeof item === "string") &&
    typeof record.message === "string" &&
    typeof record.nextAction === "string"
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key is required." }, { status: 503 });
    }

    const body = (await request.json()) as { records?: unknown };
    if (!Array.isArray(body.records) || body.records.length < 2 || !body.records.every(isTrendRecord)) {
      return NextResponse.json({ error: "At least two checkup records are required." }, { status: 400 });
    }

    const systemPrompt = [
      "You are a Korean healthcare habit guide for the app Naeil Health.",
      "This is not medical diagnosis. Explain only as general health habit guidance.",
      "Compare multiple health checkup records in chronological order and summarize improving, stable, or worsening trends.",
      "Return exactly one JSON object. Do not include markdown, code fences, or any text outside JSON.",
      'The response shape must be {"trend":"improving | stable | worsening","improved":["items that improved in Korean"],"worsened":["items that worsened in Korean"],"message":"2-3 short Korean lines summarizing the trend","nextAction":"one key Korean action before the next checkup"}.',
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
        messages: [
          {
            role: "user",
            content: `Analyze these checkup records by date as a time series. Answer in Korean.\n${JSON.stringify(body.records)}`,
          },
        ],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Health trend failed", response.status, result.error?.message);
      return NextResponse.json({ error: "Trend analysis failed." }, { status: 502 });
    }

    const text = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Trend analysis returned empty content." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Health trend JSON parse failed", text);
      return NextResponse.json({ error: "Trend analysis returned invalid JSON." }, { status: 502 });
    }

    if (!isClaudeTrendResponse(parsed)) {
      console.error("Health trend schema mismatch", parsed);
      return NextResponse.json({ error: "Trend analysis schema is invalid." }, { status: 502 });
    }

    const trend = parsed.trend === "improving" ? "개선중" : parsed.trend === "worsening" ? "악화주의" : "유지";

    return NextResponse.json({
      ...parsed,
      trend,
    });
  } catch (error) {
    console.error("Health trend error", error);
    return NextResponse.json({ error: "Trend analysis error." }, { status: 500 });
  }
}
