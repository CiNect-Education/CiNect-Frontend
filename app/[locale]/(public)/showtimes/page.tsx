"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useShowtimes } from "@/hooks/queries/use-cinemas";
import { useCinemas } from "@/hooks/queries/use-cinemas";
import { Calendar, MapPin, Clock, Film, Ticket } from "lucide-react";
import type { Showtime } from "@/types/domain";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Keep consistent with Header/SettingsPanel storage.
const CITY_STORAGE_KEY = "selected_city";
const FORMATS = ["2D", "3D", "IMAX", "4DX", "DOLBY"] as const;
const TIME_RANGES = [
  { value: "morning", label: "Morning", start: 6, end: 12 },
  { value: "afternoon", label: "Afternoon", start: 12, end: 18 },
  { value: "evening", label: "Evening", start: 18, end: 24 },
] as const;

const CITY_OPTIONS = [
  { id: "hcm", label: "Ho Chi Minh" },
  { id: "hn", label: "Hanoi" },
  { id: "dn", label: "Da Nang" },
  { id: "ct", label: "Can Tho" },
] as const;

const ALL = "__ALL__";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function ShowtimesPage() {
  const t = useTranslations("showtimes");
  const searchParams = useSearchParams();
  const router = useRouter();

  const cityFromParams = searchParams.get("city") || "";
  const dateFromParams = searchParams.get("date") || "";
  const cinemaId = searchParams.get("cinema") || "";
  const movieId = searchParams.get("movie") || "";
  const format = searchParams.get("format") || "";
  const timeRange = searchParams.get("timeRange") || "";
  const language = searchParams.get("language") || "";

  const [storedCity, setStoredCity] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredCity(localStorage.getItem(CITY_STORAGE_KEY) || "");
    }
  }, []);

  const city = cityFromParams || storedCity;
  const today = new Date();
  const date = dateFromParams || today.toISOString().split("T")[0];
  const next7Days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (date) params.date = date;
  if (cinemaId) params.cinema = cinemaId;
  if (format) params.format = format;
  if (timeRange) params.timeRange = timeRange;
  if (language) params.language = language;

  const { data: showtimesRes, isLoading, error, refetch } = useShowtimes(params);
  const { data: cinemasRes } = useCinemas({ city: city || undefined });

  const showtimes = toList<Showtime & { cinemaName?: string }>(showtimesRes?.data ?? showtimesRes);
  const cinemas = toList<import("@/types/domain").CinemaListItem>(cinemasRes?.data ?? cinemasRes);

  function setCity(c: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(CITY_STORAGE_KEY, c);
    }
    const p = new URLSearchParams(searchParams.toString());
    if (c) p.set("city", c);
    else p.delete("city");
    router.push(`?${p.toString()}`);
  }

  function setDate(d: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("date", d);
    router.push(`?${p.toString()}`);
  }

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`?${p.toString()}`);
  }

  const cityLabel = useMemo(() => {
    if (!city) return "";
    const match = CITY_OPTIONS.find((c) => c.id === city);
    return match?.label ?? city;
  }, [city]);

  const filteredShowtimes = showtimes.filter((st) => {
    if (movieId && st.movieId !== movieId) return false;
    if (!timeRange) return true;
    const tr = TIME_RANGES.find((r) => r.value === timeRange);
    if (!tr) return true;
    const hour = new Date(st.startTime).getHours();
    return hour >= tr.start && hour < tr.end;
  });

  const groupedByCinema = filteredShowtimes.reduce<
    Record<string, (Showtime & { cinemaName?: string })[]>
  >((acc, st) => {
    const name = st.cinemaName ?? "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push(st);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") || "Showtimes"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Showtimes" }]}
      />

      {/* Sticky filter bar */}
      <div className="cinect-glass sticky top-0 z-10 mb-6 rounded-xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {CITY_OPTIONS.map((c) => (
              <Button
                key={c.id}
                variant={city === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCity(c.id)}
                className="gap-1.5"
              >
                <MapPin className="h-4 w-4" />
                {c.label}
              </Button>
            ))}

            <Select value={city || ALL} onValueChange={(v) => setCity(v === ALL ? "" : v)}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All cities</SelectItem>
                {CITY_OPTIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm">
            {cityLabel ? `Showing cinemas in ${cityLabel}` : "Browse showtimes across cities"}
          </div>
        </div>

        {movieId && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
            <div className="text-muted-foreground text-sm">
              Filtering by selected movie.
            </div>
            <Button size="sm" variant="outline" onClick={() => setFilter("movie", "")}>
              Clear movie filter
            </Button>
          </div>
        )}

        <Separator className="my-4" />

      {/* Date Strip */}
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">Date</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
          {next7Days.map((d) => {
            const dateStr = d.toISOString().split("T")[0];
            const isToday =
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear();
            return (
              <Button
                key={dateStr}
                variant={date === dateStr ? "default" : "outline"}
                size="sm"
                onClick={() => setDate(dateStr)}
                className="shrink-0"
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                {isToday
                  ? "Today"
                  : d.getDate() === today.getDate() + 1
                    ? "Tomorrow"
                    : d.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
              </Button>
            );
          })}
          </div>
        </div>

      {/* Filters */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Select value={cinemaId || ALL} onValueChange={(v) => setFilter("cinema", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All cinemas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All cinemas</SelectItem>
              {cinemas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format || ALL} onValueChange={(v) => setFilter("format", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All formats</SelectItem>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange || ALL} onValueChange={(v) => setFilter("timeRange", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All day</SelectItem>
              {TIME_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Language (e.g. Vietnamese)"
            value={language}
            onChange={(e) => setFilter("language", e.target.value)}
          />
        </div>
      </div>

      {/* Showtime List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : Object.keys(groupedByCinema).length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="mb-2 font-medium">No showtimes found</p>
          <p className="text-muted-foreground text-sm">Try a different date, city, or filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCinema).map(([cinemaName, sts]) => (
            <Card key={cinemaName} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-muted/20 flex items-center justify-between gap-4 border-b px-5 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-primary h-5 w-5" />
                    <div>
                      <div className="text-base font-semibold">{cinemaName}</div>
                      <div className="text-muted-foreground text-xs">
                        {sts.length} showtime{sts.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {sts.map((st) => {
                    const timeLabel = new Date(st.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={st.id}
                        className="group flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="bg-muted relative h-20 w-14 shrink-0 overflow-hidden rounded-md">
                            {st.moviePosterUrl ? (
                              <Image
                                src={st.moviePosterUrl}
                                alt={st.movieTitle || "Movie"}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Film className="text-muted-foreground h-6 w-6" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold sm:text-base">
                              {st.movieTitle || "Movie"}
                            </div>
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                              {st.format && <Badge variant="outline">{st.format}</Badge>}
                              {st.memberExclusive && (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  Member Exclusive
                                </Badge>
                              )}
                              {st.language && <span>{st.language}</span>}
                              {st.roomName && <span>• {st.roomName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <Badge variant="secondary" className="bg-secondary/60">
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            {timeLabel}
                          </Badge>

                          {st.basePrice > 0 && (
                            <div className="text-sm font-semibold tabular-nums">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(st.basePrice)}
                            </div>
                          )}

                          <Button asChild className="ml-auto sm:ml-0">
                            <Link href={`/booking/${st.id}`}>
                              <Ticket className="mr-2 h-4 w-4" />
                              Select seats
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
