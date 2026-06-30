function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 불러오지 못했습니다."));
    image.src = source;
  });
}

async function renderPortrait(source: string, width: number, height: number, quality: number) {
  const image = await loadImage(source);
  const targetRatio = width / height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const cropWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const cropHeight = imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  const sourceX = (image.naturalWidth - cropWidth) / 2;
  const sourceY = Math.max(0, (image.naturalHeight - cropHeight) * 0.32);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진 처리를 지원하지 않는 브라우저입니다.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일을 불러오지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

export async function prepareAvatarSource(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일을 선택해주세요.");
  if (file.size > 8 * 1024 * 1024) throw new Error("사진은 8MB 이하로 선택해주세요.");

  const objectUrl = URL.createObjectURL(file);
  try {
    return await renderPortrait(objectUrl, 768, 1024, 0.9);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressGeneratedAvatar(imageData: string) {
  return renderPortrait(imageData, 768, 1024, 0.86);
}

export async function prepareDirectAvatarMedia(file: File, viewMode: "portrait" | "fullbody") {
  if (file.type.startsWith("image/")) {
    if (file.size > 8 * 1024 * 1024) throw new Error("이미지는 8MB 이하로 선택해주세요.");

    const objectUrl = URL.createObjectURL(file);
    try {
      return await renderPortrait(objectUrl, 768, viewMode === "portrait" ? 1024 : 1152, 0.86);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  if (file.type === "video/mp4" || file.type === "video/webm") {
    if (file.size > 3 * 1024 * 1024) throw new Error("직접 넣는 영상은 3MB 이하의 짧은 파일만 저장할 수 있어요.");
    return readAsDataUrl(file);
  }

  throw new Error("이미지 또는 짧은 mp4/webm 영상 파일을 선택해주세요.");
}
