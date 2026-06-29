import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type DailyFeedbackCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";

type DailyFeedbackBody = {
  coachId?: DailyFeedbackCoachId;
  steps?: number;
  sleepHours?: number;
  waterCups?: number;
  mealsCount?: number;
  exerciseDone?: boolean;
  conditionScore?: number;
  score?: number;
  mode?: "quick" | "final";
};

type DailyFeedbackResponse = {
  message: string;
};

const coachToneMap: Record<DailyFeedbackCoachId, string> = {
  onyu: "천천히 또박또박 안내하는 시니어 친화형 말투",
  haru: "다정하고 따뜻하게 칭찬하는 건강 선생님 말투",
  kangtaeo: "단호하지만 현실적인 운동 코치 말투",
  rumi: "밝고 친근한 친구 같은 건강 코치 말투",
};

function isDailyFeedbackResponse(value: unknown): value is DailyFeedbackResponse {
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).message === "string";
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key is required." }, { status: 503 });
    }

    const body = (await request.json()) as DailyFeedbackBody;
    const coachId = body.coachId || "haru";
    const isFinalMode = body.mode === "final";
    const systemPrompt = [
      isFinalMode
        ? "You write Korean end-of-day health habit coaching for the app Naeil Health."
        : "You write short Korean health habit coaching feedback for the app Naeil Health.",
      `Use this coach style: ${coachToneMap[coachId]}.`,
      "Return exactly one JSON object only. Do not include markdown or text outside JSON.",
      isFinalMode
        ? 'The response shape must be {"message":"160-230 Korean characters of end-of-day coaching. Mention one good point, one weak point, and one concrete action for tomorrow."}'
        : 'The response shape must be {"message":"50-80 Korean characters of feedback"}',
      "Do not add a medical disclaimer sentence to the message.",
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
        max_tokens: isFinalMode ? 900 : 500,
        temperature: 0.6,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: isFinalMode
              ? `오늘 하루를 마감하는 최종 코칭입니다. 아래 기록을 바탕으로 한국어로 충분히 의미 있는 코칭을 작성해주세요. 사용자가 "AI 코칭이 별거 없다"고 느끼지 않도록 구체적이고 따뜻하게 정리하되, 의료 진단처럼 말하지 마세요.\n${JSON.stringify(body)}`
              : `오늘 습관 기록입니다. 한국어로 코치 피드백을 작성해주세요.\n${JSON.stringify(body)}`,
          },
        ],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Daily feedback failed", response.status, result.error?.message);
      return NextResponse.json({ error: "Daily feedback failed." }, { status: 502 });
    }

    const text = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Daily feedback returned empty content." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Daily feedback JSON parse failed", text);
      return NextResponse.json({ error: "Daily feedback returned invalid JSON." }, { status: 502 });
    }

    if (!isDailyFeedbackResponse(parsed)) {
      console.error("Daily feedback schema mismatch", parsed);
      return NextResponse.json({ error: "Daily feedback schema is invalid." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Daily feedback error", error);
    return NextResponse.json({ error: "Daily feedback error." }, { status: 500 });
  }
}
