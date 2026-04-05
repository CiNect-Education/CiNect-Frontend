"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Calendar,
  MapPin,
  Film,
  ChevronsUpDown,
  Check,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useMovies } from "@/hooks/queries/use-movies";
import { useCinemas } from "@/hooks/queries/use-cinemas";
import {
  BOOKING_CITIES,
  SELECTED_CITY_STORAGE_KEY,
  bookingCityLabel,
  localCalendarDate,
} from "@/lib/booking-region";
import { cn } from "@/lib/utils";

const ANY = "__ANY__";
const NO_CITY = "__NO_CITY__";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const d = v as { data?: unknown; items?: unknown };
    const arr = d.data ?? d.items;
    if (Array.isArray(arr)) return arr as T[];
  }
  return [];
}

type MovieRow = { id: string; title: string; posterUrl?: string };

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function QuickBookingWidget() {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [cityId, setCityId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [movieId, setMovieId] = useState(ANY);
  const [cinemaId, setCinemaId] = useState(ANY);
  const [movieOpen, setMovieOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const stored = typeof window !== "undefined" ? localStorage.getItem(SELECTED_CITY_STORAGE_KEY) : "";
    setCityId(stored || "");
    setDateStr(localCalendarDate());
  }, [mounted]);

  const {
    data: moviesRes,
    isLoading: moviesLoading,
    isError: moviesError,
  } = useMovies({ status: "NOW_SHOWING", limit: 80 });

  const { data: cinemasRes, isLoading: cinemasLoading } = useCinemas({
    city: cityId || undefined,
    limit: 120,
  });

  const movies = toList<MovieRow>(moviesRes?.data ?? moviesRes);
  const cinemas = toList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);

  const dateChips = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: d, iso: localCalendarDate(d) };
    });
  }, [mounted]);

  const compactDateOptions = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: d, iso: localCalendarDate(d) };
    });
  }, [mounted]);

  const selectedMovie = movies.find((m) => m.id === movieId);
  const activeFilters = movieId !== ANY || cinemaId !== ANY;

  useEffect(() => {
    setCinemaId(ANY);
  }, [cityId]);

  function handleCityChange(v: string) {
    const next = v === NO_CITY ? "" : v;
    setCityId(next);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem(SELECTED_CITY_STORAGE_KEY, next);
      else localStorage.removeItem(SELECTED_CITY_STORAGE_KEY);
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (cityId) params.set("city", cityId);
    if (dateStr) params.set("date", dateStr);
    if (movieId !== ANY) params.set("movie", movieId);
    if (cinemaId !== ANY) params.set("cinema", cinemaId);
    router.push(`/showtimes?${params.toString()}`);
  }

  function clearFilmAndCinema() {
    setMovieId(ANY);
    setCinemaId(ANY);
  }

  if (!mounted) {
    return (
      <Card className="border-primary/20 bg-card/50 border-2 backdrop-blur">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            <div className="bg-muted h-7 w-36 rounded-md" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-24 rounded" />
                <div className="bg-muted h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/50 border-2 backdrop-blur">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title row + expand */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-primary h-5 w-5 shrink-0" />
              <h2 className="text-xl font-semibold text-balance">{t("quickBooking")}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters && (
                <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                  <Film className="h-3 w-3" />
                  {t("filtersActive")}
                </Badge>
              )}
              {advancedOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setAdvancedOpen(false)}
                  aria-expanded={true}
                  aria-label={t("collapseAdvanced")}
                >
                  <ChevronDown className="h-4 w-4 rotate-180 transition-transform duration-200" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAdvancedOpen(true)}
                  aria-expanded={false}
                  aria-label={t("expandAdvanced")}
                >
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                  <span className="max-w-[9rem] truncate text-xs sm:max-w-none sm:text-sm">
                    {t("expandAdvanced")}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                </Button>
              )}
            </div>
          </div>

          {/* Compact row — hidden while advanced open (same state, no duplicate fields) */}
          {!advancedOpen && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Film className="h-4 w-4" />
                    {t("selectMovie")}
                  </Label>
                  <Select value={movieId} onValueChange={setMovieId} disabled={moviesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("anyMovie")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("anyMovie")}</SelectItem>
                      {movies.map((movie) => (
                        <SelectItem key={movie.id} value={movie.id}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {t("selectCinema")}
                  </Label>
                  <Select value={cinemaId} onValueChange={setCinemaId} disabled={cinemasLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("anyCinema")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("anyCinema")}</SelectItem>
                      {cinemas.map((cinema) => (
                        <SelectItem key={cinema.id} value={cinema.id}>
                          {cinema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {t("selectDate")}
                  </Label>
                  <Select value={dateStr} onValueChange={setDateStr}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("today")} />
                    </SelectTrigger>
                    <SelectContent>
                      {compactDateOptions.map(({ date, iso }) => {
                        const now = new Date();
                        const isToday = sameLocalDay(date, now);
                        const tomorrow = new Date(now);
                        tomorrow.setDate(now.getDate() + 1);
                        const isTomorrow = sameLocalDay(date, tomorrow);
                        const label = isToday
                          ? t("today")
                          : isTomorrow
                            ? t("tomorrow")
                            : date.toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              });
                        return (
                          <SelectItem key={iso} value={iso}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full" size="lg" disabled={!dateStr}>
                    {t("findShowtimes")}
                  </Button>
                </div>
              </div>

              {moviesError && <p className="text-destructive text-sm">{t("noMovies")}</p>}
            </>
          )}

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleContent className="overflow-hidden data-[state=open]:overflow-visible">
              <div className="border-border space-y-6 overflow-x-clip border-t pt-6">
                <p className="text-muted-foreground text-sm">{t("quickBookingSubtitle")}</p>

                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("selectCity")}
                  </Label>
                  <Select value={cityId || NO_CITY} onValueChange={handleCityChange}>
                    <SelectTrigger className="h-11 w-full max-w-full rounded-lg border-primary/15 bg-background/80">
                      <SelectValue placeholder={t("chooseCity")} />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={6}
                      align="start"
                      collisionPadding={12}
                      className="w-[var(--radix-select-trigger-width)] max-w-[min(var(--radix-select-trigger-width),calc(100vw-1.5rem))]"
                    >
                      <SelectItem value={NO_CITY} className="min-w-0 pr-8">
                        <span className="truncate">{t("allCitiesOption")}</span>
                      </SelectItem>
                      {BOOKING_CITIES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="min-w-0 pr-8">
                          <span className="truncate">{bookingCityLabel(c.id, locale)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">{t("showtimesCityHint")}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("selectDate")}</Label>
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {dateChips.map(({ date, iso }) => {
                      const now = new Date();
                      const isToday = sameLocalDay(date, now);
                      const tomorrow = new Date(now);
                      tomorrow.setDate(now.getDate() + 1);
                      const isTomorrow = sameLocalDay(date, tomorrow);
                      const label = isToday
                        ? t("today")
                        : isTomorrow
                          ? t("tomorrow")
                          : date.toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            });
                      return (
                        <Button
                          key={iso}
                          type="button"
                          variant={dateStr === iso ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-9 shrink-0 rounded-full px-4 text-xs font-medium sm:text-sm",
                            dateStr === iso && "ring-primary/30 ring-2 ring-offset-2 ring-offset-background"
                          )}
                          onClick={() => setDateStr(iso)}
                        >
                          <span className="max-sm:max-w-[4.5rem] max-sm:truncate">{label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Film className="h-4 w-4 text-primary" />
                      {t("selectMovie")}
                    </Label>
                    <Popover open={movieOpen} onOpenChange={setMovieOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={movieOpen}
                          disabled={moviesLoading}
                          className="h-11 w-full justify-between font-normal"
                        >
                          <span className="truncate text-left">
                            {moviesLoading ? t("loadingOptions") : selectedMovie?.title ?? t("anyMovie")}
                          </span>
                          {moviesLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 sm:w-[420px]" align="start">
                        <Command
                          filter={(value, search) => {
                            if (!search.trim()) return 1;
                            if (value === ANY) return 1;
                            const m = movies.find((x) => x.id === value);
                            if (!m) return 0;
                            return m.title.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput placeholder={t("searchMoviePlaceholder")} className="h-11" />
                          <CommandList>
                            <CommandEmpty>{moviesError ? t("noMovies") : t("noMoviesQuick")}</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value={ANY}
                                onSelect={() => {
                                  setMovieId(ANY);
                                  setMovieOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", movieId === ANY ? "opacity-100" : "opacity-0")}
                                />
                                {t("anyMovie")}
                              </CommandItem>
                              {movies.map((movie) => (
                                <CommandItem
                                  key={movie.id}
                                  value={movie.id}
                                  onSelect={() => {
                                    setMovieId(movie.id);
                                    setMovieOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      movieId === movie.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {movie.posterUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={movie.posterUrl}
                                      alt=""
                                      className="mr-2 h-11 w-8 rounded object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="bg-muted mr-2 flex h-11 w-8 items-center justify-center rounded">
                                      <Film className="text-muted-foreground h-4 w-4" />
                                    </div>
                                  )}
                                  <span className="min-w-0 flex-1 truncate">{movie.title}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      {t("selectCinema")}
                    </Label>
                    <Select value={cinemaId} onValueChange={setCinemaId} disabled={cinemasLoading}>
                      <SelectTrigger className="h-11 rounded-lg border-primary/15 bg-background/80">
                        <SelectValue
                          placeholder={
                            cinemasLoading
                              ? t("loadingOptions")
                              : cityId && cinemas.length === 0
                                ? t("noCinemasInCity")
                                : t("anyCinema")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>{t("anyCinema")}</SelectItem>
                        {cinemas.map((cinema) => (
                          <SelectItem key={cinema.id} value={cinema.id}>
                            {cinema.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {moviesError && <p className="text-destructive text-sm">{t("noMovies")}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" size="lg" disabled={!dateStr} className="gap-2">
                    <Calendar className="h-5 w-5" />
                    {t("findShowtimes")}
                  </Button>
                  {activeFilters && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilmAndCinema}>
                      {t("clearFilters")}
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </CardContent>
    </Card>
  );
}
