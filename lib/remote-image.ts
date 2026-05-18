/** Hosts allowed in next.config.mjs `images.remotePatterns` — keep in sync. */
const OPTIMIZED_REMOTE_HOSTS: Array<string | RegExp> = [
  "placehold.co",
  "image.tmdb.org",
  "m.media-amazon.com",
  /\.supabase\.co$/i,
  "images.unsplash.com",
  "i.ytimg.com",
  "cinestar.com.vn",
  "upload.wikimedia.org",
  "maps.googleapis.com",
  "lh3.googleusercontent.com",
];

export const REMOTE_IMAGE_FALLBACK =
  "https://placehold.co/600x900/1e293b/94a3b8?text=CiNect";

function hostMatchesPattern(hostname: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) return pattern.test(hostname);
  return hostname === pattern || hostname.endsWith(`.${pattern}`);
}

function isAllowedRemoteHost(hostname: string): boolean {
  return OPTIMIZED_REMOTE_HOSTS.some((pattern) =>
    hostMatchesPattern(hostname, pattern),
  );
}

/** Amazon OMDB URLs contain `@._V1_` — Next.js optimizer often fails on them. */
function isAmazonCdnUrl(src: string): boolean {
  return /media-amazon\.com/i.test(src) || src.includes("@._V1_");
}

/** Wikipedia blocks Next.js image optimizer (server fetch → 403). */
function isWikimediaUrl(src: string): boolean {
  return /wikimedia\.org/i.test(src);
}

/** Use `unoptimized` — load remote URLs directly in the browser (avoids optimizer 403s). */
export function remoteImageUnoptimized(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return false;
  if (src.startsWith("data:")) return true;
  if (/\.svg(\?|#|$)/i.test(src)) return true;
  if (isAmazonCdnUrl(src)) return true;
  if (isWikimediaUrl(src)) return true;
  if (src.includes("placehold.co")) return true;
  if (src.includes("images.unsplash.com")) return true;
  if (src.includes("maps.googleapis.com")) return true;

  try {
    const url = new URL(src);
    if (url.protocol !== "https:" && url.protocol !== "http:") return true;
    return !isAllowedRemoteHost(url.hostname);
  } catch {
    return true;
  }
}

/** Encode `@` in Amazon CDN paths so browsers load posters reliably. */
export function normalizeRemoteImageSrc(src: string): string {
  if (!src) return src;
  if (/media-amazon\.com/i.test(src) && src.includes("@")) {
    return src.replace(/@/g, "%40");
  }
  return src;
}

export function isUsableImageUrl(src: string | null | undefined): boolean {
  if (!src?.trim()) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
