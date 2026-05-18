"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  Film,
  Globe,
  MessageCircle,
  Play,
  Shield,
  Star,
  Subtitles,
  Tag,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MovieListItem } from "@/types/domain";
import { RemoteImage } from "@/components/shared/remote-image";
import { MovieTrailerDialog } from "@/components/shared/movie-trailer-dialog";
import { countryLabelForLanguage, movieTagline } from "@/lib/movie-display";
import { parseYoutubeVideoId } from "@/lib/youtube";
import { localizeAudioLabel } from "@/lib/showtime-display";
import { cn } from "@/lib/utils";

interface HomeMovieCardProps {
  movie: MovieListItem;
  className?: string;
}

function genreNames(movie: MovieListItem): string[] {
  return (
    movie.genres?.map((g) =>
      typeof g === "object" && g !== null && "name" in g ? (g as { name: string }).name : String(g),
    ) ?? []
  );
}

function HoverMetaRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

/** Movie card: poster + hover info, title & trailer/book actions below. */
export function HomeMovieCard({ movie, className }: HomeMovieCardProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const locale = useLocale();
  const tHome = useTranslations("home");
  const tMovies = useTranslations("movies");
  const tShow = useTranslations("showtimeDisplay");
  const genres = genreNames(movie);
  const tagline = movieTagline(movie.description);
  const languageLabel = movie.language
    ? localizeAudioLabel(movie.language, (k) => tShow(k))
    : null;
  const subtitlesLabel = movie.subtitles
    ? localizeAudioLabel(movie.subtitles, (k) => tShow(k))
    : null;
  const countryLabel = countryLabelForLanguage(movie.language, (k) => tMovies(k));
  const releaseLabel = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;
  const formatsLabel =
    movie.formats && movie.formats.length > 0 ? movie.formats.join(", ") : null;
  const trailerSource = movie.trailerUrl?.trim();
  const youtubeId = trailerSource ? parseYoutubeVideoId(trailerSource) : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-md bg-[#3f4296] shadow-sm",
        "ring-1 ring-border/40 transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="group relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-muted">
        <Link href={`/movies/${movie.slug}`} className="absolute inset-0 z-0" tabIndex={-1}>
          {movie.posterUrl ? (
            <RemoteImage
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="text-muted-foreground flex h-full items-center justify-center p-3 text-center text-sm">
              {movie.title}
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute top-2 left-2 z-10 flex flex-wrap gap-1">
          {movie.formats?.slice(0, 2).map((fmt) => (
            <Badge
              key={fmt}
              className="border-0 bg-[#f3ea28] px-1.5 text-[10px] font-bold text-black shadow-sm"
            >
              {fmt}
            </Badge>
          ))}
          {movie.status === "COMING_SOON" && (
            <Badge className="bg-black/75 text-[10px] text-white shadow-sm">
              {tMovies("comingSoon")}
            </Badge>
          )}
          {movie.ageRating ? (
            <Badge className="bg-black/70 text-[10px] text-white shadow-sm backdrop-blur">
              {movie.ageRating}
            </Badge>
          ) : null}
        </div>

        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col overflow-hidden p-3 sm:p-3.5",
            "bg-gradient-to-b from-[#1b1548]/97 via-[#231a5c]/96 to-[#1b1548]/97 text-white",
            "opacity-0 transition-opacity duration-300",
            "group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25">
            {tagline ? (
              <p className="mb-2 text-[10px] leading-snug text-white/85 italic sm:text-[11px]">
                {tagline}
              </p>
            ) : null}

            <h3 className="text-[11px] leading-snug font-bold tracking-wide uppercase sm:text-xs">
              {movie.title}
            </h3>

            {movie.originalTitle && movie.originalTitle !== movie.title ? (
              <p className="mt-1 text-[10px] leading-snug text-white/75">{movie.originalTitle}</p>
            ) : null}

            <ul className="mt-2.5 space-y-1.5 text-[10px] sm:text-[11px]">
              {genres.length > 0 ? (
                <HoverMetaRow icon={Tag}>{genres.join(", ")}</HoverMetaRow>
              ) : null}
              {movie.duration ? (
                <HoverMetaRow icon={Clock}>{movie.duration}&apos;</HoverMetaRow>
              ) : null}
              {countryLabel ? (
                <HoverMetaRow icon={Globe}>{countryLabel}</HoverMetaRow>
              ) : null}
              {languageLabel ? (
                <HoverMetaRow icon={MessageCircle}>{languageLabel}</HoverMetaRow>
              ) : null}
              {subtitlesLabel ? (
                <HoverMetaRow icon={Subtitles}>
                  {tMovies("subtitles")}: {subtitlesLabel}
                </HoverMetaRow>
              ) : null}
              {movie.director ? (
                <HoverMetaRow icon={User}>
                  {tMovies("director")}: {movie.director}
                </HoverMetaRow>
              ) : null}
              {formatsLabel ? (
                <HoverMetaRow icon={Film}>{formatsLabel}</HoverMetaRow>
              ) : null}
              {movie.ageRating ? (
                <HoverMetaRow icon={Shield}>{movie.ageRating}</HoverMetaRow>
              ) : null}
              {releaseLabel ? (
                <HoverMetaRow icon={Calendar}>
                  {tMovies("releaseDate")}: {releaseLabel}
                </HoverMetaRow>
              ) : null}
              {movie.rating != null && Number(movie.rating) > 0 ? (
                <HoverMetaRow icon={Star}>
                  {tMovies("rating")}: {movie.rating}
                </HoverMetaRow>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex min-h-[5.25rem] flex-1 flex-col px-2.5 pt-2 pb-2.5 text-white">
        <Link
          href={`/movies/${movie.slug}`}
          className="mb-2 line-clamp-2 text-center text-[11px] leading-snug font-bold tracking-wide uppercase hover:underline sm:text-xs"
        >
          {movie.title}
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          {youtubeId ? (
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-[11px] text-white underline decoration-white/70 underline-offset-2 hover:decoration-white sm:text-xs"
              aria-label={tHome("watchTrailer")}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/80">
                <Play className="h-2.5 w-2.5 fill-white text-white" />
              </span>
              <span className="truncate">{tHome("watchTrailer")}</span>
            </button>
          ) : (
            <span className="flex-1" />
          )}

          <Link
            href={`/showtimes?movie=${movie.id}`}
            className="shrink-0 rounded-sm bg-[#f3ea28] px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide text-black uppercase transition-colors hover:bg-[#ffe94a] sm:px-3 sm:text-[11px]"
          >
            {tHome("bookTicketShort")}
          </Link>
        </div>
      </div>

      {youtubeId ? (
        <MovieTrailerDialog
          open={trailerOpen}
          onOpenChange={setTrailerOpen}
          trailerSource={trailerSource}
          title={movie.title}
        />
      ) : null}
    </article>
  );
}
