import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import type { ApiEnvelope, QueryParams } from "@/types/api";
import type { ZodType, ZodTypeDef } from "zod";

interface UseApiQueryOptions<T>
  extends Omit<UseQueryOptions<ApiEnvelope<T>, ApiError>, "queryKey" | "queryFn"> {
  /** Zod schema to validate the response `data` field at runtime. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: ZodType<T, ZodTypeDef, any>;
}

/**
 * Thin wrapper around TanStack useQuery that calls apiClient.get
 * and optionally validates the response envelope with a zod schema.
 */
export function useApiQuery<T>(
  key: string[],
  path: string,
  params?: QueryParams,
  options?: UseApiQueryOptions<T>
) {
  const { schema, ...queryOptions } = options ?? {};

  const requestOpts: RequestOptions | undefined = schema
    ? { schema }
    : undefined;

  return useQuery<ApiEnvelope<T>, ApiError>({
    queryKey: key,
    queryFn: ({ signal }) =>
      apiClient.get<T>(path, params, { ...requestOpts, signal }),
    ...queryOptions,
  });
}
