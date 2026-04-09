"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminRoles } from "@/hooks/queries/use-admin";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { unwrapList } from "@/lib/admin-data";

const PERMISSION_ROWS = [
  ["movies.read", "permMoviesRead"],
  ["movies.write", "permMoviesWrite"],
  ["cinemas.read", "permCinemasRead"],
  ["cinemas.write", "permCinemasWrite"],
  ["rooms.read", "permRoomsRead"],
  ["rooms.write", "permRoomsWrite"],
  ["showtimes.read", "permShowtimesRead"],
  ["showtimes.write", "permShowtimesWrite"],
  ["bookings.read", "permBookingsRead"],
  ["bookings.write", "permBookingsWrite"],
  ["pricing.read", "permPricingRead"],
  ["pricing.write", "permPricingWrite"],
  ["promotions.read", "permPromotionsRead"],
  ["promotions.write", "permPromotionsWrite"],
  ["users.read", "permUsersRead"],
  ["users.write", "permUsersWrite"],
  ["reports.read", "permReportsRead"],
  ["analytics.read", "permAnalyticsRead"],
] as const;

const KNOWN_PERMISSION_KEYS = new Set(PERMISSION_ROWS.map(([key]) => key));

/** Legacy seed used colon-separated keys (e.g. movies:read); UI rows use dots (movies.read). */
function normalizePermissionsFromApi(raw: string[] | undefined): string[] {
  const out = new Set<string>();
  const legacyExpand: Record<string, string[]> = {
    "showtimes:manage": ["showtimes.read", "showtimes.write"],
  };
  for (const p of raw ?? []) {
    if (legacyExpand[p]) {
      legacyExpand[p].forEach((x) => out.add(x));
      continue;
    }
    if (p.includes(":")) {
      const dotted = p.replace(":", ".");
      if (KNOWN_PERMISSION_KEYS.has(dotted)) out.add(dotted);
      continue;
    }
    if (KNOWN_PERMISSION_KEYS.has(p)) out.add(p);
  }
  return Array.from(out);
}

export default function AdminRolesPage() {
  const t = useTranslations("admin");
  const tToast = useTranslations("toast");
  const { data, isLoading, error, refetch } = useAdminRoles();
  const roles = useMemo(() => unwrapList<{ id: string; name: string; permissions?: string[] }>(data?.data ?? data), [data]);

  /** ADMIN is full access server-side; only STAFF / USER are configurable here. */
  const manageableRoles = useMemo(
    () => roles.filter((r) => r.name === "STAFF" || r.name === "USER"),
    [roles]
  );

  const [permissionMap, setPermissionMap] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (manageableRoles.length === 0) return;
    setPermissionMap((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const map: Record<string, string[]> = {};
      manageableRoles.forEach((role) => {
        map[role.id] = normalizePermissionsFromApi(role.permissions);
      });
      return map;
    });
  }, [manageableRoles]);

  const togglePermission = (roleId: string, permission: string) => {
    setPermissionMap((prev) => {
      const current = prev[roleId] || [];
      const has = current.includes(permission);
      return {
        ...prev,
        [roleId]: has ? current.filter((p) => p !== permission) : [...current, permission],
      };
    });
  };

  const hasPermission = (roleId: string, permission: string) => {
    return (permissionMap[roleId] || []).includes(permission);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const role of manageableRoles) {
        await apiClient.put(`/admin/roles/${role.id}`, {
          permissions: permissionMap[role.id] || [],
        });
      }
      toast.success(tToast("rolesUpdated"));
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : tToast("rolesUpdateFailed");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminPageShell
        title={t("roles")}
        description={t("descRoles")}
        breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("roles") }]}
      >
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return <ApiErrorState error={error} onRetry={refetch} />;
  }

  return (
    <AdminPageShell
      title={t("roles")}
      description={t("descRoles")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("roles") }]}
      actions={
        <Button onClick={handleSave} disabled={saving || manageableRoles.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      }
    >
      <Card className="cinect-glass border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            <CardTitle>{t("permissionMatrixTitle")}</CardTitle>
          </div>
          <CardDescription>{t("permissionMatrixDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {manageableRoles.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("rolesNoManageable")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">{t("colPermission")}</th>
                    {manageableRoles.map((role) => (
                      <th key={role.id} className="px-4 py-3 text-center font-medium uppercase">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_ROWS.map(([permKey, labelKey]) => (
                    <tr key={permKey} className="hover:bg-muted/50 border-b">
                      <td className="px-4 py-3">{t(labelKey)}</td>
                      {manageableRoles.map((role) => (
                        <td key={role.id} className="px-4 py-3 text-center">
                          <Checkbox
                            checked={hasPermission(role.id, permKey)}
                            onCheckedChange={() => togglePermission(role.id, permKey)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
