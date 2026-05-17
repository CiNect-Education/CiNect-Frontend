/**
 * Strip backgrounds from brand PNGs and regenerate favicon / PWA icons (transparent).
 * Run: npm run brand:logos
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandDir = join(__dirname, "../public/brand");
const publicDir = join(__dirname, "../public");
const iconsDir = join(publicDir, "icons");

/** Neutral dark backdrop → transparent (keeps saturated logo colors). */
function alphaForDarkBg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;

  if (spread > 50) return 255;
  if (max > 105) return 255;
  if (max <= 58 && spread <= 34) return 0;
  if (max <= 58) return 0;
  return Math.round(((max - 58) / (100 - 58)) * 255);
}

/** Neutral light backdrop → transparent. */
function alphaForLightBg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;

  if (spread > 40) return 255;
  if (min < 215) return 255;

  const t0 = 248;
  const t1 = 200;
  if (min >= t0) return 0;
  return Math.round(((min - t1) / (t0 - t1)) * 255);
}

async function processFile(filename, mode) {
  const input = join(brandDir, filename);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const existing = data[i + 3];
    const computed = mode === "dark" ? alphaForDarkBg(r, g, b) : alphaForLightBg(r, g, b);
    data[i + 3] = Math.min(existing, computed);
  }

  const tmp = `${input}.tmp.png`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(tmp);

  const { renameSync } = await import("fs");
  renameSync(tmp, input);

  console.log(`OK ${filename} (${info.width}x${info.height}, ${mode})`);
}

/** Favicon / PWA icons from transparent dark mark (trim + square contain). */
async function generateAppIcons() {
  const source = join(brandDir, "cinect-logo-dark.png");
  const trimmed = await sharp(source).trim().png().toBuffer();

  mkdirSync(iconsDir, { recursive: true });

  const outputs = [
    { path: join(publicDir, "favicon.png"), size: 32 },
    { path: join(publicDir, "favicon-48.png"), size: 48 },
    { path: join(iconsDir, "icon-192.png"), size: 192 },
    { path: join(iconsDir, "icon-512.png"), size: 512 },
  ];

  for (const { path, size } of outputs) {
    await sharp(trimmed)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(path);
    console.log(`OK ${path.replace(publicDir, "public")} (${size}x${size})`);
  }
}

await processFile("cinect-logo-dark.png", "dark");
await processFile("cinect-logo.png", "dark");
await processFile("cinect-logo-light.png", "light");
await generateAppIcons();
