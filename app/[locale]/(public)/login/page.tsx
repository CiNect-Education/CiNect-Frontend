import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthLoginForm } from "@/components/auth/auth-login-form";
import { ClientOnly } from "@/components/system/client-only";
import { Skeleton } from "@/components/ui/skeleton";

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthPageShell activeTab="login">
      <Suspense fallback={<LoginFormFallback />}>
        <ClientOnly fallback={<LoginFormFallback />}>
          <AuthLoginForm />
        </ClientOnly>
      </Suspense>
    </AuthPageShell>
  );
}
