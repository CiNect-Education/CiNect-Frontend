'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import type { UserRole } from '@/types/domain';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Redirects to /login if not authenticated
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = encodeURIComponent(pathname);
      router.push(`/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="container mx-auto max-w-4xl py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  children: React.ReactNode;
  roles: UserRole[];
}

/**
 * Shows 403 Forbidden if user lacks required role
 */
export function RequireRole({ children, roles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasRole = user && roles.includes(user.role);

  if (!hasRole) {
    return (
      <div className="container mx-auto max-w-2xl py-16">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Access Denied
                </h2>
                <p className="text-muted-foreground mb-6">
                  You don&apos;t have permission to access this page.
                  <br />
                  Required role: {roles.join(' or ')}
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
                <Button asChild>
                  <Link href="/account/profile">My Account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Combined guard: RequireAuth + RequireRole
 */
export function RequireAuthAndRole({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  return (
    <RequireAuth>
      <RequireRole roles={roles}>{children}</RequireRole>
    </RequireAuth>
  );
}
