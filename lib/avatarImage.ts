export async function createIllustratedAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일을 선택해주세요.");
  if (file.size > 8 * 1024 * 1024) throw new Error("사진은 8MB 이하로 선택해주세요.");

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("사진을 불러오지 못했습니다."));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("사진 변환을 지원하지 않는 브라우저입니다.");

    const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - cropSize) / 2;
    const sourceY = (image.naturalHeight - cropSize) / 2;

    context.filter = "saturate(1.2) contrast(1.08) brightness(1.04)";
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, size, size);
    context.filter = "none";

    const pixels = context.getImageData(0, 0, size, size);
    const levels = 24;
    for (let index = 0; index < pixels.data.length; index += 4) {
      pixels.data[index] = Math.round(pixels.data[index] / levels) * levels;
      pixels.data[index + 1] = Math.round(pixels.data[index + 1] / levels) * levels;
      pixels.data[index + 2] = Math.round(pixels.data[index + 2] / levels) * levels;
    }
    context.putImageData(pixels, 0, 0);

    const glow = context.createLinearGradient(0, 0, size, size);
    glow.addColorStop(0, "rgba(234,247,239,0.16)");
    glow.addColorStop(1, "rgba(76,175,106,0.08)");
    context.fillStyle = glow;
    context.fillRect(0, 0, size, size);

    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
