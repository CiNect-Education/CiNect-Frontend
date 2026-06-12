import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

/**
 * Factory that creates a QueryClient with cinema-app defaults.
 * Called once per component tree (inside a useState initializer)
 * to avoid recreating on every render.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnMount: false,
        // Retry up to 2 times, but skip retries for 4xx errors
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
        // Don't refetch when the window regains focus (noisy for cinema UX)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never auto-retry mutations
        retry: false,
      },
    },
  });
}
