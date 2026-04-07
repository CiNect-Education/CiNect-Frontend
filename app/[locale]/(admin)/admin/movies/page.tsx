"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { Movie } from "@/types/domain";
import {
  useAdminMovies,
  useCreateMovie,
  useUpdateMovie,
  useDeleteMovie,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";

type MovieFormValues = {
  title: string;
  description?: string;
  posterUrl?: string;
  duration: number;
  releaseDate: string;
  status: "NOW_SHOWING" | "COMING_SOON" | "ENDED";
  ageRating: "P" | "C13" | "C16" | "C18";
  language?: string;
  director?: string;
};

const DEFAULT_POSTER = "https://placehold.co/600x900/png?text=CiNect+Poster";

export default function AdminMoviesPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const movieFormSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("validation.titleRequired")),
        description: z.string().optional(),
        posterUrl: z.string().url().optional().or(z.literal("")),
        duration: z.coerce.number().min(1, t("validation.durationRequired")),
        releaseDate: z.string().min(1, t("validation.releaseDateRequired")),
        status: z.enum(["NOW_SHOWING", "COMING_SOON", "ENDED"]),
        ageRating: z.enum(["P", "C13", "C16", "C18"]),
        language: z.string().optional(),
        director: z.string().optional(),
      }),
    [t]
  );

  const { data: moviesRes, isLoading: moviesLoading } = useAdminMovies();
  const movies = unwrapList<Movie>(moviesRes?.data ?? moviesRes);
  const createMutation = useCreateMovie();
  const updateMutation = useUpdateMovie();
  const deleteMutation = useDeleteMovie();

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: "",
      description: "",
      posterUrl: "",
      duration: 90,
      releaseDate: "",
      status: "NOW_SHOWING",
      ageRating: "P",
      language: "",
      director: "",
    },
  });

  function openCreate() {
    setEditingMovie(null);
    form.reset({
      title: "",
      description: "",
      posterUrl: "",
      duration: 90,
      releaseDate: new Date().toISOString().slice(0, 10),
      status: "NOW_SHOWING",
      ageRating: "P",
      language: "Vietnamese",
      director: "",
    });
    setDialogOpen(true);
  }

  const openEdit = useCallback(
    (movie: Movie) => {
      setEditingMovie(movie);
      form.reset({
        title: movie.title,
        description: movie.description ?? "",
        posterUrl: movie.posterUrl ?? "",
        duration: movie.duration,
        releaseDate: movie.releaseDate.slice(0, 10),
        status: movie.status,
        ageRating: movie.ageRating,
        language: movie.language ?? "",
        director: movie.director ?? "",
      });
      setDialogOpen(true);
    },
    [form]
  );

  async function onSubmit(values: MovieFormValues) {
    const payload = {
      title: values.title,
      slug: values.title.toLowerCase().replace(/\s+/g, "-"),
      description: values.description?.trim() || t("noDescriptionDefault"),
      posterUrl: values.posterUrl || DEFAULT_POSTER,
      duration: values.duration,
      releaseDate: values.releaseDate,
      status: values.status,
      ageRating: values.ageRating,
      language: values.language,
      director: values.director?.trim() || "—",
      castMembers: [] as string[],
      genreIds: [] as string[],
    };
    if (editingMovie) {
      await updateMutation.mutateAsync({ ...payload, id: editingMovie.id });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  }

  const dash = t("dashEm");

  const columns: ColumnDef<Movie>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: t("colTitle"),
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: ({ row }) => {
          const s = row.original.status;
          const label =
            s === "NOW_SHOWING"
              ? t("movieStatusNowShowing")
              : s === "COMING_SOON"
                ? t("movieStatusComingSoon")
                : t("movieStatusEnded");
          return <span className="bg-muted rounded px-2 py-0.5 text-xs">{label}</span>;
        },
      },
      {
        accessorKey: "genres",
        header: t("colGenres"),
        cell: ({ row }) => row.original.genres?.map((g) => g.name).join(", ") || dash,
      },
      {
        accessorKey: "releaseDate",
        header: t("colRelease"),
        cell: ({ row }) =>
          row.original.releaseDate
            ? new Date(row.original.releaseDate).toLocaleDateString()
            : dash,
      },
      {
        accessorKey: "rating",
        header: t("colRating"),
        cell: ({ row }) => (row.original.rating != null ? row.original.rating.toFixed(1) : dash),
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
              aria-label={t("ariaEditMovie")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeleteMovie")}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, openEdit, dash]
  );

  return (
    <AdminPageShell
      title={t("movies")}
      description={t("descMovies")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("movies") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addMovie")}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={movies}
        searchKey="title"
        searchPlaceholder={t("searchMovies")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={moviesLoading}
        emptyMessage={t("emptyMovies")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{editingMovie ? t("editMovie") : t("addMovie")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colTitle")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelDescription")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("briefDescription")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="posterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelPosterUrl")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("urlPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelDurationMin")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="releaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelReleaseDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colStatus")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NOW_SHOWING">{t("movieStatusNowShowing")}</SelectItem>
                          <SelectItem value="COMING_SOON">{t("movieStatusComingSoon")}</SelectItem>
                          <SelectItem value="ENDED">{t("movieStatusEnded")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelAgeRating")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="P">P</SelectItem>
                          <SelectItem value="C13">C13</SelectItem>
                          <SelectItem value="C16">C16</SelectItem>
                          <SelectItem value="C18">C18</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelLanguage")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("languageExampleAdmin")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="director"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelDirector")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingMovie ? tCommon("save") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteMovie")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t("deleteMovieConfirm", { title: deleteTarget.title })
                : t("confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
