import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { userSchema, authResponseSchema } from "@/lib/schemas/auth";
import type { User } from "@/types/domain";
import type { LoginInput, RegisterInput } from "@/lib/schemas/auth";
import { setAccessToken, setRefreshToken, clearTokens, hasToken } from "@/lib/auth-storage";

// ─── Queries ───────────────────────────────────────────────────────

export function useCurrentUser(apiReady = true) {
  return useApiQuery<User>(["auth", "me"], "/auth/me", undefined, {
    schema: userSchema,
    enabled: apiReady && hasToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ─── Mutations ─────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();

  return useApiMutation<
    { user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } },
    LoginInput
  >("post", "/auth/login", {
    schema: authResponseSchema,
    successMessage: "Login successful",
    onSuccess: (res) => {
      const { user, tokens } = res.data;
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      queryClient.setQueryData(["auth", "me"], { data: user, timestamp: new Date().toISOString() });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useApiMutation<
    { user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } },
    RegisterInput
  >("post", "/auth/register", {
    schema: authResponseSchema,
    successMessage: "Registration successful",
    onSuccess: (res) => {
      const { user, tokens } = res.data;
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      queryClient.setQueryData(["auth", "me"], { data: user, timestamp: new Date().toISOString() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useApiMutation<void>("post", "/auth/logout", {
    onSuccess: () => {
      clearTokens();
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useApiMutation<void, { email: string }>("post", "/auth/forgot-password", {
    successMessage: "Password reset email sent",
  });
}

export function useResetPassword() {
  return useApiMutation<void, { token: string; password: string; confirmPassword: string }>(
    "post",
    "/auth/reset-password",
    { successMessage: "Password reset successfully" }
  );
}

// ─── Token Refresh ──────────────────────────────────────────────

export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useApiMutation<
    { accessToken: string; refreshToken: string; expiresIn: number },
    { refreshToken: string }
  >("post", "/auth/refresh", {
    onSuccess: (res) => {
      const { accessToken, refreshToken } = res.data;
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

// ─── Profile update ────────────────────────────────────────────────

type UpdateProfileInput = {
  fullName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useApiMutation<User, UpdateProfileInput>("put", "/auth/profile", {
    schema: userSchema,
    successMessage: "Profile updated",
    onSuccess: (res) => {
      const user = res.data;
      queryClient.setQueryData(["auth", "me"], {
        data: user,
        timestamp: new Date().toISOString(),
      });
    },
  });
}
