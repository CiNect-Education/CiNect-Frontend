"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { User } from "@/types/domain";
import { setAccessToken, setRefreshToken, clearTokens, hasToken } from "@/lib/auth-storage";
import { initApiClient } from "@/lib/api-client";
import { useCurrentUser, useLogin, useRegister, useLogout } from "@/hooks/queries/use-auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User | null>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const tToast = useTranslations("toast");
  const queryClient = useQueryClient();
  const [apiReady, setApiReady] = useState(false);

  // Fetch current user only after API discovery completes
  const { data: userEnvelope, isLoading: userQueryLoading, refetch } = useCurrentUser(apiReady);
  const user: User | null = userEnvelope?.data ?? null;

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  /** Avoid flash redirect on hard refresh: query is disabled until apiReady + hasToken. */
  const authBootstrapping = !apiReady;
  const resolvingSession = apiReady && hasToken() && userQueryLoading;
  const isLoading = authBootstrapping || resolvingSession;
  const isAuthenticated = !!user && !isLoading;

  // Auto-detect active backend on mount, then signal ready and refetch API data
  // so the first request is not stuck on a stale default host.
  useEffect(() => {
    initApiClient().then(() => {
      setApiReady(true);
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey[0];
          return k === "admin" || k === "auth";
        },
      });
    });
  }, [queryClient]);

  // Auto-logout on 401 errors - listen to query errors
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === "updated" && event.query.state.error) {
        const error = event.query.state.error as unknown;
        const key = event.query.queryKey;
        const isAuthMeQuery = Array.isArray(key) && key[0] === "auth" && key[1] === "me";
        const status =
          error && typeof error === "object" && "status" in error
            ? (error as { status?: unknown }).status
            : undefined;
        if (isAuthMeQuery && status === 401) {
          clearTokens();
          queryClient.setQueryData(["auth", "me"], null);
          router.push("/login");
        }
      }
    });
    return unsubscribe;
  }, [queryClient, router]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      try {
        const response = await loginMutation.mutateAsync(credentials);
        // response is ApiEnvelope<{ user, tokens }>
        const { tokens } = response.data;
        setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          setRefreshToken(tokens.refreshToken);
        }
        const userResult = await refetch();
        toast.success(tToast("welcomeBack"));
        return userResult.data?.data ?? null;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : tToast("loginFailed");
        toast.error(message);
        throw error;
      }
    },
    [loginMutation, refetch, tToast]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      confirmPassword: string;
      fullName: string;
      phone: string;
    }) => {
      try {
        await registerMutation.mutateAsync(data);
        toast.success(tToast("accountCreated"));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : tToast("registerFailed");
        toast.error(message);
        throw error;
      }
    },
    [registerMutation, tToast]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync(undefined);
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      toast.success(tToast("loggedOut"));
      router.push("/");
    }
  }, [logoutMutation, queryClient, router, tToast]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refetchUser: refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
