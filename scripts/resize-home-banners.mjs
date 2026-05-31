/**
 * Normalize home banners to Cinestar slider size: 1920×578 (~3.32:1).
 * Smart center crop via sharp (AI assets are 1536×1024).
 *
 * Usage: node scripts/resize-home-banners.mjs [sourceDir]
 */
import { copyFile, readdir, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/** Matches cinestar.com.vn bannerslider (1920×578, 1920×570, …) */
export const BANNER_WIDTH = 1920;
export const BANNER_HEIGHT = 578;

const sourceDir = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(process.cwd(), "public", "media", "banners");
const dir = join(process.cwd(), "public", "media", "banners");

const map = {
  "cinect-banner-booking-cinestar.png": "cinect-banner-booking.png",
  "cinect-banner-hero-cinestar.png": "cinect-banner-hero.png",
  "cinect-banner-movies-cinestar.png": "cinect-banner-movies.png",
  "cinect-banner-promo-cinestar.png": "cinect-banner-promo.png",
  "cinect-banner-premium-cinestar.png": "cinect-banner-premium.png",
};

async function processFile(inputPath, outputName) {
  const output = join(dir, outputName);
  const tmp = join(dir, `.resize-${outputName}`);
  const meta = await sharp(inputPath).metadata();

  await sharp(inputPath)
    .resize(BANNER_WIDTH, BANNER_HEIGHT, {
      fit: "cover",
      position: sharp.strategy.attention,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(tmp);

  try {
    await unlink(output);
  } catch {
    /* missing */
  }
  await rename(tmp, output);
  console.log(
    `${outputName}: ${meta.width}x${meta.height} -> ${BANNER_WIDTH}x${BANNER_HEIGHT}`,
  );
}

const entries = await readdir(sourceDir);
const cinestarSources = entries.filter((f) => f.includes("-cinestar.png"));

if (cinestarSources.length > 0) {
  for (const src of cinestarSources) {
    const out = map[src];
    if (out) await processFile(join(sourceDir, src), out);
  }
} else {
  const files = entries.filter(
    (f) => f.startsWith("cinect-banner-") && f.endsWith(".png"),
  );
  for (const file of files) {
    await processFile(join(sourceDir, file), file);
  }
}

console.log(`Done — Cinestar banner size ${BANNER_WIDTH}×${BANNER_HEIGHT}.`);
