import { deflateSync } from "node:zlib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_GENERATION_TOTAL_LIMIT = Number.MAX_SAFE_INTEGER;

const likenessPrompts = {
  soft:
    "Very subtle reference: only add a very light hint of the user's hairstyle direction and eyewear shape. Keep the original avatar face fully dominant.",
  balanced:
    "Balanced reference: reflect the user's hairstyle silhouette and glasses shape moderately, but do not change the avatar's face shape, eyes, nose, mouth, jaw, skin texture, or expression.",
  strong:
    "Strong style reference: make the hairstyle and eyewear feel more inspired by the user, but still preserve the original avatar's facial structure and all facial features.",
} as const;

type LikenessLevel = keyof typeof likenessPrompts;
type ParsedImage = { bytes: Buffer; type: string };
type ImageDimensions = { width: number; height: number };

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
      return `이미지 생성 요청이 거절됐어요. ${apiMessage}`;
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

function getPngDimensions(bytes: Buffer): ImageDimensions | null {
  const isPng =
    bytes.length > 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;

  if (!isPng) return null;

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function getJpegDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const isStartOfFrame =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isStartOfFrame) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }

    const length = bytes.readUInt16BE(offset + 2);
    offset += 2 + length;
  }

  return null;
}

function getImageDimensions(image: ParsedImage): ImageDimensions {
  return getPngDimensions(image.bytes) || getJpegDimensions(image.bytes) || { width: 1024, height: 1536 };
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
}

const CRC_TABLE = createCrcTable();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);

  return Buffer.concat([length, typeBytes, data, checksum]);
}

function createFaceMaskPng(width: number, height: number) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const isSquare = Math.abs(width / height - 1) < 0.08;
  const centerX = width * 0.5;
  const centerY = height * (isSquare ? 0.33 : 0.24);
  const radiusX = width * (isSquare ? 0.18 : 0.14);
  const radiusY = height * (isSquare ? 0.16 : 0.09);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;

    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const normalizedX = (x - centerX) / radiusX;
      const normalizedY = (y - centerY) / radiusY;
      const distance = normalizedX * normalizedX + normalizedY * normalizedY;
      const alpha = distance <= 0.82 ? 0 : distance >= 1.05 ? 255 : Math.round(((distance - 0.82) / 0.23) * 255);

      raw[offset] = 255;
      raw[offset + 1] = 255;
      raw[offset + 2] = 255;
      raw[offset + 3] = alpha;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    createPngChunk("IHDR", ihdr),
    createPngChunk("IDAT", deflateSync(raw)),
    createPngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI 아바타 생성 설정이 필요합니다. Vercel에 OPENAI_API_KEY를 등록해주세요." },
        { status: 503 },
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
    const charmDirection =
      body.templateGender === "male"
        ? "Make the edited face naturally handsome, warm, trustworthy, and healthy-looking."
        : body.templateGender === "female"
          ? "Make the edited face naturally beautiful, warm, trustworthy, and healthy-looking."
          : "Make the edited face naturally attractive, warm, trustworthy, and healthy-looking.";

    const prompt = [
      templateImage
        ? "Edit the FIRST image, which is the fixed avatar template. Use the SECOND image only as the user's face identity reference."
        : "Use the uploaded person's face as identity reference.",
      templateImage
        ? "A transparent mask is provided. Only the transparent masked upper-face, glasses, and hairline area may change. Preserve every pixel outside the mask as much as possible."
        : "Create a polished health-hero avatar with a stable portrait composition.",
      templateImage
        ? "Do not redraw the body, clothing, shoulders, hands, background, lighting, framing, camera distance, or app-safe empty space."
        : "Only regenerate the face and nearby hair details enough to reflect the user naturally.",
      "Keep the original avatar character's illustration style and atmosphere 100% intact.",
      "From the user photo, reference only the glasses shape and hairstyle feeling. Do not copy the user's face.",
      "Do not change the original avatar's face shape, facial features, eyes, nose, mouth, jawline, skin texture, expression, body size, or head size.",
      "Do not zoom in, do not crop the head or body, do not create a new close-up portrait, and do not replace the template with a new character.",
      "Keep the original template's face angle, head size, eye line, neck position, shoulder position, and body position.",
      likenessPrompts[likenessLevel],
      charmDirection,
      `Template style: ${body.templateStyle || "health avatar"}, template gender: ${body.templateGender || "unspecified"}.`,
      "The result should look like the same selected wellness avatar template with only small style elements added, not a newly generated person.",
      "Preserve the template illustration style and blend skin tone, shadows, and lighting so the edit does not look pasted on.",
      "Warm Korean wellness app aesthetic, natural proportions, refined character illustration, clean face, no captions, no UI text, no watermark.",
    ].join(" ");

    const formData = new FormData();
    formData.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");

    if (templateImage) {
      const templateDimensions = getImageDimensions(templateImage);
      const maskBytes = createFaceMaskPng(templateDimensions.width, templateDimensions.height);

      formData.append("image[]", new Blob([templateImage.bytes], { type: templateImage.type }), "avatar-template.png");
      formData.append("image[]", new Blob([userImage.bytes], { type: userImage.type }), "user-reference.jpg");
      formData.append("mask", new Blob([maskBytes], { type: "image/png" }), "face-mask.png");
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
        { status: response.status >= 400 && response.status < 500 ? 400 : 502 },
      );
    }

    return NextResponse.json({ imageData: `data:image/jpeg;base64,${result.data[0].b64_json}` });
  } catch (error) {
    console.error("Avatar generation error", error);
    return NextResponse.json({ error: "AI 아바타 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
