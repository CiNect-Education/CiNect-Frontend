"use client";

import { useState, useMemo } from "react";
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

const movieFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
  duration: z.coerce.number().min(1, "Duration is required"),
  releaseDate: z.string().min(1, "Release date is required"),
  status: z.enum(["NOW_SHOWING", "COMING_SOON", "ENDED"]),
  ageRating: z.enum(["P", "C13", "C16", "C18"]),
  language: z.string().optional(),
  director: z.string().optional(),
});

type MovieFormValues = z.infer<typeof movieFormSchema>;

export default function AdminMoviesPage() {
  const t = useTranslations("admin");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const { data: moviesRes } = useAdminMovies();
  const movies = moviesRes?.data ?? [];
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

  function openEdit(movie: Movie) {
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
  }

  async function onSubmit(values: MovieFormValues) {
    const payload = {
      ...values,
      slug: values.title.toLowerCase().replace(/\s+/g, "-"),
      genres: [] as { id: string; name: string; slug: string }[],
      cast: [],
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

  const columns: ColumnDef<Movie>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="bg-muted rounded px-2 py-0.5 text-xs">
            {row.original.status.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "genres",
        header: "Genres",
        cell: ({ row }) => row.original.genres?.map((g) => g.name).join(", ") || "—",
      },
      {
        accessorKey: "releaseDate",
        header: "Release",
        cell: ({ row }) =>
          row.original.releaseDate ? new Date(row.original.releaseDate).toLocaleDateString() : "—",
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (row.original.rating != null ? row.original.rating.toFixed(1) : "—"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
              aria-label="Edit movie"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label="Delete movie"
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <AdminPageShell
      title={t("movies")}
      description="Manage movie catalog, add new releases, and update movie information."
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("movies") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Movie
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={movies}
        searchKey="title"
        searchPlaceholder="Search movies..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMovie ? "Edit Movie" : "Add Movie"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description" />
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
                    <FormLabel>Poster URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
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
                      <FormLabel>Duration (min)</FormLabel>
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
                      <FormLabel>Release Date</FormLabel>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NOW_SHOWING">Now Showing</SelectItem>
                          <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                          <SelectItem value="ENDED">Ended</SelectItem>
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
                      <FormLabel>Age Rating</FormLabel>
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
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Vietnamese" />
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
                    <FormLabel>Director</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingMovie ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
