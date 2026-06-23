function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function luminance(red: number, green: number, blue: number) {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

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

    const width = 384;
    const height = 512;
    const targetRatio = width / height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const cropWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
    const cropHeight = imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
    const sourceX = (image.naturalWidth - cropWidth) / 2;
    const sourceY = Math.max(0, (image.naturalHeight - cropHeight) * 0.35);

    // 먼저 작은 화면에서 부드럽게 만든 뒤 확대해 사진의 미세 질감을 줄입니다.
    const softCanvas = document.createElement("canvas");
    softCanvas.width = 128;
    softCanvas.height = 171;
    const softContext = softCanvas.getContext("2d");
    if (!softContext) throw new Error("사진 변환을 지원하지 않는 브라우저입니다.");
    softContext.filter = "blur(0.7px) saturate(1.28) contrast(1.1) brightness(1.06)";
    softContext.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, 128, 171);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("사진 변환을 지원하지 않는 브라우저입니다.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(softCanvas, 0, 0, width, height);

    const sourcePixels = context.getImageData(0, 0, width, height);
    const outputPixels = context.createImageData(width, height);
    const grayscale = new Float32Array(width * height);

    for (let index = 0, pixel = 0; index < sourcePixels.data.length; index += 4, pixel += 1) {
      grayscale[pixel] = luminance(
        sourcePixels.data[index],
        sourcePixels.data[index + 1],
        sourcePixels.data[index + 2]
      );
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixel = y * width + x;
        const index = pixel * 4;
        const red = sourcePixels.data[index];
        const green = sourcePixels.data[index + 1];
        const blue = sourcePixels.data[index + 2];
        const light = grayscale[pixel];

        // 셀 애니메이션처럼 밝기를 네 단계로 나누고 색상 수도 크게 줄입니다.
        const shade = light < 65 ? 0.72 : light < 125 ? 0.88 : light < 195 ? 1.03 : 1.13;
        const colorStep = 38;
        let cartoonRed = Math.round((red * shade) / colorStep) * colorStep;
        let cartoonGreen = Math.round((green * shade) / colorStep) * colorStep;
        let cartoonBlue = Math.round((blue * shade) / colorStep) * colorStep;

        // 건강이 브랜드의 따뜻한 민트 조명을 살짝 더합니다.
        cartoonRed = cartoonRed * 0.97 + 8;
        cartoonGreen = cartoonGreen * 1.02 + 7;
        cartoonBlue = cartoonBlue * 0.95 + 4;

        // 주변 픽셀의 명암 차이로 윤곽선을 만들어 실사 질감을 줄입니다.
        let edgeStrength = 0;
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          const topLeft = grayscale[(y - 1) * width + x - 1];
          const top = grayscale[(y - 1) * width + x];
          const topRight = grayscale[(y - 1) * width + x + 1];
          const left = grayscale[y * width + x - 1];
          const right = grayscale[y * width + x + 1];
          const bottomLeft = grayscale[(y + 1) * width + x - 1];
          const bottom = grayscale[(y + 1) * width + x];
          const bottomRight = grayscale[(y + 1) * width + x + 1];
          const gradientX = -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
          const gradientY = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
          edgeStrength = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        }

        if (edgeStrength > 82) {
          const edgeAmount = Math.min(0.72, (edgeStrength - 82) / 180);
          cartoonRed = cartoonRed * (1 - edgeAmount) + 47 * edgeAmount;
          cartoonGreen = cartoonGreen * (1 - edgeAmount) + 58 * edgeAmount;
          cartoonBlue = cartoonBlue * (1 - edgeAmount) + 50 * edgeAmount;
        }

        outputPixels.data[index] = clamp(cartoonRed);
        outputPixels.data[index + 1] = clamp(cartoonGreen);
        outputPixels.data[index + 2] = clamp(cartoonBlue);
        outputPixels.data[index + 3] = 255;
      }
    }

    context.putImageData(outputPixels, 0, 0);

    // 밝은 캐릭터 카드처럼 중앙을 살리고 가장자리는 부드럽게 정리합니다.
    const highlight = context.createRadialGradient(width * 0.5, height * 0.34, width * 0.08, width * 0.5, height * 0.5, height * 0.68);
    highlight.addColorStop(0, "rgba(255,255,255,0.14)");
    highlight.addColorStop(0.66, "rgba(234,247,239,0.04)");
    highlight.addColorStop(1, "rgba(31,90,58,0.13)");
    context.fillStyle = highlight;
    context.fillRect(0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
