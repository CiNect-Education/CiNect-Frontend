"use client";

import { useEffect, useState } from "react";
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

const CITY_STORAGE_KEY = "cinect_selected_city";
const FORMATS = ["2D", "3D", "IMAX", "4DX", "DOLBY"] as const;
const TIME_RANGES = [
  { value: "morning", label: "Morning", start: 6, end: 12 },
  { value: "afternoon", label: "Afternoon", start: 12, end: 18 },
  { value: "evening", label: "Evening", start: 18, end: 24 },
] as const;

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
    p.set("city", c);
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

  const filteredShowtimes = showtimes.filter((st) => {
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

      {/* City Tabs */}
      <div className="mb-6">
        <p className="text-muted-foreground mb-2 text-sm font-medium">City</p>
        <div className="flex flex-wrap gap-2">
          {["Ho Chi Minh", "Hanoi", "Da Nang", "Can Tho"].map((c) => (
            <Button
              key={c}
              variant={city === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCity(c)}
            >
              <MapPin className="mr-1.5 h-4 w-4" />
              {c}
            </Button>
          ))}
          {cinemas.length > 0 && (
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select city...</option>
              {[...new Set(cinemas.map((c) => c.city))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Date Strip */}
      <div className="mb-6">
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
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={cinemaId}
          onChange={(e) => setFilter("cinema", e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Cinemas</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={format}
          onChange={(e) => setFilter("format", e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Formats</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={timeRange}
          onChange={(e) => setFilter("timeRange", e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Day</option>
          {TIME_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Language"
          value={language}
          onChange={(e) => setFilter("language", e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        />
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
            <Card key={cinemaName}>
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="text-primary h-5 w-5" />
                  {cinemaName}
                </h3>
                <div className="space-y-4">
                  {sts.map((st) => (
                    <div
                      key={st.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="bg-muted relative h-20 w-14 overflow-hidden rounded">
                          {st.moviePosterUrl ? (
                            <img
                              src={st.moviePosterUrl}
                              alt={st.movieTitle || "Movie"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Film className="text-muted-foreground h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{st.movieTitle || "Movie"}</h4>
                          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline">{st.format}</Badge>
                            {st.memberExclusive && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                Member Exclusive
                              </Badge>
                            )}
                            {st.language && <span>{st.language}</span>}
                            {st.roomName && <span>• {st.roomName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {new Date(st.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {st.basePrice > 0 && (
                          <span className="text-sm font-medium">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(st.basePrice)}
                          </span>
                        )}
                        <Button size="sm" asChild className="ml-auto">
                          <Link href={`/booking?showtime=${st.id}`}>
                            <Ticket className="mr-1.5 h-4 w-4" />
                            Book
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
