// ─── API Envelope ──────────────────────────────────────────────────
export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
  message?: string;
  error?: unknown;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── API Error ─────────────────────────────────────────────────────
export interface ApiErrorPayload {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, string[]> | unknown;
  requestId?: string;
}

// ─── Query Helpers ─────────────────────────────────────────────────
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
