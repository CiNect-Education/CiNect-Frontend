"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Search, Film, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/use-api-query";
import { movieListItemSchema } from "@/lib/schemas/movie";
import { cinemaListItemSchema } from "@/lib/schemas/cinema";
import type { MovieListItem, CinemaListItem } from "@/types/domain";
import { RemoteImage } from "@/components/shared/remote-image";
import { z } from "zod";

type GlobalSearchProps = {
  variant?: "icon" | "header";
  className?: string;
};

const MIN_CHARS = 2;
const RESULT_LIMIT = 6;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: T[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}

type SearchResultsPanelProps = {
  debouncedQuery: string;
  movies: MovieListItem[];
  cinemas: CinemaListItem[];
  isLoading: boolean;
  onPick: () => void;
};

function SearchResultsPanel({
  debouncedQuery,
  movies,
  cinemas,
  isLoading,
  onPick,
}: SearchResultsPanelProps) {
  const t = useTranslations("globalSearch");
  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length >= MIN_CHARS;
  const hasResults = movies.length > 0 || cinemas.length > 0;

  if (!hasQuery) {
    return <p className="cinect-search-hint px-4 py-3 text-sm text-neutral-500">{t("minChars")}</p>;
  }

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("searching")}
      </p>
    );
  }

  if (!hasResults) {
    return <p className="cinect-search-hint px-4 py-3 text-sm text-neutral-500">{t("noResults")}</p>;
  }

  return (
    <div className="cinect-search-results py-1">
      {movies.length > 0 && (
        <section>
          <p className="px-4 py-1.5 text-[0.65rem] font-bold tracking-wider text-neutral-400 uppercase">
            {t("movies")}
          </p>
          <ul>
            {movies.map((movie) => (
              <li key={movie.id}>
                <Link
                  href={`/movies/${movie.slug}`}
                  className="cinect-search-result-item flex items-center gap-3 px-4 py-2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onPick}
                >
                  <span className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {movie.posterUrl ? (
                      <RemoteImage
                        src={movie.posterUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Film className="h-4 w-4 text-neutral-400" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {movie.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cinemas.length > 0 && (
        <section className={movies.length > 0 ? "border-t border-neutral-100" : undefined}>
          <p className="px-4 py-1.5 text-[0.65rem] font-bold tracking-wider text-neutral-400 uppercase">
            {t("cinemas")}
          </p>
          <ul>
            {cinemas.map((cinema) => (
              <li key={cinema.id}>
                <Link
                  href={`/cinemas/${cinema.slug || cinema.id}`}
                  className="cinect-search-result-item flex items-center gap-3 px-4 py-2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onPick}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <Building2 className="h-4 w-4 text-neutral-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {cinema.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{cinema.city}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border-t border-neutral-100 px-2 py-1">
        <Link
          href={`/movies?q=${encodeURIComponent(trimmed)}`}
          className="block rounded-md px-2 py-2 text-center text-xs font-semibold text-[#5b21b6] hover:bg-neutral-50"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onPick}
        >
          {t("viewAllResults")}
        </Link>
      </div>
    </div>
  );
}

/** Cinestar: desktop = inline white pill + live results; mobile = icon opens bar below header */
export function GlobalSearch({ variant = "icon", className }: GlobalSearchProps) {
  const t = useTranslations("globalSearch");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const searchActive = debouncedQuery.trim().length >= MIN_CHARS;

  const { data: moviesData, isLoading: moviesLoading } = useApiQuery<MovieListItem[]>(
    ["movies", "global-search", debouncedQuery],
    "/movies",
    { search: debouncedQuery.trim(), limit: RESULT_LIMIT, sort: "releaseDate:desc" },
    {
      enabled: searchActive,
      schema: z.array(movieListItemSchema) as unknown as z.ZodType<MovieListItem[]>,
    }
  );

  const { data: cinemasData, isLoading: cinemasLoading } = useApiQuery<CinemaListItem[]>(
    ["cinemas", "global-search"],
    "/cinemas",
    undefined,
    {
      enabled: searchActive,
      schema: z.array(cinemaListItemSchema) as unknown as z.ZodType<CinemaListItem[]>,
    }
  );

  const movies = useMemo(() => unwrapList<MovieListItem>(moviesData?.data).slice(0, RESULT_LIMIT), [
    moviesData,
  ]);

  const cinemas = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < MIN_CHARS) return [];
    const all = unwrapList<CinemaListItem>(cinemasData?.data);
    return all
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          (c.address?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, RESULT_LIMIT);
  }, [cinemasData, debouncedQuery]);

  const isLoading = searchActive && (moviesLoading || cinemasLoading);
  const showPanel = panelOpen;

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setMobileOpen(false);
  }, []);

  const submit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    closePanel();
    router.push(`/movies?q=${encodeURIComponent(q)}`);
  }, [query, router, closePanel]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (variant === "header") {
          inputRef.current?.focus();
        } else {
          setMobileOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [variant, closePanel]);

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [panelOpen]);

  const searchField = (
    <div ref={wrapRef} className="cinect-hd-search-wr relative w-full">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPanelOpen(true);
        }}
        onFocus={() => setPanelOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            closePanel();
            inputRef.current?.blur();
          }
        }}
        placeholder={t("headerPlaceholder")}
        className="h-10 w-full rounded-full border-0 bg-white py-0 pr-11 pl-4 text-sm font-normal text-neutral-900 outline-none placeholder:text-neutral-500 lg:h-11 lg:pl-5 lg:text-[0.9375rem]"
        autoComplete="off"
        aria-label={tCommon("searchAria")}
        aria-expanded={showPanel}
        aria-autocomplete="list"
        role="combobox"
      />
      <button
        type="button"
        onClick={submit}
        className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-800"
        aria-label={tCommon("searchAria")}
      >
        <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} />
      </button>

      {showPanel && (
        <div
          className="cinect-hd-search-panel absolute top-[calc(100%+0.35rem)] right-0 left-0 z-[90] overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-xl"
          role="listbox"
        >
          <SearchResultsPanel
            debouncedQuery={debouncedQuery}
            movies={movies}
            cinemas={cinemas}
            isLoading={isLoading}
            onPick={closePanel}
          />
        </div>
      )}
    </div>
  );

  if (variant === "header") {
    return <div className={cn("w-full min-w-0 max-w-[25rem]", className)}>{searchField}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setPanelOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "cinect-hd-search-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:text-[#f3ea28] lg:hidden",
          className
        )}
        aria-label={tCommon("searchAria")}
        aria-expanded={mobileOpen}
      >
        <Search className="h-4 w-4" strokeWidth={2.25} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={tCommon("close")}
            onClick={closePanel}
          />
          <div className="cinect-hd-search-block absolute top-[var(--cinect-header-height,4.5rem)] right-0 left-0 border-b border-white/10 bg-[#0f172a] p-4 shadow-lg">
            {searchField}
          </div>
        </div>
      )}
    </>
  );
}
