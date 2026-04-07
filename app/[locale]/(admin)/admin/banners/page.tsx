"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type AdminBanner,
  useAdminBanners,
  useCreateAdminBanner,
  useUpdateAdminBanner,
  useDeleteAdminBanner,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminBannersPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBanner | null>(null);

  const { data: res, isLoading, isError, error } = useAdminBanners({
    enabled: isAuthenticated && !authLoading,
  });
  const rows = unwrapList<AdminBanner>(res);

  const createMut = useCreateAdminBanner();
  const updateMut = useUpdateAdminBanner();
  const deleteMut = useDeleteAdminBanner();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("home");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [campaignId, setCampaignId] = useState("");

  function openCreate() {
    setEditing(null);
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    setPosition("home");
    setSortOrder(0);
    setIsActive(true);
    setCampaignId("");
    setDialogOpen(true);
  }

  function openEdit(b: AdminBanner) {
    setEditing(b);
    setTitle(b.title ?? "");
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl ?? "");
    setPosition(b.position);
    setSortOrder(b.sortOrder);
    setIsActive(b.isActive);
    setCampaignId(b.campaignId ?? "");
    setDialogOpen(true);
  }

  async function save() {
    const payload: Record<string, unknown> = {
      title: title || undefined,
      imageUrl,
      linkUrl: linkUrl || undefined,
      position,
      sortOrder,
      isActive,
      campaignId: campaignId.trim() || undefined,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  const columns: ColumnDef<AdminBanner>[] = useMemo(
    () => [
      { accessorKey: "title", header: t("colTitle") },
      {
        accessorKey: "position",
        header: t("placement"),
      },
      {
        accessorKey: "sortOrder",
        header: t("sortOrder"),
      },
      {
        accessorKey: "isActive",
        header: t("colActive"),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? t("active") : t("inactive")}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <AdminPageShell
      title={t("bannersAdmin")}
      description={t("descBannersAdmin")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("bannersAdmin") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createNew")}
        </Button>
      }
    >
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{tCommon("error")}</AlertTitle>
          <AlertDescription>
            {error instanceof ApiError ? error.toastMessage : String(error?.message ?? "Request failed")}
          </AlertDescription>
        </Alert>
      )}
      <DataTable columns={columns} data={rows} isLoading={isLoading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editItem") : t("createNew")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("colTitle")}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("optional")} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("imageUrl")} *</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("urlPlaceholder")} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("linkUrl")}</label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/campaigns/..." />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("placement")}</label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("sortOrder")}</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("campaignIdOptional")}</label>
              <Input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="UUID" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="bactive" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <label htmlFor="bactive" className="text-sm">
                {t("colActive")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={() => void save()} disabled={!imageUrl.trim()}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.title ?? deleteTarget?.imageUrl}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) void deleteMut.mutateAsync({ id: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
