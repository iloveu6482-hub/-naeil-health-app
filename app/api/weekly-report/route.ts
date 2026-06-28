import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type WeeklyCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";

type WeekLog = {
  date: string;
  score: number;
  sleep: number;
  diet: "good" | "normal" | "bad";
  exercise: number;
  water: number;
  noSmoking: boolean;
};

type WeeklyReportResponse = {
  weekScore: number;
  grade: "훌륭해요" | "잘하고 있어요" | "조금 더 힘내요" | "다시 시작해요";
  best: string;
  worst: string;
  message: string;
  nextWeekGoal: string;
};

const coachToneMap: Record<WeeklyCoachId, string> = {
  onyu: "천천히 또박또박 안내하는 시니어 친화형 말투",
  haru: "다정하고 따뜻하게 칭찬하는 건강 선생님 말투",
  kangtaeo: "단호하지만 현실적인 운동 코치 말투",
  rumi: "밝고 친근한 친구 같은 건강 코치 말투",
};

function isWeekLog(value: unknown): value is WeekLog {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.date === "string" &&
    typeof record.score === "number" &&
    typeof record.sleep === "number" &&
    (record.diet === "good" || record.diet === "normal" || record.diet === "bad") &&
    typeof record.exercise === "number" &&
    typeof record.water === "number" &&
    typeof record.noSmoking === "boolean"
  );
}

function isWeeklyReportResponse(value: unknown): value is WeeklyReportResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.weekScore === "number" &&
    (record.grade === "훌륭해요" ||
      record.grade === "잘하고 있어요" ||
      record.grade === "조금 더 힘내요" ||
      record.grade === "다시 시작해요") &&
    typeof record.best === "string" &&
    typeof record.worst === "string" &&
    typeof record.message === "string" &&
    typeof record.nextWeekGoal === "string"
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key is required." }, { status: 503 });
    }

    const body = (await request.json()) as {
      weekLogs?: unknown;
      coachId?: WeeklyCoachId;
      recentCheckup?: unknown;
    };

    if (!Array.isArray(body.weekLogs) || body.weekLogs.length === 0 || !body.weekLogs.every(isWeekLog)) {
      return NextResponse.json({ error: "Valid weekLogs are required." }, { status: 400 });
    }

    const coachId = body.coachId || "haru";
    const systemPrompt = [
      "You write weekly health habit reports in Korean for the app Naeil Health.",
      `Use this coach style: ${coachToneMap[coachId]}.`,
      "This is not medical diagnosis. Explain only as general health habit guidance.",
      "Return exactly one JSON object only. Do not include markdown or text outside JSON.",
      'The response shape must be {"weekScore":number,"grade":"훌륭해요 | 잘하고 있어요 | 조금 더 힘내요 | 다시 시작해요","best":"best habit item","worst":"weakest habit item","message":"100-150 Korean characters in coach style","nextWeekGoal":"one key goal for next week"}.',
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
        max_tokens: 800,
        temperature: 0.4,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Create a weekly report from this data. Answer in Korean.\n${JSON.stringify({
              weekLogs: body.weekLogs,
              coachId,
              recentCheckup: body.recentCheckup ?? null,
            })}`,
          },
        ],
      }),
    });

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("Weekly report failed", response.status, result.error?.message);
      return NextResponse.json({ error: "Weekly report failed." }, { status: 502 });
    }

    const text = result.content?.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Weekly report returned empty content." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Weekly report JSON parse failed", text);
      return NextResponse.json({ error: "Weekly report returned invalid JSON." }, { status: 502 });
    }

    if (!isWeeklyReportResponse(parsed)) {
      console.error("Weekly report schema mismatch", parsed);
      return NextResponse.json({ error: "Weekly report schema is invalid." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Weekly report error", error);
    return NextResponse.json({ error: "Weekly report error." }, { status: 500 });
  }
}
