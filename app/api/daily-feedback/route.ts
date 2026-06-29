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
  healthCheckup?: {
    bmi?: number;
    waist?: number;
    systolicBp?: number;
    diastolicBp?: number;
    fastingGlucose?: number;
    totalCholesterol?: number;
    hdl?: number;
    ast?: number;
    alt?: number;
    gammaGtp?: number;
  };
  currentHour?: number;
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
    const currentHour =
      typeof body.currentHour === "number" && Number.isFinite(body.currentHour)
        ? body.currentHour
        : new Date().getHours();
    const systemPrompt = [
      isFinalMode
        ? "You write Korean end-of-day health habit coaching for the app Naeil Health."
        : "You write Korean in-progress health habit coaching feedback for the app Naeil Health.",
      `Use this coach style: ${coachToneMap[coachId]}.`,
      `Current local hour is ${currentHour}.`,
      "Return exactly one JSON object only. Do not include markdown or text outside JSON.",
      isFinalMode
        ? 'The response shape must be {"message":"180-260 Korean characters of end-of-day coaching. Mention one praise point from today, one weak point, and one concrete action for tomorrow. If healthCheckup values are provided, connect them to habit guidance without diagnosing."}'
        : 'The response shape must be {"message":"90-140 Korean characters of in-progress coaching. Encourage the user and suggest what they can still do today based on the current time. Do not say what to do tomorrow."}',
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
              ? `오늘 하루를 마감하는 최종 코칭입니다. 아래 기록을 바탕으로 한국어로 충분히 의미 있는 코칭을 작성해주세요. 오늘 잘한 점을 먼저 인정하고, 부족한 부분을 짚은 뒤, 내일을 위한 구체적인 행동 1가지를 제안하세요. healthCheckup 수치가 있으면 혈당, 혈압, BMI, 허리둘레, 간수치 같은 건강관리 관점과 오늘 습관을 연결하되 의료 진단처럼 말하지 마세요.\n${JSON.stringify(body)}`
              : `오늘 진행 중 코칭입니다. 현재 시간이 ${currentHour}시이므로 내일 이야기를 앞세우지 말고, 남은 오늘 시간 안에 추가로 할 수 있는 구체적인 행동을 제안하세요. 점수가 낮아도 부담을 주기보다 다시 움직이게 응원하세요.\n${JSON.stringify(body)}`,
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
