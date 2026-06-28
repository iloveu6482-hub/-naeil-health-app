import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type NudgeCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";

type NudgeResponse = {
  title: string;
  message: string;
};

const coachToneMap: Record<NudgeCoachId, string> = {
  onyu: "걱정되는 마음으로 부드럽게",
  haru: "밝게 다시 시작 독려",
  kangtaeo: "직접적으로 복귀 촉구",
  rumi: "며칠 빠졌는지 수치로 언급",
};

function isNudgeResponse(value: unknown): value is NudgeResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.message === "string";
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key is required." }, { status: 503 });
    }

    const body = (await request.json()) as {
      coachId?: NudgeCoachId;
      daysMissed?: number;
    };
    const coachId = body.coachId || "haru";
    const daysMissed = typeof body.daysMissed === "number" ? body.daysMissed : 3;

    const systemPrompt = [
      "You write short Korean re-engagement notification copy for the app Naeil Health.",
      `Use this coach tone: ${coachToneMap[coachId]}.`,
      "Return exactly one JSON object only. Do not include markdown or text outside JSON.",
      'The response shape must be {"title":"Korean title within 20 characters","message":"Korean coach nudge between 50 and 70 characters"}.',
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
        max_tokens: 400,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `The user has missed habit logs for ${daysMissed} consecutive days. coachId=${coachId}. Write a return nudge in Korean.`,
          },
        ],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Nudge failed", response.status, result.error?.message);
      return NextResponse.json({ error: "Nudge failed." }, { status: 502 });
    }

    const text = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Nudge returned empty content." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Nudge JSON parse failed", text);
      return NextResponse.json({ error: "Nudge returned invalid JSON." }, { status: 502 });
    }

    if (!isNudgeResponse(parsed)) {
      console.error("Nudge schema mismatch", parsed);
      return NextResponse.json({ error: "Nudge schema is invalid." }, { status: 502 });
    }

    return NextResponse.json({
      title: parsed.title.slice(0, 20),
      message: parsed.message.slice(0, 80),
    });
  } catch (error) {
    console.error("Nudge error", error);
    return NextResponse.json({ error: "Nudge error." }, { status: 500 });
  }
}
