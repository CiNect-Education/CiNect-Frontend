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

const PERMISSIONS = [
  { key: "movies.read", label: "Movies (Read)" },
  { key: "movies.write", label: "Movies (Write)" },
  { key: "cinemas.read", label: "Cinemas (Read)" },
  { key: "cinemas.write", label: "Cinemas (Write)" },
  { key: "rooms.read", label: "Rooms (Read)" },
  { key: "rooms.write", label: "Rooms (Write)" },
  { key: "showtimes.read", label: "Showtimes (Read)" },
  { key: "showtimes.write", label: "Showtimes (Write)" },
  { key: "bookings.read", label: "Bookings (Read)" },
  { key: "bookings.write", label: "Bookings (Write)" },
  { key: "pricing.read", label: "Pricing (Read)" },
  { key: "pricing.write", label: "Pricing (Write)" },
  { key: "promotions.read", label: "Promotions (Read)" },
  { key: "promotions.write", label: "Promotions (Write)" },
  { key: "users.read", label: "Users (Read)" },
  { key: "users.write", label: "Users (Write)" },
  { key: "reports.read", label: "Reports (Read)" },
  { key: "analytics.read", label: "Analytics (Read)" },
];

export default function AdminRolesPage() {
  const t = useTranslations("admin");
  const { data, isLoading, error, refetch } = useAdminRoles();
  const rolesRaw = data?.data;
  const roles = useMemo(() => rolesRaw ?? [], [rolesRaw]);

  const [permissionMap, setPermissionMap] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roles.length === 0) return;
    setPermissionMap((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const map: Record<string, string[]> = {};
      roles.forEach((role) => {
        map[role.id] = [...(role.permissions || [])];
      });
      return map;
    });
  }, [roles]);

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
      for (const role of roles) {
        await apiClient.put(`/admin/roles/${role.id}`, {
          permissions: permissionMap[role.id] || [],
        });
      }
      toast.success("Roles updated successfully");
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update roles";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminPageShell
        title={t("roles")}
        description="Configure permissions for each role."
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
      description="Configure permissions for each role."
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("roles") }]}
      actions={
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <Card className="cinect-glass border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            <CardTitle>Permission Matrix</CardTitle>
          </div>
          <CardDescription>
            Check/uncheck permissions for each role. ADMIN typically has full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Permission</th>
                  {roles.map((role) => (
                    <th key={role.id} className="px-4 py-3 text-center font-medium uppercase">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-muted/50 border-b">
                    <td className="px-4 py-3">{perm.label}</td>
                    {roles.map((role) => (
                      <td key={role.id} className="px-4 py-3 text-center">
                        <Checkbox
                          checked={hasPermission(role.id, perm.key)}
                          onCheckedChange={() => togglePermission(role.id, perm.key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
