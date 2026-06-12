import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { ZodType, ZodTypeDef } from "zod";
import { toast } from "sonner";

interface UseApiMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<ApiEnvelope<TData>, ApiError, TVariables>,
  "mutationFn"
> {
  /** Toast message shown on success. */
  successMessage?: string;
  /** Show success toast when `successMessage` is set. Default: true. */
  showSuccessToast?: boolean;
  /** Show API error toast on failure. Default: true. Set false when the caller shows a localized toast. */
  showErrorToast?: boolean;
  /** Zod schema to validate the response. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: ZodType<TData, ZodTypeDef, any>;
  /** Query keys to invalidate on success. */
  invalidateKeys?: string[][];
}

/**
 * Thin wrapper around TanStack useMutation that calls apiClient[method]
 * and automatically shows success/error toasts.
 */
export function useApiMutation<TData, TVariables = unknown>(
  method: "post" | "put" | "patch" | "delete",
  path: string | ((variables: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const {
    successMessage,
    showSuccessToast,
    showErrorToast = true,
    schema,
    invalidateKeys,
    ...mutationOptions
  } = options ?? {};
  const shouldShowSuccessToast = showSuccessToast ?? !!successMessage;

  const requestOpts: RequestOptions | undefined = schema ? { schema } : undefined;

  return useMutation<ApiEnvelope<TData>, ApiError, TVariables>({
    mutationFn: (variables) => {
      const resolvedPath = typeof path === "function" ? path(variables) : path;

      if (method === "delete") {
        return apiClient.delete<TData>(resolvedPath, requestOpts);
      }
      return apiClient[method]<TData>(resolvedPath, variables, requestOpts);
    },
    onSuccess: (data, variables, ctx) => {
      if (successMessage && shouldShowSuccessToast) {
        toast.success(successMessage);
      }
      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mutationOptions?.onSuccess as any)?.(data, variables, ctx);
    },
    onError: (error, variables, ctx) => {
      if (showErrorToast) {
        toast.error(error.toastMessage);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mutationOptions?.onError as any)?.(error, variables, ctx);
    },
    ...mutationOptions,
  });
}
