"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import type { Showtime } from "@/types/domain";
import {
  useAdminShowtimes,
  useAdminMovies,
  useAdminCinemas,
  useAdminRooms,
  useCreateShowtime,
  useUpdateShowtime,
  useDeleteShowtime,
} from "@/hooks/queries/use-admin";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ShowtimeFormValues = {
  movieId: string;
  cinemaId: string;
  roomId: string;
  startTime: string;
  basePrice: number;
  format: "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
};

function getMinutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export default function AdminShowtimesPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [cinemaFilter, setCinemaFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Showtime | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictIds, setConflictIds] = useState<Set<string>>(new Set());

  const params = useMemo(
    () => ({
      cinemaId: cinemaFilter || undefined,
      date: dateFilter || undefined,
    }),
    [cinemaFilter, dateFilter]
  );

  const { data: showtimesRes } = useAdminShowtimes(params);
  const { data: moviesRes } = useAdminMovies();
  const { data: cinemasRes } = useAdminCinemas();
  const { data: roomsRes } = useAdminRooms(cinemaFilter ? { cinemaId: cinemaFilter } : undefined);

  const showtimesRaw = showtimesRes?.data;
  const showtimes = useMemo(() => showtimesRaw ?? [], [showtimesRaw]);
  const movies = moviesRes?.data ?? [];
  const cinemas = cinemasRes?.data ?? [];
  const rooms = roomsRes?.data ?? [];

  const createMutation = useCreateShowtime();
  const updateMutation = useUpdateShowtime();
  const deleteMutation = useDeleteShowtime();

  const showtimeFormSchema = useMemo(
    () =>
      z.object({
        movieId: z.string().min(1, t("validation.movieRequired")),
        cinemaId: z.string().min(1, t("validation.cinemaRequired")),
        roomId: z.string().min(1, t("validation.roomRequired")),
        startTime: z.string().min(1, t("validation.startTimeRequired")),
        basePrice: z.coerce.number().min(0),
        format: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
      }),
    [t]
  );

  const form = useForm<ShowtimeFormValues>({
    resolver: zodResolver(showtimeFormSchema),
    defaultValues: {
      movieId: "",
      cinemaId: "",
      roomId: "",
      startTime: "",
      basePrice: 0,
      format: "2D",
    },
  });

  const roomsByRoom = useMemo(() => {
    const map = new Map<string, Showtime[]>();
    for (const s of showtimes) {
      const list = map.get(s.roomId) ?? [];
      list.push(s);
      map.set(s.roomId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => getMinutesOfDay(a.startTime) - getMinutesOfDay(b.startTime));
    }
    return map;
  }, [showtimes]);

  function openCreate() {
    setConflictError(null);
    setConflictIds(new Set());
    setEditingShowtime(null);
    const start = dateFilter
      ? `${dateFilter}T10:00:00`
      : new Date().toISOString().slice(0, 10) + "T10:00:00";
    form.reset({
      movieId: "",
      cinemaId: cinemaFilter || "",
      roomId: "",
      startTime: start.slice(0, 16),
      basePrice: 80000,
      format: "2D",
    });
    setDialogOpen(true);
  }

  function openEdit(st: Showtime) {
    setConflictError(null);
    setConflictIds(new Set());
    setEditingShowtime(st);
    form.reset({
      movieId: st.movieId,
      cinemaId: st.cinemaId,
      roomId: st.roomId,
      startTime: st.startTime.slice(0, 16),
      basePrice: st.basePrice,
      format: st.format,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: ShowtimeFormValues) {
    setConflictError(null);
    setConflictIds(new Set());
    const startIso = new Date(values.startTime).toISOString();
    const endIso = new Date(new Date(values.startTime).getTime() + 120 * 60 * 1000).toISOString();
    const payload = {
      ...values,
      startTime: startIso,
      endTime: endIso,
    };
    try {
      if (editingShowtime) {
        await updateMutation.mutateAsync({ ...payload, id: editingShowtime.id });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictError(err.message || t("showtimeOverlap"));
        const details = err.details as { overlappingIds?: string[] } | undefined;
        if (details?.overlappingIds) {
          setConflictIds(new Set(details.overlappingIds));
        }
      }
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  }

  return (
    <AdminPageShell
      title={t("showtimes")}
      description={t("descShowtimes")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("showtimes") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addShowtime")}
        </Button>
      }
    >
      <div className="cinect-glass mb-6 flex flex-wrap gap-3 rounded-lg border p-4">
        <Select
          value={cinemaFilter || "all"}
          onValueChange={(v) => setCinemaFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("cinemaFilterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCinemasFilter")}</SelectItem>
            {cinemas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-6">
        {rooms.map((room) => {
          const roomShowtimes = roomsByRoom.get(room.id) ?? [];
          return (
            <div key={room.id} className="cinect-glass rounded-lg border p-4">
              <div className="mb-3 font-medium">
                {room.cinemaName ?? room.cinemaId} — {room.name} ({room.format})
              </div>
              <div className="flex flex-wrap gap-2">
                {roomShowtimes.map((st) => (
                  <div
                    key={st.id}
                    className={cn(
                      "flex items-center gap-2 rounded border px-3 py-2 text-sm",
                      conflictIds.has(st.id)
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                    )}
                  >
                    <span>
                      {st.movieTitle ?? st.movieId} • {format(parseISO(st.startTime), "HH:mm")}–
                      {format(parseISO(st.endTime), "HH:mm")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(st)}
                      aria-label={t("ariaEditShowtime")}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(st)}
                      aria-label={t("ariaDeleteShowtime")}
                    >
                      <Trash2 className="text-destructive h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {roomShowtimes.length === 0 && (
                  <span className="text-muted-foreground">{t("noShowtimes")}</span>
                )}
              </div>
            </div>
          );
        })}
        {rooms.length === 0 && (
          <div className="cinect-glass text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed">
            {t("showtimesSelectCinemaHint")}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{editingShowtime ? t("editShowtime") : t("addShowtime")}</DialogTitle>
          </DialogHeader>
          {conflictError && (
            <div className="bg-destructive/10 text-destructive rounded p-3 text-sm">
              {conflictError}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="movieId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelMovie")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectMovie")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {movies.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cinemaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cinema")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCinema")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cinemas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelRoomShort")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectRoom")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} ({r.format})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelStart")}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("basePriceVnd")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelFormat")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["2D", "3D", "IMAX", "4DX", "DOLBY"].map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {editingShowtime ? tCommon("save") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteShowtime")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteShowtimeConfirm")}</AlertDialogDescription>
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
