import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const downloads = "C:/Users/PC/Downloads";
const outputRoot = path.resolve("public/avatars/outfits");

const sheets = [
  ["portrait", "3d", "male", "3D형 남성 상반신 의상.png"],
  ["portrait", "3d", "female", "3D형 여성 상반신 의상.png"],
  ["portrait", "emotional", "male", "감성형 남성 상반신 의상.png"],
  ["portrait", "emotional", "female", "감성형 여성 상반신 의상.png"],
  ["portrait", "webtoon", "male", "웹툰형 남성 상반신 의상.png"],
  ["portrait", "webtoon", "female", "웹툰형 여성 상반신 의상.png"],
  ["portrait", "senior", "male", "시니어형 남성 상반신 의상.png"],
  ["portrait", "senior", "female", "시니어형 여성 상반신 의상.png"],
  ["fullbody", "3d", "male", "3D 남성 전신 의상.png"],
  ["fullbody", "3d", "female", "3D형 여성 전신 의상.png"],
  ["fullbody", "emotional", "male", "감성형 남성 전신 의상.png"],
  ["fullbody", "emotional", "female", "감성형 여성 전신 의상.png"],
  ["fullbody", "webtoon", "male", "웹툰형 남성 전신 의상.png"],
  ["fullbody", "webtoon", "female", "웹툰형 여성 전신 의상.png"],
  ["fullbody", "senior", "male", "시니어 남성 전신 의상.png"],
  ["fullbody", "senior", "female", "시니어형 여성 전신 의상.png"],
];

const outfits = [
  ["workout", 0, 0],
  ["casual1", 1, 0],
  ["casual2", 0, 1],
  ["suit", 1, 1],
];

for (const [viewMode, style, gender, filename] of sheets) {
  const input = path.join(downloads, filename);
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Invalid image: ${filename}`);

  const halfWidth = Math.floor(metadata.width / 2);
  const halfHeight = Math.floor(metadata.height / 2);
  const outputDir = path.join(outputRoot, viewMode);
  await fs.mkdir(outputDir, { recursive: true });

  for (const [outfit, column, row] of outfits) {
    const left = column === 0 ? 0 : halfWidth + 1;
    const top = row === 0 ? 0 : halfHeight + 1;
    const width = column === 0 ? halfWidth - 1 : metadata.width - left - 1;
    const height = row === 0 ? halfHeight - 1 : metadata.height - top - 1;
    const output = path.join(outputDir, `avatar-${style}-${gender}-${outfit}.webp`);

    console.log(`${filename} -> ${path.basename(output)}`);
    await sharp(input)
      .extract({ left, top, width, height })
      .resize({ width: viewMode === "fullbody" ? 720 : 640, withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 })
      .toFile(output);
  }
}

console.log(`Created ${sheets.length * outfits.length} outfit assets in ${outputRoot}`);
