"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RemoteImage } from "@/components/shared/remote-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { MovieJsonLd } from "@/components/shared/movie-jsonld";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";
import { useMovie, useMovieReviews, useCreateReview, useMovies, useReviewEligibility } from "@/hooks/queries/use-movies";
import { useMovieShowtimes, useCinemas } from "@/hooks/queries/use-cinemas";
import { useCommunityWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/queries/use-community";
import { useAuth } from "@/providers/auth-provider";
import {
  Clock,
  Calendar,
  Star,
  Play,
  Ticket,
  Users,
  Film,
  MessageSquare,
  Heart,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ReviewVerifiedBadge } from "@/components/reviews/review-verified-badge";
import { RichReviewForm } from "@/components/reviews/rich-review-form";
import { CommunityReviewCard } from "@/components/community/community-review-card";
import { MovieCommunityPanel } from "@/components/movies/movie-community-panel";
import type { CommunityReviewItem } from "@/components/community/community-types";
import { enUS } from "date-fns/locale";
import { vi as viDateLocale } from "date-fns/locale";
import { localizeAudioLabel } from "@/lib/showtime-display";
import { MovieExternalScores } from "@/components/movies/movie-external-scores";
import { resolveMovieListingStatus } from "@/lib/movie-status";
import type { MovieStatus } from "@/types/domain";

export default function MovieDetailPage() {
  const params = useParams();
  const t = useTranslations("movies");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tShow = useTranslations("showtimeDisplay");
  const locale = useLocale();
  const movieSlug = params.id as string;
  const { isAuthenticated } = useAuth();

  // ─── Data fetching ────────────────────────────────────────────
  const { data: movieRes, isLoading, error, refetch } = useMovie(movieSlug);
  const movie = movieRes?.data;
  const resolvedMovieId = movie?.id ?? "";

  // Showtimes
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCity, setSelectedCity] = useState<string>("__ALL__");
  const listingStatus = useMemo((): MovieStatus | undefined => {
    if (!movie) return undefined;
    return resolveMovieListingStatus(movie.releaseDate, movie.status);
  }, [movie]);
  const isComingSoon = listingStatus === "COMING_SOON";
  const isEnded = listingStatus === "ENDED";
  const isNowShowing = listingStatus === "NOW_SHOWING";

  const { data: showtimesRes } = useMovieShowtimes(isNowShowing ? resolvedMovieId : "", {
    city: selectedCity === "__ALL__" ? undefined : selectedCity,
    date: selectedDate,
  });
  const showtimes = showtimesRes?.data ?? [];
  // Cinemas (for city filter)
  const { data: cinemasRes } = useCinemas();
  const cinemaItems =
    ((cinemasRes?.data ?? cinemasRes) as Array<{ id: string; city?: string }> | undefined) ?? [];

  // Reviews
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState<"newest" | "helpful" | "rating">("newest");
  const { data: reviewsRes, isLoading: reviewsLoading } = useMovieReviews(resolvedMovieId, {
    page: reviewPage,
    limit: 10,
    sort: reviewSort,
  });
  const reviews = reviewsRes?.data ?? [];

  const [activeTab, setActiveTab] = useState("overview");
  const [trailerRevealed, setTrailerRevealed] = useState(false);
  const trailerSectionRef = useRef<HTMLDivElement>(null);
  const createReview = useCreateReview(resolvedMovieId);
  const { data: eligibilityRes, isLoading: eligibilityLoading } = useReviewEligibility(
    resolvedMovieId,
    isAuthenticated && (isNowShowing || isEnded),
  );
  const reviewEligibility = eligibilityRes?.data;
  const canWriteReview = reviewEligibility?.canReview === true;
  const { data: watchlistRes } = useCommunityWatchlist();
  const addToWatchlist = useAddToWatchlist(resolvedMovieId);
  const removeFromWatchlist = useRemoveFromWatchlist(resolvedMovieId);

  const trailerSource = movie?.trailerUrl?.trim() ?? "";
  const youtubeId = useMemo(
    () => (trailerSource ? parseYoutubeVideoId(trailerSource) : null),
    [trailerSource],
  );

  // SEO - set document title
  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} | CiNect`;
    }
  }, [movie]);

  useEffect(() => {
    if (!trailerRevealed) return;
    const timer = window.setTimeout(() => {
      trailerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [trailerRevealed, activeTab]);

  useEffect(() => {
    if (!listingStatus) return;
    if (isComingSoon && (activeTab === "showtimes" || activeTab === "reviews" || activeTab === "community")) {
      setActiveTab("overview");
    } else if (isEnded && activeTab === "showtimes") {
      setActiveTab("overview");
    }
  }, [listingStatus, isComingSoon, isEnded, activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#community") {
      setActiveTab("community");
    }
  }, [resolvedMovieId]);

  const handleWatchTrailer = () => {
    setActiveTab("overview");
    setTrailerRevealed(true);
  };

  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const premiereLabel = useMemo(() => {
    if (!movie?.releaseDate) return null;
    const d = new Date(movie.releaseDate);
    return Number.isFinite(d.getTime()) ? format(d, "PP", { locale: dateFnsLocale }) : null;
  }, [movie?.releaseDate, dateFnsLocale]);

  // Date navigation
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      value: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE, MMM d", { locale: dateFnsLocale }),
    };
  });

  // Group showtimes by cinema
  const showtimesByCinema = showtimes.reduce(
    (acc, st) => {
      const key = st.cinemaName || st.cinemaId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(st);
      return acc;
    },
    {} as Record<string, typeof showtimes>
  );

  // Related movies (You may also like)
  const primaryGenreSlug = movie?.genres?.[0]?.slug;
  const relatedStatus: MovieStatus = isComingSoon ? "COMING_SOON" : "NOW_SHOWING";
  const { data: relatedMoviesRes } = useMovies(
    primaryGenreSlug
      ? { status: relatedStatus, genre: primaryGenreSlug, limit: 8 }
      : { status: relatedStatus, limit: 8 },
  );
  const relatedItems =
    ((relatedMoviesRes?.data ?? relatedMoviesRes) as Array<
      { id: string; slug?: string; title: string; posterUrl?: string; status?: string }
    > | undefined) ?? [];
  const recommendedMovies = relatedItems.filter((m) => m.id !== resolvedMovieId).slice(0, 4);
  const watchlistItems = watchlistRes?.data ?? [];
  const isInWatchlist = watchlistItems.some((item) => item.movieId === resolvedMovieId);

  const handleToggleWatchlist = () => {
    if (!resolvedMovieId) return;
    if (isInWatchlist) {
      removeFromWatchlist.mutate(undefined);
      return;
    }
    addToWatchlist.mutate(undefined);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <Skeleton className="aspect-[2/3] w-48 rounded-lg lg:w-56" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="p-12 text-center">
          <Film className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">{t("movieNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* JSON-LD for SEO */}
      <MovieJsonLd movie={movie} />

      {/* Hero Section */}
      <div className="from-muted to-background relative h-[400px] overflow-hidden bg-gradient-to-b lg:h-[500px]">
        {(movie.bannerUrl || movie.posterUrl) ? (
          <>
            <RemoteImage
              src={movie.bannerUrl || movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover object-center opacity-55"
              priority
            />
            <div className="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />
          </>
        ) : (
          <div className="from-primary/10 to-background absolute inset-0 bg-gradient-to-b" />
        )}

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
              {/* Poster */}
              <div className="border-background relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg border-4 shadow-2xl lg:w-56">
                {movie.posterUrl ? (
                  <RemoteImage
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="bg-muted flex h-full items-center justify-center">
                    <Film className="text-muted-foreground h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Title & Meta */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="mb-2 text-3xl font-bold lg:text-5xl">{movie.title}</h1>
                  {movie.originalTitle && movie.originalTitle !== movie.title && (
                    <p className="text-muted-foreground text-lg">{movie.originalTitle}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isComingSoon && (
                    <Badge className="bg-primary text-primary-foreground">{t("comingSoon")}</Badge>
                  )}
                  {isEnded && <Badge variant="secondary">{t("movieEnded")}</Badge>}
                  {isNowShowing && (
                    <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                      {t("nowShowing")}
                    </Badge>
                  )}
                  <Badge variant="secondary">{movie.ageRating}</Badge>
                  {movie.genres?.map((genre) => (
                    <Badge key={genre.id || genre.name} variant="outline">
                      {genre.name}
                    </Badge>
                  ))}
                  {movie.formats?.map((fmt) => (
                    <Badge key={fmt} variant="outline" className="bg-primary/10">
                      {fmt}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {t("durationMinutes", { minutes: movie.duration ?? 0 })}
                  </span>
                  {premiereLabel && (
                    <span
                      className={
                        isComingSoon
                          ? "text-primary flex items-center gap-1.5 text-sm font-semibold"
                          : "text-muted-foreground flex items-center gap-1 text-sm"
                      }
                    >
                      <Calendar className="h-4 w-4" />
                      {isComingSoon ? t("premiereOn", { date: premiereLabel }) : premiereLabel}
                    </span>
                  )}
                  <MovieExternalScores
                    imdbRating={movie.imdbRating}
                    metacriticScore={movie.metacriticScore}
                  />
                  {movie.rating != null && movie.rating > 0 ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="fill-primary text-primary h-4 w-4" />
                      <span className="font-semibold">{movie.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        CiNect ({movie.ratingCount || 0})
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3">
                    {isNowShowing && (
                      <>
                        <Button size="lg" asChild>
                          <Link href={`/showtimes?movie=${movie.id}`}>
                            <Ticket className="mr-2 h-5 w-5" />
                            {t("bookNow")}
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                          <Link href={`/showtimes?movie=${movie.id}`}>
                            <Ticket className="mr-2 h-5 w-5" />
                            {t("showtimes")}
                          </Link>
                        </Button>
                      </>
                    )}
                    {youtubeId && (
                      <Button
                        type="button"
                        size="lg"
                        variant={isComingSoon ? "default" : "outline"}
                        onClick={handleWatchTrailer}
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {t("trailer")}
                      </Button>
                    )}
                    {isAuthenticated && (
                      <Button size="lg" variant="outline" onClick={handleToggleWatchlist}>
                        <Heart className={`mr-2 h-5 w-5 ${isInWatchlist ? "fill-current" : ""}`} />
                        {isInWatchlist ? t("watchlistRemove") : t("watchlistAdd")}
                      </Button>
                    )}
                  </div>
                  {isComingSoon && (
                    <p className="text-muted-foreground max-w-2xl text-sm">{t("comingSoonDetailNotice")}</p>
                  )}
                  {isEnded && (
                    <p className="text-muted-foreground max-w-2xl text-sm">{t("endedDetailNotice")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="cast">{t("cast")}</TabsTrigger>
            {isNowShowing && <TabsTrigger value="showtimes">{t("showtimes")}</TabsTrigger>}
            {isNowShowing && <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>}
            {isEnded && <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>}
            {(isNowShowing || isEnded) && (
              <TabsTrigger value="community">{t("communityTab")}</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-0">
            {isComingSoon && premiereLabel && (
              <section className="cinect-detail-section">
                <p className="text-primary text-sm font-semibold">
                  {t("premiereOn", { date: premiereLabel })}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{t("comingSoonDetailNotice")}</p>
              </section>
            )}
            {isEnded && (
              <section className="cinect-detail-section">
                <p className="text-muted-foreground text-sm">{t("endedDetailNotice")}</p>
              </section>
            )}
            {movie.description && (
              <section className="cinect-detail-section">
                <h2 className="mb-3 text-xl font-semibold">{t("synopsis")}</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
              </section>
            )}

            <div className="cinect-detail-section grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">{t("director")}</h3>
                <p className="text-muted-foreground">{movie.director}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">{t("language")}</h3>
                <p className="text-muted-foreground">
                  {localizeAudioLabel(movie.language, (k) => tShow(k))}
                  {movie.subtitles
                    ? ` · ${t("subtitlesLine", {
                        subs: localizeAudioLabel(movie.subtitles, (k) => tShow(k)),
                      })}`
                    : ""}
                </p>
              </div>
            </div>

            {trailerRevealed && youtubeId && (
              <section
                ref={trailerSectionRef}
                className="cinect-detail-section animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                      {t("trailerFocusTitle")}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{t("trailer")}</h2>
                    <p className="text-muted-foreground mt-1 max-w-xl text-sm">{t("trailerFocusHint")}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setTrailerRevealed(false)}
                  >
                    {t("hideTrailer")}
                  </Button>
                </div>

                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl">
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      key={`${youtubeId}-${trailerRevealed}`}
                      src={youtubeEmbedUrl(youtubeId, { autoplay: true })}
                      title={`${movie.title} Trailer`}
                      className="h-full w-full border-0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Gallery */}
            {movie.galleryUrls && movie.galleryUrls.length > 0 && (
              <section className="cinect-detail-section">
                <h2 className="mb-3 text-xl font-semibold">{t("gallery")}</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {movie.galleryUrls.map((url, i) => (
                    <div
                      key={i}
                      className="cinect-flow-interactive relative aspect-video overflow-hidden rounded-lg"
                    >
                      <RemoteImage
                        src={url}
                        alt={t("galleryImageAlt", { index: i + 1 })}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* You may also like */}
            {recommendedMovies.length > 0 && (
              <section className="cinect-detail-section">
                <h2 className="mb-3 text-xl font-semibold">{t("youMayAlsoLike")}</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {recommendedMovies.map((rm) => (
                    <Link key={rm.id} href={`/movies/${rm.slug ?? rm.id}`}>
                      <div className="cinect-flow-interactive group overflow-hidden rounded-lg transition">
                        <div className="bg-muted relative aspect-[2/3]">
                          {rm.posterUrl ? (
                            <RemoteImage
                              src={rm.posterUrl}
                              alt={rm.title}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Film className="text-muted-foreground h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-medium">{rm.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* Cast Tab */}
          <TabsContent value="cast" className="pt-2">
            {movie.cast && movie.cast.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {movie.cast.map((member, i) => (
                  <div
                    key={i}
                    className="cinect-flow-interactive flex items-center gap-3 rounded-lg p-3"
                  >
                    {member.avatarUrl ? (
                      <RemoteImage
                        src={member.avatarUrl}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                        <Users className="text-muted-foreground h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-muted-foreground text-sm">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">{t("noCastInfo")}</p>
            )}
          </TabsContent>

          {/* Showtimes Tab */}
          <TabsContent value="showtimes" className="space-y-0">
            <section className="cinect-detail-section">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {cinemaItems.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-sm">{t("showtimesCityLabel")}</span>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder={tCommon("allCities")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{tCommon("allCities")}</SelectItem>
                        {Array.from(
                          new Set(
                            showtimes
                              .map((st) => {
                                const cinema = cinemaItems.find((c) => c.id === st.cinemaId);
                                return cinema?.city;
                              })
                              .filter(Boolean),
                          ),
                        )
                          .sort()
                          .map((city) => (
                            <SelectItem key={city as string} value={city as string}>
                              {city as string}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">{t("browseShowtimesForMovie")}</div>
                )}

                <div className="text-muted-foreground text-sm">
                  {t("cinemasCountShort", { count: Object.keys(showtimesByCinema).length })}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                {dates.map((d, index) => (
                  <Button
                    key={d.value}
                    variant={selectedDate === d.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(d.value)}
                    className="shrink-0"
                  >
                    {index === 0
                      ? tHome("today")
                      : index === 1
                        ? tHome("tomorrow")
                        : d.label}
                  </Button>
                ))}
              </div>
            </section>

            {Object.keys(showtimesByCinema).length > 0 ? (
              <div className="divide-y divide-border/20">
                {Object.entries(showtimesByCinema).map(([cinemaName, sts]) => (
                  <section
                    key={cinemaName}
                    className="cinect-flow-interactive -mx-2 rounded-lg px-2 py-5 first:pt-0"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <MapPin className="text-primary h-5 w-5 shrink-0" />
                      <div>
                        <div className="text-base font-semibold">{cinemaName}</div>
                        <div className="text-muted-foreground text-xs">
                          {t("showtimeCount", { count: sts.length })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sts.map((st) => (
                        <Button key={st.id} variant="outline" size="sm" asChild>
                          <Link href={`/booking/${st.id}`} className="flex items-center gap-1">
                            <span className="font-semibold tabular-nums">
                              {format(new Date(st.startTime), "HH:mm")}
                            </span>
                            {st.format && st.format !== "2D" && (
                              <Badge variant="secondary" className="ml-1 text-[10px]">
                                {st.format}
                              </Badge>
                            )}
                            {st.memberExclusive && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-primary border-primary/30 text-[10px]"
                              >
                                {t("memberBadgeShort")}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Ticket className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground">{t("noShowtimesForDate")}</p>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-0">
            {isAuthenticated ? (
              eligibilityLoading ? (
                <Skeleton className="mb-6 h-40 w-full rounded-lg" />
              ) : canWriteReview ? (
                <section className="cinect-detail-section">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-5 w-5" />
                    {t("writeReview")}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {reviewEligibility?.willBeVerified
                      ? t("reviewVerifiedHint")
                      : t("reviewOpenHint")}
                  </p>
                  {reviewEligibility?.willBeVerified ? (
                    <div className="mb-4">
                      <ReviewVerifiedBadge />
                    </div>
                  ) : null}
                  <RichReviewForm
                    isSubmitting={createReview.isPending}
                    onSubmit={async (payload) => {
                      await createReview.mutateAsync(payload);
                    }}
                  />
                </section>
              ) : (
                <section className="cinect-detail-section">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-5 w-5" />
                    {t("writeReview")}
                  </h3>
                  <p className="text-muted-foreground text-sm">{t("reviewAlreadySubmitted")}</p>
                </section>
              )
            ) : (
              <section className="cinect-detail-section text-center">
                <p className="text-muted-foreground mb-2">{t("loginToReview")}</p>
                <Button asChild>
                  <Link href="/login">{tAuth("login")}</Link>
                </Button>
              </section>
            )}

            {/* Reviews list */}
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="pt-2">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t("audienceReviews")}</p>
                  <div className="inline-flex overflow-hidden rounded-md border border-border/30 text-xs">
                    <Button
                      type="button"
                      variant={reviewSort === "newest" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 rounded-none px-3"
                      onClick={() => setReviewSort("newest")}
                    >
                      {t("reviewSortNewest")}
                    </Button>
                    <Button
                      type="button"
                      variant={reviewSort === "helpful" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 rounded-none border-l border-border/30 px-3"
                      onClick={() => setReviewSort("helpful")}
                    >
                      {t("reviewSortHelpful")}
                    </Button>
                    <Button
                      type="button"
                      variant={reviewSort === "rating" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 rounded-none border-l border-border/30 px-3"
                      onClick={() => setReviewSort("rating")}
                    >
                      {t("reviewSortHighest")}
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/20">
                  {reviews.map((review) => (
                    <CommunityReviewCard
                      key={review.id}
                      review={review as CommunityReviewItem}
                      variant="inline"
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    {t("reviewsPage", { page: reviewPage })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewPage((p) => p + 1)}
                    disabled={reviews.length < 10}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground">{t("noReviewsYet")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-0">
            {resolvedMovieId ? <MovieCommunityPanel movieId={resolvedMovieId} /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
