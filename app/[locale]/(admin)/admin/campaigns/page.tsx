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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type AdminCampaign,
  useAdminCampaigns,
  useCreateAdminCampaign,
  useUpdateAdminCampaign,
  useDeleteAdminCampaign,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminCampaignsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCampaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCampaign | null>(null);

  const { data: res, isLoading, isError, error } = useAdminCampaigns({
    enabled: isAuthenticated && !authLoading,
  });
  const rows = unwrapList<AdminCampaign>(res);

  const createMut = useCreateAdminCampaign();
  const updateMut = useUpdateAdminCampaign();
  const deleteMut = useDeleteAdminCampaign();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setContent("");
    setImageUrl("");
    const d = new Date();
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(new Date(d.getTime() + 86400000 * 30).toISOString().slice(0, 10));
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(c: AdminCampaign) {
    setEditing(c);
    setTitle(c.title);
    setSlug(c.slug);
    setDescription(c.description ?? "");
    setContent(c.content ?? "");
    setImageUrl(c.imageUrl ?? "");
    setStartDate(c.startDate?.slice(0, 10) ?? "");
    setEndDate(c.endDate?.slice(0, 10) ?? "");
    setIsActive(c.isActive);
    setDialogOpen(true);
  }

  async function save() {
    const payload = {
      title,
      slug,
      description: description || undefined,
      content: content || undefined,
      imageUrl: imageUrl || undefined,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      isActive,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  const columns: ColumnDef<AdminCampaign>[] = useMemo(
    () => [
      { accessorKey: "title", header: t("colTitle") },
      { accessorKey: "slug", header: t("colSlug") },
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
      title={t("campaignsAdmin")}
      description={t("descCampaignsAdmin")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("campaignsAdmin") }]}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("editItem") : t("createNew")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("colTitle")}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("colSlug")}</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("briefDescription")}</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("contentLabel")}</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("imageUrl")}</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("urlPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">{t("dateFrom")}</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">{t("dateTo")}</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <label htmlFor="active" className="text-sm">
                {t("colActive")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={() => void save()} disabled={!title.trim() || !slug.trim() || !startDate || !endDate}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) void deleteMut.mutateAsync({ id: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              {t("deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
