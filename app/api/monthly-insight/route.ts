import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type MonthlyInsightRequest = {
  habitCounts: Record<string, number>;
  riskyCheckupItems: Array<{
    name: string;
    value: string;
    status: string;
  }>;
};

function isMonthlyInsightRequest(value: unknown): value is MonthlyInsightRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Boolean(record.habitCounts) && typeof record.habitCounts === "object" && Array.isArray(record.riskyCheckupItems);
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key is required." }, { status: 503 });
    }

    const body = await request.json();
    if (!isMonthlyInsightRequest(body)) {
      return NextResponse.json({ error: "Valid monthly insight data is required." }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 220,
        temperature: 0.3,
        system: "당신은 건강 코치입니다. 반드시 한 문장으로만 응답하세요.",
        messages: [
          {
            role: "user",
            content: `이번 달 습관 데이터: ${JSON.stringify(body.habitCounts)}
최근 검진 수치: ${JSON.stringify(body.riskyCheckupItems)}
'이번 달 [습관] 실천 → 다음 검진에서 [수치] 개선이 기대돼요' 형식으로 한 문장만 작성해줘.`,
          },
        ],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Monthly insight failed", response.status, result.error?.message);
      return NextResponse.json({ error: "Monthly insight failed." }, { status: 502 });
    }

    const message = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!message) {
      return NextResponse.json({ error: "Monthly insight returned empty content." }, { status: 502 });
    }

    return NextResponse.json({ message: message.split(/\n/)[0] });
  } catch (error) {
    console.error("Monthly insight error", error);
    return NextResponse.json({ error: "Monthly insight error." }, { status: 500 });
  }
}
