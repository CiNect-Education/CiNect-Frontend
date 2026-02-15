/**
 * Token storage abstraction.
 *
 * Strategy:
 *  1. When the backend sets httpOnly cookies the client never touches
 *     the token directly -- cookies are sent automatically by the browser.
 *  2. When the backend returns the token in the JSON body (e.g. SPA mode)
 *     we store it in memory first, with localStorage as a persistence layer
 *     so the token survives page refreshes.
 *
 * The API client checks `getAccessToken()` and attaches the Bearer header
 * only when a token is present (= SPA mode). If the value is null the
 * browser cookie takes over transparently.
 */

const TOKEN_KEY = "cinema_access_token";
const REFRESH_KEY = "cinema_refresh_token";

let memoryToken: string | null = null;
let memoryRefresh: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ─── Access token ──────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  if (memoryToken) return memoryToken;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  memoryToken = token;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage full / blocked */
  }
}

// ─── Refresh token ─────────────────────────────────────────────────

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  if (memoryRefresh) return memoryRefresh;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  memoryRefresh = token;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    /* storage full / blocked */
  }
}

// ─── Clear all ─────────────────────────────────────────────────────

export function clearTokens(): void {
  memoryToken = null;
  memoryRefresh = null;
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* silent */
  }
}

export function hasToken(): boolean {
  return getAccessToken() !== null;
}
