"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useShowtimes, useCinemas, useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";
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
import {
  BOOKING_CITY_CHANGED_EVENT,
  SELECTED_CITY_STORAGE_KEY,
  bookingCityLabel,
  localCalendarDate,
  normalizeBookingCityId,
  persistSelectedBookingCity,
} from "@/lib/booking-region";
import { DetectRegionButton } from "@/components/shared/detect-region-button";
import { formatVnd, localizeAudioLabel, localizeRoomName } from "@/lib/showtime-display";

const FORMATS = ["2D", "3D", "IMAX", "4DX", "DOLBY"] as const;
const TIME_RANGE_DEFS = [
  { value: "morning", start: 6, end: 12, labelKey: "timeRangeMorning" as const },
  { value: "afternoon", start: 12, end: 18, labelKey: "timeRangeAfternoon" as const },
  { value: "evening", start: 18, end: 24, labelKey: "timeRangeEvening" as const },
] as const;

const ALL = "__ALL__";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

function formatDateChipLabel(date: Date, locale: string): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const weekday = date.getDay();

  if (locale.startsWith("vi")) {
    const viWeekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    return `${viWeekdays[weekday]}, ${day} thg ${month}`;
  }

  const enWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${enWeekdays[weekday]}, ${enMonths[month - 1]} ${day}`;
}

export default function ShowtimesPageClient() {
  const t = useTranslations("showtimes");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const tMembership = useTranslations("membership");
  const tCinemas = useTranslations("cinemas");
  const tShow = useTranslations("showtimeDisplay");
  const locale = useLocale();
  const timeLocaleTag = locale.startsWith("vi") ? "vi-VN" : "en-US";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();
  const [storedCity, setStoredCity] = useState("");
  const [addressMode, setAddressMode] = useState<"new" | "legacy">("new");
  const [cityQuery, setCityQuery] = useState("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityInputValue, setCityInputValue] = useState("");

  const provincesNew = useMemo(
    () => toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    [provincesRes?.data]
  );
  const provincesLegacy = useMemo(
    () =>
      toList<{
        code: string;
        nameVi: string;
        nameEn: string;
        provinceNew: { code: string; nameVi: string; nameEn: string };
      }>(legacyRes?.data),
    [legacyRes?.data]
  );
  const cityOptions = useMemo(() => {
    if (addressMode === "legacy" && provincesLegacy.length > 0) {
      return provincesLegacy.map((p) => ({
        id: p.code,
        label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
      }));
    }
    return provincesNew.map((p) => ({
      id: p.code,
      label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
    }));
  }, [addressMode, locale, provincesLegacy, provincesNew]);
  const filteredCityOptions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.label.toLowerCase().includes(q));
  }, [cityOptions, cityQuery]);

  const cityFromParams = searchParams.get("city") || "";
  const dateFromParams = searchParams.get("date") || "";
  const cinemaId = searchParams.get("cinema") || "";
  const movieId = searchParams.get("movie") || "";
  const format = searchParams.get("format") || "";
  const timeRange = searchParams.get("timeRange") || "";
  const language = searchParams.get("language") || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredCity(normalizeBookingCityId(localStorage.getItem(SELECTED_CITY_STORAGE_KEY) || ""));
    }
  }, []);

  useEffect(() => {
    function onCityChanged() {
      setStoredCity(normalizeBookingCityId(localStorage.getItem(SELECTED_CITY_STORAGE_KEY) || ""));
    }
    window.addEventListener(BOOKING_CITY_CHANGED_EVENT, onCityChanged);
    return () => window.removeEventListener(BOOKING_CITY_CHANGED_EVENT, onCityChanged);
  }, []);

  const city = normalizeBookingCityId(cityFromParams || storedCity);
  useEffect(() => {
    if (!city) return;
    if (provincesLegacy.some((p) => p.code === city)) {
      setAddressMode("legacy");
      return;
    }
    if (provincesNew.some((p) => p.code === city)) {
      setAddressMode("new");
    }
  }, [city, provincesLegacy, provincesNew]);
  const today = new Date();
  const date = dateFromParams || localCalendarDate(today);
  const next7Days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const apiParams: Record<string, string> = {};
  if (city) apiParams.city = city;
  if (date) apiParams.date = date;
  if (cinemaId) apiParams.cinemaId = cinemaId;
  if (movieId) apiParams.movieId = movieId;

  const { data: showtimesRes, isLoading, error, refetch } = useShowtimes(apiParams);
  const { data: cinemasRes } = useCinemas({ city: city || undefined });

  const showtimes = toList<Showtime & { cinemaName?: string }>(showtimesRes?.data ?? showtimesRes);
  const cinemas = toList<import("@/types/domain").CinemaListItem>(cinemasRes?.data ?? cinemasRes);

  function setCity(c: string) {
    const normalized = normalizeBookingCityId(c);
    persistSelectedBookingCity(normalized);
    setStoredCity(normalized);
    const p = new URLSearchParams(searchParams.toString());
    if (normalized) p.set("city", normalized);
    else p.delete("city");
    router.push(`?${p.toString()}`);
  }

  function handleAddressModeChange(nextMode: "new" | "legacy") {
    setAddressMode(nextMode);
    if (!city) return;
    const existsInNext =
      nextMode === "legacy"
        ? provincesLegacy.some((p) => p.code === city)
        : provincesNew.some((p) => p.code === city);
    if (!existsInNext) setCity("");
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
    return cityOptions.find((c) => c.id === city)?.label ?? bookingCityLabel(city, locale);
  }, [city, locale, cityOptions]);
  useEffect(() => {
    if (cityPickerOpen) return;
    setCityInputValue(cityLabel || "");
  }, [cityLabel]);

  const filteredShowtimes = showtimes.filter((st) => {
    if (format && st.format !== format) return false;
    if (
      language.trim() &&
      !(st.language || "").toLowerCase().includes(language.trim().toLowerCase())
    ) {
      return false;
    }
    if (!timeRange) return true;
    const tr = TIME_RANGE_DEFS.find((r) => r.value === timeRange);
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
        title={t("title")}
        breadcrumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />

      {/* Sticky filter bar */}
      <div className="cinect-glass sticky top-0 z-10 mb-6 rounded-xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {cityOptions.slice(0, 6).map((c) => (
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

            <DetectRegionButton
              size="sm"
              variant="outline"
              onApplied={(id) => setCity(id)}
            />

            <Select value={addressMode} onValueChange={(v) => handleAddressModeChange(v as "new" | "legacy")}>
              <SelectTrigger className="h-9 w-[190px]">
                <SelectValue placeholder={tCommon("addressSystem")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{tCommon("addressSystemNew")}</SelectItem>
                <SelectItem value="legacy">{tCommon("addressSystemLegacy")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-[220px]">
              <Input
                value={cityInputValue}
                onFocus={() => {
                  setCityPickerOpen(true);
                  setCityQuery(cityInputValue);
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    setCityPickerOpen(false);
                    setCityQuery("");
                    setCityInputValue(cityLabel || "");
                  }, 120);
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  setCityInputValue(v);
                  setCityQuery(v);
                  setCityPickerOpen(true);
                }}
                placeholder={tCommon("allCities")}
                className="h-9"
              />
              {cityPickerOpen && (
                <div className="bg-popover absolute top-full z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border p-1 shadow-md">
                  <button
                    type="button"
                    className="hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCity("");
                      setCityInputValue("");
                      setCityQuery("");
                      setCityPickerOpen(false);
                    }}
                  >
                    {tCommon("allCities")}
                  </button>
                  {filteredCityOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCity(c.id);
                        setCityInputValue(c.label);
                        setCityQuery("");
                        setCityPickerOpen(false);
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-muted-foreground text-sm">
            {cityLabel ? t("cinemasInCity", { city: cityLabel }) : t("browseAllCities")}
          </div>
        </div>

        {movieId && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
            <div className="text-muted-foreground text-sm">{t("filterByMovieHint")}</div>
            <Button size="sm" variant="outline" onClick={() => setFilter("movie", "")}>
              {t("clearMovieFilter")}
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        {/* Date Strip */}
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">{t("selectDate")}</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {next7Days.map((d) => {
              const dateStr = localCalendarDate(d);
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
                    ? tHome("today")
                    : d.getDate() === today.getDate() + 1
                      ? tHome("tomorrow")
                      : formatDateChipLabel(d, locale)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Select value={cinemaId || ALL} onValueChange={(v) => setFilter("cinema", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={tCinemas("allCinemas")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tCinemas("allCinemas")}</SelectItem>
              {cinemas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format || ALL} onValueChange={(v) => setFilter("format", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={tCommon("allFormats")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tCommon("allFormats")}</SelectItem>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange || ALL} onValueChange={(v) => setFilter("timeRange", v === ALL ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={tCommon("allDay")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tCommon("allDay")}</SelectItem>
              {TIME_RANGE_DEFS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {t(r.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder={t("languagePlaceholder")}
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
          <p className="mb-2 font-medium">{t("noResultsTitle")}</p>
          <p className="text-muted-foreground text-sm">{t("noResultsHint")}</p>
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
                        {t("showtimeCount", { count: sts.length })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {sts.map((st) => {
                    const timeLabel = new Date(st.startTime).toLocaleTimeString(timeLocaleTag, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: !locale.startsWith("vi"),
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
                                alt={st.movieTitle || t("movieFallback")}
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
                              {st.movieTitle || t("movieFallback")}
                            </div>
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                              {st.format && <Badge variant="outline">{st.format}</Badge>}
                              {st.memberExclusive && (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  {tMembership("memberExclusive")}
                                </Badge>
                              )}
                              {st.language && (
                                <span>{localizeAudioLabel(st.language, (k) => tShow(k))}</span>
                              )}
                              {st.roomName && (
                                <span>
                                  • {localizeRoomName(st.roomName, (k, v) => tShow(k, v))}
                                </span>
                              )}
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
                              {formatVnd(st.basePrice, locale)}
                            </div>
                          )}

                          <Button asChild className="ml-auto sm:ml-0">
                            <Link href={`/booking/${st.id}`}>
                              <Ticket className="mr-2 h-4 w-4" />
                              {t("selectSeats")}
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
