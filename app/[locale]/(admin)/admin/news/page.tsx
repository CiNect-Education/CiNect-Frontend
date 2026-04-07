"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { NewsArticle } from "@/types/domain";
import type { NewsCategory } from "@/types/domain";
import {
  useAdminNews,
  useCreateAdminNews,
  useUpdateAdminNews,
  useDeleteAdminNews,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

const CATEGORIES: NewsCategory[] = ["REVIEWS", "TRAILERS", "PROMOTIONS", "GUIDES", "GENERAL"];

export default function AdminNewsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);

  const { data: res, isLoading, isError, error } = useAdminNews(
    { page: 1, limit: 100 },
    { enabled: isAuthenticated && !authLoading }
  );
  const articles = unwrapList<NewsArticle>(res);

  const createMut = useCreateAdminNews();
  const updateMut = useUpdateAdminNews();
  const deleteMut = useDeleteAdminNews();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsCategory>("GENERAL");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [relatedStr, setRelatedStr] = useState("");
  const [publishedAt, setPublishedAt] = useState("");

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCategory("GENERAL");
    setImageUrl("");
    setAuthor("CiNect Editorial");
    setTagsStr("");
    setRelatedStr("");
    setPublishedAt(new Date().toISOString().slice(0, 16));
    setDialogOpen(true);
  }

  function openEdit(a: NewsArticle) {
    setEditing(a);
    setTitle(a.title);
    setSlug(a.slug);
    setExcerpt(a.excerpt);
    setContent(a.content);
    setCategory(a.category);
    setImageUrl(a.imageUrl ?? "");
    setAuthor(a.author);
    setTagsStr((a.tags ?? []).join(", "));
    setRelatedStr((a.relatedArticleIds ?? []).join(", "));
    setPublishedAt(a.publishedAt ? a.publishedAt.slice(0, 16) : "");
    setDialogOpen(true);
  }

  async function save() {
    const tags = tagsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const relatedArticleIds = relatedStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      title,
      slug,
      excerpt,
      content,
      category,
      imageUrl: imageUrl || undefined,
      author,
      tags,
      relatedArticleIds,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  const columns: ColumnDef<NewsArticle>[] = useMemo(
    () => [
      { accessorKey: "title", header: t("colTitle") },
      { accessorKey: "slug", header: t("colSlug") },
      {
        accessorKey: "category",
        header: t("colCategory"),
        cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
      },
      {
        accessorKey: "publishedAt",
        header: t("colPublished"),
        cell: ({ row }) => {
          try {
            return format(new Date(row.original.publishedAt), "PP");
          } catch {
            return row.original.publishedAt;
          }
        },
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
      title={t("news")}
      description={t("descNews")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("news") }]}
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
      <DataTable columns={columns} data={articles} isLoading={isLoading} />

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
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("contentLabel")}</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("colCategory")}</label>
              <Select value={category} onValueChange={(v) => setCategory(v as NewsCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("imageUrl")}</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("urlPlaceholder")} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("authorLabel")}</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("tagsComma")}</label>
              <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("relatedIdsComma")}</label>
              <Input value={relatedStr} onChange={(e) => setRelatedStr(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{t("colPublished")}</label>
              <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => void save()}
              disabled={!title.trim() || !slug.trim() || !excerpt.trim() || !content.trim() || !author.trim()}
            >
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
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
