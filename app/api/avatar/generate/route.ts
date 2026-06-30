import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_GENERATION_TOTAL_LIMIT = 3;
const likenessPrompts = {
  soft: "Subtle likeness: preserve the template character face mostly, and only gently reflect the user's hairstyle, eyewear, age impression, and overall mood.",
  balanced: "Balanced likeness: blend the user's facial traits with the template character so it feels like the user, while still clearly remaining the app's health avatar.",
  strong: "Strong likeness: reflect the user's face shape, eyes, nose, mouth, hairstyle, eyewear, and facial identity more strongly, while still preserving the template pose and layout.",
} as const;

type LikenessLevel = keyof typeof likenessPrompts;

function getAvatarGenerationErrorMessage(status: number, apiMessage?: string) {
  const normalizedMessage = apiMessage?.toLowerCase() || "";

  if (status === 401 || status === 403) {
    return "OpenAI API 키 또는 이미지 생성 권한을 확인해주세요.";
  }

  if (
    status === 429 ||
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("billing") ||
    normalizedMessage.includes("credit")
  ) {
    return "OpenAI 이미지 생성 한도 또는 크레딧을 확인해주세요.";
  }

  if (status === 400) {
    if (apiMessage) {
      return `이미지 생성 요청이 거절됐어요: ${apiMessage}`;
    }

    return "사진 또는 아바타 템플릿을 이미지 API가 처리하지 못했어요. 다른 JPG/PNG 사진으로 다시 시도해주세요.";
  }

  return "AI 아바타 생성 서버 응답이 불안정해요. 잠시 후 다시 시도해주세요.";
}

function parseImageData(value?: string) {
  const match = value?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) return null;

  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > 8 * 1024 * 1024) return null;

  return { bytes, type: match[1] };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI 아바타 생성 설정이 필요합니다. Vercel에 OPENAI_API_KEY를 등록해주세요." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      imageData?: string;
      templateImageData?: string;
      likenessLevel?: LikenessLevel;
      templateStyle?: string;
      templateGender?: string;
      generationCount?: number;
    };
    const userImage = parseImageData(body.imageData);
    const templateImage = parseImageData(body.templateImageData);
    if (!userImage) {
      return NextResponse.json({ error: "지원되는 얼굴 사진을 다시 선택해주세요." }, { status: 400 });
    }
    if (typeof body.generationCount === "number" && body.generationCount >= AVATAR_GENERATION_TOTAL_LIMIT) {
      return NextResponse.json({ error: "AI 건강이 생성 가능 횟수를 모두 사용했습니다." }, { status: 429 });
    }
    const likenessLevel = body.likenessLevel && body.likenessLevel in likenessPrompts ? body.likenessLevel : "balanced";

    const prompt = [
      templateImage
        ? "Use the first image as the user's face identity reference and the second image as the fixed avatar template."
        : "Use the uploaded person's face as identity reference.",
      templateImage
        ? "Keep the template avatar's body, clothing, background, framing, composition, pose, camera angle, and safe layout almost exactly the same."
        : "Create a polished health-hero avatar with a stable portrait composition.",
      "Only regenerate the face and nearby hair details enough to reflect the user naturally.",
      likenessPrompts[likenessLevel],
      `Template style: ${body.templateStyle || "health avatar"}, template gender: ${body.templateGender || "unspecified"}.`,
      "Do not change the green wellness app atmosphere, mint outfit tone, or UI-safe body position.",
      "Warm, trustworthy Korean wellness app aesthetic, natural proportions, highly refined character illustration, realistic 3D volume but not photorealistic.",
      "Clean face, no captions, no UI text, no watermark, no medical symbols.",
    ].join(" ");

    const formData = new FormData();
    formData.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
    if (templateImage) {
      formData.append("image[]", new Blob([userImage.bytes], { type: userImage.type }), "user-reference.jpg");
      formData.append("image[]", new Blob([templateImage.bytes], { type: templateImage.type }), "avatar-template.jpg");
    } else {
      formData.append("image", new Blob([userImage.bytes], { type: userImage.type }), "avatar-reference.jpg");
    }
    formData.append("prompt", prompt);
    formData.append("size", "1024x1536");
    formData.append("quality", "medium");
    formData.append("input_fidelity", "high");
    formData.append("output_format", "jpeg");
    formData.append("output_compression", "82");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    const result = (await response.json()) as {
      data?: Array<{ b64_json?: string }>;
      error?: { message?: string };
    };

    if (!response.ok || !result.data?.[0]?.b64_json) {
      console.error("Avatar generation failed", {
        status: response.status,
        message: result.error?.message,
      });
      return NextResponse.json(
        { error: getAvatarGenerationErrorMessage(response.status, result.error?.message) },
        { status: response.status >= 400 && response.status < 500 ? 400 : 502 }
      );
    }

    return NextResponse.json({ imageData: `data:image/jpeg;base64,${result.data[0].b64_json}` });
  } catch (error) {
    console.error("Avatar generation error", error);
    return NextResponse.json({ error: "AI 아바타 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
