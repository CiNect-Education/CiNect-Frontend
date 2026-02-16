/**
 * Auto-detect which backend is running (NestJS on 3001 or Spring on 8081).
 *
 * If NEXT_PUBLIC_API_BASE_URL is explicitly set, that value is used directly.
 * Otherwise, we probe both ports concurrently and use whichever responds first.
 */

const CANDIDATES = [
  "http://localhost:3001/api/v1",
  "http://localhost:8081/api/v1",
];

const DEFAULT_URL = CANDIDATES[0]; // NestJS fallback

let cachedUrl: string | null = null;

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
  // Already resolved
  if (cachedUrl) return cachedUrl;

  // Explicit env var takes priority
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    cachedUrl = envUrl;
    return cachedUrl;
  }

  // Server-side: can't probe, use default
  if (!isBrowser()) {
    return DEFAULT_URL;
  }

  try {
    // Race both ports — first healthy response wins
    cachedUrl = await Promise.any(CANDIDATES.map(probeUrl));
  } catch {
    // All probes failed — fall back to default
    cachedUrl = DEFAULT_URL;
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
