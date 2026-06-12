"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCinemas } from "@/hooks/queries/use-cinemas";
import { useMovies } from "@/hooks/queries/use-movies";
import { cn } from "@/lib/utils";
import { Building2, Clapperboard, SlidersHorizontal, X } from "lucide-react";

export type CommunityFeedFilters = {
  verifiedOnly: "all" | "verified";
  movieId?: string;
  cinemaId?: string;
  sort: "newest" | "helpful" | "rating";
};

type CommunityFeedToolbarProps = {
  value: CommunityFeedFilters;
  onChange: (next: CommunityFeedFilters) => void;
};

const SORT_OPTIONS = ["newest", "helpful", "rating"] as const;

export function CommunityFeedToolbar({ value, onChange }: CommunityFeedToolbarProps) {
  const t = useTranslations("community");
  const { data: cinemasRes } = useCinemas({ limit: 50 });
  const { data: moviesRes } = useMovies({ limit: 40, status: "NOW_SHOWING" });

  const cinemas =
    (cinemasRes?.data as Array<{ id: string; name: string }> | undefined) ?? [];
  const movies =
    (moviesRes?.data as Array<{ id: string; title: string }> | undefined) ?? [];

  const selectedMovie = movies.find((m) => m.id === value.movieId);
  const selectedCinema = cinemas.find((c) => c.id === value.cinemaId);
  const scopeCount = (value.movieId ? 1 : 0) + (value.cinemaId ? 1 : 0);

  const hasActiveScope = scopeCount > 0;

  function clearScope() {
    onChange({ ...value, movieId: undefined, cinemaId: undefined });
  }

  return (
    <div className="community-feed-toolbar">
      <div className="community-feed-toolbar__row">
        <div className="community-feed-toolbar__group">
          <span className="community-feed-toolbar__label">{t("audienceLabel")}</span>
          <div className="community-feed-toolbar__pills" role="group" aria-label={t("audienceLabel")}>
            <button
              type="button"
              className={cn(
                "community-feed-toolbar__pill",
                value.verifiedOnly === "all" && "community-feed-toolbar__pill--active",
              )}
              onClick={() => onChange({ ...value, verifiedOnly: "all" })}
            >
              {t("filterAllReviews")}
            </button>
            <button
              type="button"
              className={cn(
                "community-feed-toolbar__pill",
                value.verifiedOnly === "verified" && "community-feed-toolbar__pill--active",
              )}
              onClick={() => onChange({ ...value, verifiedOnly: "verified" })}
            >
              {t("filterVerifiedOnly")}
            </button>
          </div>
        </div>

        <div className="community-feed-toolbar__group community-feed-toolbar__group--scope">
          <span className="community-feed-toolbar__label">{t("scopeLabel")}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "community-feed-toolbar__scope-btn h-9 gap-2",
                  hasActiveScope && "border-primary/40 bg-primary/5",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t("filterScope")}
                {scopeCount > 0 ? (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                    {scopeCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(100vw-2rem,20rem)] p-4">
              <p className="mb-3 text-sm font-medium">{t("filterScopeTitle")}</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Clapperboard className="h-3.5 w-3.5" />
                    {t("filterByMovie")}
                  </label>
                  <Select
                    value={value.movieId ?? "__ALL__"}
                    onValueChange={(v) =>
                      onChange({ ...value, movieId: v === "__ALL__" ? undefined : v })
                    }
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">{t("filterAllMovies")}</SelectItem>
                      {movies.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Building2 className="h-3.5 w-3.5" />
                    {t("filterByCinema")}
                  </label>
                  <Select
                    value={value.cinemaId ?? "__ALL__"}
                    onValueChange={(v) =>
                      onChange({ ...value, cinemaId: v === "__ALL__" ? undefined : v })
                    }
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">{t("filterAllCinemas")}</SelectItem>
                      {cinemas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="community-feed-toolbar__group community-feed-toolbar__group--sort">
          <span className="community-feed-toolbar__label">{t("sortLabel")}</span>
          <div className="community-feed-toolbar__segment" role="group" aria-label={t("sortLabel")}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  "community-feed-toolbar__segment-btn",
                  value.sort === opt && "community-feed-toolbar__segment-btn--active",
                )}
                onClick={() => onChange({ ...value, sort: opt })}
              >
                {opt === "newest"
                  ? t("sortNewest")
                  : opt === "helpful"
                    ? t("sortHelpful")
                    : t("sortRating")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasActiveScope ? (
        <div className="community-feed-toolbar__chips">
          <span className="text-muted-foreground text-xs">{t("activeFilters")}</span>
          {selectedMovie ? (
            <button
              type="button"
              className="community-feed-toolbar__chip"
              onClick={() => onChange({ ...value, movieId: undefined })}
            >
              <Clapperboard className="h-3 w-3" />
              {selectedMovie.title}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ) : null}
          {selectedCinema ? (
            <button
              type="button"
              className="community-feed-toolbar__chip"
              onClick={() => onChange({ ...value, cinemaId: undefined })}
            >
              <Building2 className="h-3 w-3" />
              {selectedCinema.name}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 px-2 text-xs"
            onClick={clearScope}
          >
            {t("clearScopeFilters")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
