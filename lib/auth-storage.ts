/**
 * Token storage abstraction.
 *
 * Strategy:
 *  1. When the backend sets httpOnly cookies the client never touches
 *     the token directly -- cookies are sent automatically by the browser.
 *  2. When the backend returns the token in the JSON body (e.g. SPA mode)
 *     we store it in memory first, with browser storage as a persistence layer
 *     so the token survives page refreshes.
 *  3. "Remember me" controls persistence:
 *     - checked  → localStorage (survives browser restart)
 *     - unchecked → sessionStorage (cleared when the browser session ends)
 *
 * The API client checks `getAccessToken()` and attaches the Bearer header
 * only when a token is present (= SPA mode). If the value is null the
 * browser cookie takes over transparently.
 */

const TOKEN_KEY = "cinema_access_token";
const REFRESH_KEY = "cinema_refresh_token";
const PERSISTENCE_KEY = "cinema_auth_persistence";

type AuthPersistence = "local" | "session";

let memoryToken: string | null = null;
let memoryRefresh: string | null = null;
let activePersistence: AuthPersistence | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function resolvePersistence(): AuthPersistence {
  if (activePersistence) return activePersistence;
  if (!isBrowser()) return "local";

  try {
    if (sessionStorage.getItem(TOKEN_KEY)) return "session";
    if (localStorage.getItem(TOKEN_KEY)) return "local";
    const pref = localStorage.getItem(PERSISTENCE_KEY);
    if (pref === "session" || pref === "local") return pref;
  } catch {
    /* storage blocked */
  }

  return "local";
}

function getTokenStorage(): Storage {
  return resolvePersistence() === "session" ? sessionStorage : localStorage;
}

function clearStoredTokens(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* silent */
  }
}

function writeToken(key: string, token: string): void {
  const storage = getTokenStorage();
  const other = storage === localStorage ? sessionStorage : localStorage;
  try {
    other.removeItem(key);
    storage.setItem(key, token);
  } catch {
    /* storage full / blocked */
  }
}

function readToken(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Call before saving tokens on login. OAuth defaults to persistent (local). */
export function setAuthPersistence(remember: boolean): void {
  activePersistence = remember ? "local" : "session";
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PERSISTENCE_KEY, activePersistence);
  } catch {
    /* silent */
  }
}

// ─── Access token ──────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  if (memoryToken) return memoryToken;
  return readToken(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  memoryToken = token;
  if (!isBrowser()) return;
  writeToken(TOKEN_KEY, token);
}

// ─── Refresh token ─────────────────────────────────────────────────

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  if (memoryRefresh) return memoryRefresh;
  return readToken(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  memoryRefresh = token;
  if (!isBrowser()) return;
  writeToken(REFRESH_KEY, token);
}

// ─── Clear all ─────────────────────────────────────────────────────

export function clearTokens(): void {
  memoryToken = null;
  memoryRefresh = null;
  activePersistence = null;
  clearStoredTokens();
}

export function hasToken(): boolean {
  return getAccessToken() !== null;
}
