/**
 * Auto-detect which backend is running (Spring on 8081 or NestJS on 3001).
 *
 * If NEXT_PUBLIC_API_BASE_URL is explicitly set, that value is used directly.
 * Otherwise we probe candidates. **Spring is listed first** so a typical local setup
 * (`mvn spring-boot:run` only) talks to the right API without accidentally hitting
 * a stale Nest URL from localStorage.
 */

const CANDIDATES = ["http://localhost:8081/api/v1", "http://localhost:3001/api/v1"];

/** Prefer Spring for SSR / first paint before `discoverApiBaseUrl` runs (matches dual-backend rule). */
const DEFAULT_URL = CANDIDATES[0];

let cachedUrl: string | null = null;
/** Bump when discovery rules change so old cached hosts are never reused blindly. */
const STORAGE_KEY = "cinect.apiBaseUrl.v3";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

async function probeUrl(baseUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.ok) return baseUrl;
    throw new Error(`Non-OK status: ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverApiBaseUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    cachedUrl = envUrl;
    return cachedUrl;
  }

  if (!isBrowser()) {
    return DEFAULT_URL;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      await probeUrl(stored);
      cachedUrl = stored;
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Discovery] Reusing healthy backend: ${cachedUrl}`);
      }
      return cachedUrl;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    cachedUrl = await Promise.any(CANDIDATES.map(probeUrl));
  } catch {
    cachedUrl = DEFAULT_URL;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, cachedUrl);
  } catch {
    // ignore storage errors
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[API Discovery] Using backend: ${cachedUrl}`);
  }

  return cachedUrl;
}

/**
 * Synchronous getter for use after discovery has completed.
 * Returns the cached URL or the env/default value.
 */
export function getApiBaseUrl(): string {
  if (cachedUrl) return cachedUrl;
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;
  return DEFAULT_URL;
}
