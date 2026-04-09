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
import { unwrapList } from "@/lib/admin-data";
import { useAuth } from "@/providers/auth-provider";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_CINEMAS_VALUE = "__ALL_CINEMAS__";

type RawShowtime = Partial<Showtime> & {
  movie?: { title?: string; posterUrl?: string };
  cinema?: { name?: string };
  room?: { name?: string };
};

function normalizeShowtime(raw: RawShowtime): Showtime {
  return {
    id: String(raw.id ?? ""),
    movieId: String(raw.movieId ?? ""),
    roomId: String(raw.roomId ?? ""),
    cinemaId: String(raw.cinemaId ?? ""),
    startTime: String(raw.startTime ?? ""),
    endTime: String(raw.endTime ?? raw.startTime ?? ""),
    basePrice: Number(raw.basePrice ?? 0),
    format: (raw.format ?? "2D") as Showtime["format"],
    language: raw.language,
    subtitles: raw.subtitles,
    movieTitle: raw.movieTitle ?? raw.movie?.title,
    moviePosterUrl: raw.moviePosterUrl ?? raw.movie?.posterUrl,
    cinemaName: raw.cinemaName ?? raw.cinema?.name,
    roomName: raw.roomName ?? raw.room?.name,
    availableSeats: raw.availableSeats,
    totalSeats: raw.totalSeats,
    memberExclusive: raw.memberExclusive,
  };
}

type ShowtimeFormValues = {
  movieId: string;
  cinemaId: string;
  roomId: string;
  startTime: string;
  basePrice: number;
  format: "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
};

function toDateTimeLocalValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function roundUpToFiveMinutes(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const mins = rounded.getMinutes();
  const next = mins % 5 === 0 ? mins : mins + (5 - (mins % 5));
  rounded.setMinutes(next);
  return rounded;
}

function getMinFutureStartTimeLocal(): string {
  // Keep a buffer so newly-created showtimes are always in the future.
  const nowWithBuffer = new Date(Date.now() + 30 * 60 * 1000);
  return toDateTimeLocalValue(roundUpToFiveMinutes(nowWithBuffer));
}

function getMinutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export default function AdminShowtimesPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  const {
    data: showtimesRes,
    isLoading: showtimesLoading,
    error: showtimesError,
    refetch: refetchShowtimes,
  } = useAdminShowtimes(params, { enabled: isAuthenticated && !authLoading });
  const { data: moviesRes } = useAdminMovies();
  const {
    data: cinemasRes,
    isLoading: cinemasLoading,
    error: cinemasError,
    refetch: refetchCinemas,
  } = useAdminCinemas(undefined, { enabled: isAuthenticated && !authLoading });
  const {
    data: roomsRes,
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useAdminRooms(cinemaFilter ? { cinemaId: cinemaFilter } : undefined, {
    enabled: isAuthenticated && !authLoading,
  });

  const showtimesRaw = unwrapList<RawShowtime>(showtimesRes?.data ?? showtimesRes);
  const showtimes = useMemo(() => showtimesRaw.map(normalizeShowtime), [showtimesRaw]);
  const movies = unwrapList<{ id: string; title: string }>(moviesRes?.data ?? moviesRes);
  const cinemas = unwrapList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);
  const rooms = unwrapList<{
    id: string;
    name: string;
    format: string;
    cinemaName?: string;
    cinemaId?: string;
    /** Nest Prisma shape: nested cinema */
    cinema?: { id?: string; name?: string };
  }>(roomsRes?.data ?? roomsRes);

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

  const selectedCinemaId = form.watch("cinemaId");

  const availableRooms = useMemo(
    () =>
      rooms.filter((r) => {
        const cid = r.cinemaId ?? r.cinema?.id;
        return !selectedCinemaId || !cid || cid === selectedCinemaId;
      }),
    [rooms, selectedCinemaId]
  );

  const cinemaNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cinemas) m.set(c.id, c.name);
    return m;
  }, [cinemas]);

  const roomsByRoom = useMemo(() => {
    const map = new Map<string, Showtime[]>();
    const filtered = showtimes.filter((s) => {
      if (cinemaFilter && s.cinemaId !== cinemaFilter) return false;
      if (dateFilter) {
        const d = s.startTime ? s.startTime.slice(0, 10) : "";
        if (d !== dateFilter) return false;
      }
      return true;
    });
    for (const s of filtered) {
      const list = map.get(s.roomId) ?? [];
      list.push(s);
      map.set(s.roomId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => getMinutesOfDay(a.startTime) - getMinutesOfDay(b.startTime));
    }
    return map;
  }, [showtimes, cinemaFilter, dateFilter]);

  function openCreate() {
    setConflictError(null);
    setConflictIds(new Set());
    setEditingShowtime(null);
    const minFutureLocal = getMinFutureStartTimeLocal();
    const datePreferredLocal = dateFilter ? `${dateFilter}T10:00` : "";
    const startLocal =
      datePreferredLocal && datePreferredLocal > minFutureLocal
        ? datePreferredLocal
        : minFutureLocal;
    form.reset({
      movieId: "",
      cinemaId: cinemaFilter || "",
      roomId: "",
      startTime: startLocal,
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
      {(showtimesError || cinemasError || roomsError) ? (
        <ApiErrorState
          error={(showtimesError ?? cinemasError ?? roomsError) as Error}
          onRetry={() => {
            void refetchCinemas();
            void refetchRooms();
            void refetchShowtimes();
          }}
          className="py-10"
        />
      ) : null}
      <div className="cinect-glass mb-6 flex flex-wrap gap-3 rounded-lg border p-4">
        <Select
          value={cinemaFilter || ALL_CINEMAS_VALUE}
          onValueChange={(v) => setCinemaFilter(v === ALL_CINEMAS_VALUE ? "" : v)}
          disabled={authLoading || !isAuthenticated || cinemasLoading}
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={
                cinemasLoading ? tCommon("loading") : t("cinemaFilterPlaceholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CINEMAS_VALUE}>{t("allCinemasFilter")}</SelectItem>
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
          disabled={authLoading || !isAuthenticated}
        />
      </div>

      <div className="space-y-6">
        {(showtimesLoading || roomsLoading) && !showtimesError && !roomsError ? (
          <div className="cinect-glass rounded-lg border p-4">
            <Skeleton className="mb-3 h-5 w-64" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-44" />
              ))}
            </div>
          </div>
        ) : null}
        {rooms.map((room) => {
          const roomShowtimes = roomsByRoom.get(room.id) ?? [];
          const cinemaLabel =
            room.cinemaName ??
            room.cinema?.name ??
            (room.cinemaId ? cinemaNameById.get(room.cinemaId) : undefined) ??
            roomShowtimes.find((s) => s.cinemaName)?.cinemaName ??
            room.cinemaId;
          return (
            <div key={room.id} className="cinect-glass rounded-lg border p-4">
              <div className="mb-3 font-medium">
                {cinemaLabel} — {room.name} ({room.format})
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
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("roomId", "");
                      }}
                      value={field.value}
                      disabled={cinemasLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCinema")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cinemasLoading ? (
                          <div className="p-2">
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ) : null}
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
                        {roomsLoading ? (
                          <div className="p-2">
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ) : null}
                        {availableRooms.map((r) => (
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
                        <Input type="datetime-local" min={getMinFutureStartTimeLocal()} {...field} />
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
