"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MovieListItem, CinemaListItem } from "@/types/domain";
import { Film, Building2 } from "lucide-react";

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
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), DEBOUNCE_MS);
  const router = useRouter();

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
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // Backend `GET /cinemas` may not support text search; fetch list then filter client-side.
  const { data: cinemasData, isLoading: cinemasLoading } = useQuery({
    queryKey: ["search", "cinemas"],
    queryFn: () => apiClient.get<CinemaListItem[]>("/cinemas"),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const movies = moviesData?.data ?? [];
  const cinemas = (cinemasData?.data ?? []).filter((c) =>
    debouncedQuery.length >= 2 ? c.name.toLowerCase().includes(debouncedQuery.toLowerCase()) : false
  );
  const isLoading = moviesLoading || cinemasLoading;
  const hasResults = movies.length > 0 || cinemas.length > 0;

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("dialogDescription")}</DialogDescription>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              placeholder={t("placeholder")}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {debouncedQuery.length < 2
                  ? t("minChars")
                  : isLoading
                    ? t("searching")
                    : t("noResults")}
              </CommandEmpty>
              {hasResults && (
                <>
                  {movies.length > 0 && (
                    <CommandGroup heading={t("movies")}>
                      {movies.map((movie) => (
                        <CommandItem
                          key={movie.id}
                          value={`movie-${movie.id}`}
                          onSelect={() => handleSelect(`/movies/${movie.slug}`)}
                          className="flex items-center gap-3"
                        >
                          <Film className="h-4 w-4 shrink-0" />
                          <span>{movie.title}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {cinemas.length > 0 && (
                    <CommandGroup heading={t("cinemas")}>
                      {cinemas.map((cinema) => (
                        <CommandItem
                          key={cinema.id}
                          value={`cinema-${cinema.id}`}
                          onSelect={() => handleSelect(`/cinemas/${cinema.id}`)}
                          className="flex items-center gap-3"
                        >
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>{cinema.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
