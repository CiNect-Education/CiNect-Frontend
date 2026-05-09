"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MovieListItem, CinemaListItem } from "@/types/domain";
import { Building2, Film, Star, Clock, MapPin, ChevronRight, Search } from "lucide-react";

const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function GlobalSearch() {
  const t = useTranslations("globalSearch");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), DEBOUNCE_MS);
  const router = useRouter();
  const hasQuery = debouncedQuery.length >= 2;

  // Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ["search", "movies", debouncedQuery],
    queryFn: () => apiClient.get<MovieListItem[]>("/movies", { search: debouncedQuery, limit: 10 }),
    enabled: open && hasQuery,
    staleTime: 30 * 1000,
  });

  const { data: cinemasData, isLoading: cinemasLoading } = useQuery({
    queryKey: ["search", "cinemas", debouncedQuery],
    queryFn: () => apiClient.get<CinemaListItem[]>("/cinemas", { search: debouncedQuery }),
    enabled: open && hasQuery,
    staleTime: 60 * 1000,
  });

  const movies = moviesData?.data ?? [];
  const cinemas = cinemasData?.data ?? [];
  const isLoading = hasQuery && (moviesLoading || cinemasLoading);
  const hasResults = movies.length > 0 || cinemas.length > 0;

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearchQuery("");
  };

  const movieStatusLabel = (status: MovieListItem["status"]) => {
    switch (status) {
      case "NOW_SHOWING":
        return t("nowShowing");
      case "COMING_SOON":
        return t("comingSoon");
      default:
        return t("ended");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
          aria-label={tCommon("searchAria")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="sr-only">{tCommon("searchAria")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="border-border/80 bg-popover text-popover-foreground w-[min(92vw,34rem)] overflow-hidden rounded-2xl p-0 shadow-2xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <span className="sr-only">{t("dialogTitle")}</span>
        <span className="sr-only">{t("dialogDescription")}</span>
        <div className="border-b border-border/70 px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={t("placeholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-auto border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
            />
          </div>
          <div className="mt-2 flex items-center justify-end text-xs">
            <span className="text-muted-foreground hidden items-center gap-1 sm:inline-flex">
              {t("keyboardHint")}
            </span>
          </div>
        </div>
        <ScrollArea className="max-h-[min(60vh,28rem)]">
          <div className="p-2">
            {!hasQuery ? null : isLoading ? (
              <div className="text-muted-foreground px-3 py-6 text-center text-sm">{t("searching")}</div>
            ) : !hasResults ? (
              <div className="text-muted-foreground px-3 py-6 text-center text-sm">{t("noResults")}</div>
            ) : (
              <div className="space-y-3 pb-1">
                {movies.length > 0 && (
                  <div>
                    <div className="text-muted-foreground px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide">
                      {t("movies")}
                    </div>
                    <div className="space-y-2">
                      {movies.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => handleSelect(`/movies/${movie.slug}`)}
                          className="group flex w-full items-start gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:border-sky-400 hover:bg-sky-50 focus-visible:border-sky-400 focus-visible:bg-sky-50 focus-visible:outline-none dark:hover:bg-sky-950/30 dark:focus-visible:bg-sky-950/30"
                        >
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="h-16 w-12 shrink-0 rounded-md object-cover ring-1 ring-black/5"
                              loading="lazy"
                            />
                          ) : (
                            <div className="bg-muted text-muted-foreground flex h-16 w-12 shrink-0 items-center justify-center rounded-md ring-1 ring-black/5">
                              <Film className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                  {movie.title}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
                                  <span className="inline-flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 text-amber-500" />
                                    {movie.rating?.toFixed(1) ?? "-"}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">|</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {movie.duration}m
                                  </span>
                                  {movie.genres?.[0]?.name ? (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">|</span>
                                      <span className="truncate text-slate-600 dark:text-slate-300">
                                        {movie.genres[0].name}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              <span className="bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400 inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                                {movieStatusLabel(movie.status)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="text-sky-500 dark:text-sky-400 mt-1 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {cinemas.length > 0 && (
                  <div>
                    <div className="text-muted-foreground px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide">
                      {t("cinemas")}
                    </div>
                    <div className="space-y-2">
                      {cinemas.map((cinema) => (
                        <button
                          key={cinema.id}
                          type="button"
                          onClick={() => handleSelect(`/cinemas/${cinema.slug || cinema.id}`)}
                          className="group flex w-full items-start gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:border-sky-400 hover:bg-sky-50 focus-visible:border-sky-400 focus-visible:bg-sky-50 focus-visible:outline-none dark:hover:bg-sky-950/30 dark:focus-visible:bg-sky-950/30"
                        >
                          {cinema.imageUrl ? (
                            <img
                              src={cinema.imageUrl}
                              alt={cinema.name}
                              className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-black/5"
                              loading="lazy"
                            />
                          ) : (
                            <div className="bg-muted text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-md ring-1 ring-black/5">
                              <Building2 className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                  {cinema.name}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
                                  {cinema.city ? (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {cinema.city}
                                    </span>
                                  ) : null}
                                  {cinema.roomCount != null ? (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">|</span>
                                      <span>{cinema.roomCount} rooms</span>
                                    </>
                                  ) : null}
                                </div>
                                {cinema.address ? (
                                  <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {cinema.address}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="text-sky-500 dark:text-sky-400 mt-1 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
