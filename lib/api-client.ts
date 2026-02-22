import type { ZodType, ZodTypeDef } from "zod";
import type { ApiEnvelope, ApiErrorPayload, QueryParams } from "@/types/api";
import { apiEnvelopeSchema } from "@/lib/schemas/envelope";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "@/lib/auth-storage";
import { discoverApiBaseUrl, getApiBaseUrl } from "@/lib/api-discovery";

// ─── Config ────────────────────────────────────────────────────────

let API_BASE_URL = getApiBaseUrl();

/** Call once on app startup to auto-detect the active backend. */
export async function initApiClient(): Promise<void> {
  API_BASE_URL = await discoverApiBaseUrl();
}

// ─── ApiError class ────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string[]> | unknown;
  requestId?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }

  /** Human-friendly message suitable for a toast. */
  get toastMessage(): string {
    switch (this.status) {
      case 401:
        return "Please log in to continue.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 422:
        return this.message || "Validation failed. Please check your input.";
      case 429:
        return "Too many requests. Please slow down.";
      default:
        if (this.status >= 500) return "A server error occurred. Please try again later.";
        return this.message || "An unexpected error occurred.";
    }
  }
}

// ─── CSRF Token ────────────────────────────────────────────────────

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta?.getAttribute("content")) return meta.getAttribute("content");
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

// ─── Token refresh (raw fetch, no 401 retry) ────────────────────────

async function doRefresh(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const url = `${API_BASE_URL}/auth/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError({
      status: err.status ?? res.status,
      message: err.message ?? "Token refresh failed",
    });
  }
  const json = await res.json();
  const data = json.data ?? json;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn ?? 0,
  };
}

// ─── Core request ──────────────────────────────────────────────────

export interface RequestOptions {
  /** Zod schema to validate the `data` field in the response envelope. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: ZodType<any, ZodTypeDef, any>;
  /** Extra headers merged on top of defaults. */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Skip JSON body parsing (e.g. for 204 responses). */
  raw?: boolean;
  /** Skip 401 token refresh retry (used internally for refresh endpoint). */
  skipAuthRetry?: boolean;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<ApiEnvelope<T>> {
  const requestId = uuid();
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-request-id": requestId,
    ...opts?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (isMutating) {
    const csrf = getCsrfToken();
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  }

  const url = buildUrl(path);

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts?.signal,
  });

  // ── Handle 401 with token refresh ───────────────────────────────
  if (response.status === 401 && !opts?.skipAuthRetry) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
    } else {
      try {
        const refreshed = await doRefresh(refreshToken);
        setAccessToken(refreshed.accessToken);
        setRefreshToken(refreshed.refreshToken);
        // Retry original request with new token
        return request<T>(method, path, body, { ...opts, skipAuthRetry: true });
      } catch {
        clearTokens();
      }
    }
  }

  // ── Handle non-2xx ─────────────────────────────────────────────
  if (!response.ok) {
    let payload: Partial<ApiErrorPayload> = {};
    try {
      const json = await response.json();
      payload = {
        status: json.status ?? response.status,
        code: json.code ?? json.error,
        message: json.message ?? response.statusText,
        details: json.details ?? json.errors,
      };
    } catch {
      payload = {
        status: response.status,
        message: response.statusText || "An unknown error occurred",
      };
    }
    if (response.status === 429 && typeof window !== "undefined") {
      const retryAfter = response.headers.get("Retry-After");
      let seconds = 60;
      if (retryAfter) {
        const n = parseInt(retryAfter, 10);
        seconds = Number.isNaN(n) ? 60 : n;
      }
      window.dispatchEvent(new CustomEvent("api:429", { detail: { retryAfter: seconds } }));
    }
    throw new ApiError({
      status: payload.status ?? response.status,
      code: payload.code,
      message: payload.message ?? "An unknown error occurred",
      details: payload.details,
      requestId,
    });
  }

  // ── Handle 204 No Content ──────────────────────────────────────
  if (response.status === 204 || opts?.raw) {
    return { data: undefined as T, timestamp: new Date().toISOString() };
  }

  // ── Parse JSON ─────────────────────────────────────────────────
  const json = await response.json();

  // ── Validate with zod schema if provided ───────────────────────
  if (opts?.schema) {
    const envelopeResult = apiEnvelopeSchema(opts.schema).safeParse(json);
    if (!envelopeResult.success) {
      // In development, log the full validation error
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[ApiClient] Response validation failed for ${method} ${path}:`,
          envelopeResult.error.flatten()
        );
      }
      // Still return the raw data -- strict validation is opt-in
      // but we log so devs can catch contract drift early
    }
  }

  return json as ApiEnvelope<T>;
}

// ─── Public API ────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, params?: QueryParams, opts?: RequestOptions) {
    // For GET we embed params in the URL, not the body
    const url = params ? buildUrlWithParams(path, params) : path;
    return request<T>("GET", url, undefined, opts);
  },

  post<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>("POST", path, body, opts);
  },

  put<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>("PUT", path, body, opts);
  },

  patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>("PATCH", path, body, opts);
  },

  delete<T>(path: string, opts?: RequestOptions) {
    return request<T>("DELETE", path, undefined, opts);
  },
};

/**
 * Builds only the path portion with query params (no base URL prefix).
 * The base URL is prepended inside `request()`.
 */
function buildUrlWithParams(path: string, params: QueryParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  }
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}
