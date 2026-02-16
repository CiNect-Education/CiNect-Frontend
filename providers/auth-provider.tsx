'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '@/types/domain';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth-storage';
import { initApiClient } from '@/lib/api-client';
import { useCurrentUser, useLogin, useRegister, useLogout } from '@/hooks/queries/use-auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiReady, setApiReady] = useState(false);

  // Fetch current user only after API discovery completes
  const { data: userEnvelope, isLoading, refetch } = useCurrentUser(apiReady);
  const user: User | null = userEnvelope?.data ?? null;

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const isAuthenticated = !!user && !isLoading;

  // Auto-detect active backend on mount, then signal ready
  useEffect(() => {
    initApiClient().then(() => setApiReady(true));
  }, []);

  // Auto-logout on 401 errors - listen to query errors
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.error) {
        const error = event.query.state.error as any;
        if (error?.status === 401) {
          clearTokens();
          queryClient.setQueryData(['auth', 'me'], null);
          router.push('/login');
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
        await refetch();
        toast.success('Welcome back!');
      } catch (error: any) {
        toast.error(error?.message || 'Login failed');
        throw error;
      }
    },
    [loginMutation, refetch]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      confirmPassword: string;
      fullName: string;
      phone?: string;
    }) => {
      try {
        const response = await registerMutation.mutateAsync(data);
        const { tokens } = response.data;
        setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          setRefreshToken(tokens.refreshToken);
        }
        await refetch();
        toast.success('Account created successfully!');
      } catch (error: any) {
        toast.error(error?.message || 'Registration failed');
        throw error;
      }
    },
    [registerMutation, refetch]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync(undefined);
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/');
    }
  }, [logoutMutation, queryClient, router]);

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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
