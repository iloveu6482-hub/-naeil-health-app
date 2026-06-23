import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI 아바타 생성 설정이 필요합니다. Vercel에 OPENAI_API_KEY를 등록해주세요." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { imageData?: string };
    const match = body.imageData?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) {
      return NextResponse.json({ error: "지원되는 얼굴 사진을 다시 선택해주세요." }, { status: 400 });
    }

    const imageBytes = Buffer.from(match[2], "base64");
    if (imageBytes.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "사진은 8MB 이하로 선택해주세요." }, { status: 400 });
    }

    const prompt = [
      "Create a brand-new polished 3D animated health-hero avatar using the uploaded person's face as identity reference.",
      "Preserve recognizable facial structure, hairstyle, skin tone, eyewear, and friendly expression, while clearly transforming the result into a premium stylized 3D character rather than a filtered photograph.",
      "Show the character from head to upper thighs in a confident energetic pose, one fist raised gently, wearing a clean light-mint athletic zip jacket with subtle leaf-shaped branding but no readable words or logos.",
      "Use a cinematic dimensional green nature background with soft leaves, glowing light trails, depth, rim lighting, and a tasteful health-dashboard atmosphere.",
      "Warm, trustworthy Korean wellness app aesthetic, natural proportions, highly refined character illustration, realistic 3D volume but not photorealistic.",
      "Portrait composition, centered subject, clean face, no captions, no UI text, no watermark, no medical symbols.",
    ].join(" ");

    const formData = new FormData();
    formData.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
    formData.append("image", new Blob([imageBytes], { type: match[1] }), "avatar-reference.jpg");
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
      console.error("Avatar generation failed", response.status, result.error?.message);
      return NextResponse.json(
        { error: "AI 아바타를 생성하지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: response.status >= 400 && response.status < 500 ? 400 : 502 }
      );
    }

    return NextResponse.json({ imageData: `data:image/jpeg;base64,${result.data[0].b64_json}` });
  } catch (error) {
    console.error("Avatar generation error", error);
    return NextResponse.json({ error: "AI 아바타 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
