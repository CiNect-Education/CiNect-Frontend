"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { useMovie, useMovieReviews, useCreateReview } from "@/hooks/queries/use-movies";
import { useMovieShowtimes } from "@/hooks/queries/use-cinemas";
import { useAuth } from "@/providers/auth-provider";
import {
  Clock,
  Calendar,
  Star,
  Play,
  Ticket,
  Users,
  Film,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";

export default function MovieDetailPage() {
  const params = useParams();
  const t = useTranslations("movies");
  const movieId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  // ─── Data fetching ────────────────────────────────────────────
  const { data: movieRes, isLoading, error, refetch } = useMovie(movieId);
  const movie = movieRes?.data;

  // Showtimes
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCity, setSelectedCity] = useState<string>("");
  const { data: showtimesRes } = useMovieShowtimes(movieId, {
    city: selectedCity || undefined,
    date: selectedDate,
  });
  const showtimes = showtimesRes?.data ?? [];

  // Reviews
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewsRes, isLoading: reviewsLoading } = useMovieReviews(movieId, {
    page: reviewPage,
    limit: 10,
  });
  const reviews = reviewsRes?.data ?? [];

  // Create review
  const [reviewRating, setReviewRating] = useState(8);
  const [reviewContent, setReviewContent] = useState("");
  const createReview = useCreateReview(movieId);

  // SEO - set document title
  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} | CinemaConnect`;
    }
  }, [movie]);

  // Date navigation
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") };
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

  const handleSubmitReview = () => {
    if (!reviewContent.trim()) return;
    createReview.mutate(
      { rating: reviewRating, content: reviewContent },
      {
        onSuccess: () => {
          setReviewContent("");
          setReviewRating(8);
        },
      }
    );
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
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Film className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">Movie not found</p>
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
        {movie.bannerUrl ? (
          <>
            <Image
              src={movie.bannerUrl}
              alt={movie.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="from-background via-background/50 absolute inset-0 bg-gradient-to-t to-transparent" />
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
                  <Image
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
                    {movie.duration}m
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(movie.releaseDate).toLocaleDateString()}
                  </span>
                  {movie.rating && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="fill-primary text-primary h-4 w-4" />
                      <span className="font-semibold">{movie.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({movie.ratingCount || 0})</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {movie.trailerUrl && (
                    <Button size="lg" asChild>
                      <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="mr-2 h-5 w-5" />
                        {t("trailer")}
                      </a>
                    </Button>
                  )}
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/showtimes?movie=${movie.id}` as any}>
                      <Ticket className="mr-2 h-5 w-5" />
                      {t("showtimes")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="cast">{t("cast")}</TabsTrigger>
            <TabsTrigger value="showtimes">{t("showtimes")}</TabsTrigger>
            <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {movie.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-3 text-xl font-semibold">Synopsis</h2>
                  <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">{t("director")}</h3>
                  <p className="text-muted-foreground">{movie.director}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">{t("language")}</h3>
                  <p className="text-muted-foreground">
                    {movie.language}
                    {movie.subtitles ? ` (Sub: ${movie.subtitles})` : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trailer embed */}
            {movie.trailerUrl && movie.trailerUrl.includes("youtube") && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-3 text-xl font-semibold">{t("trailer")}</h2>
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <iframe
                      src={movie.trailerUrl.replace("watch?v=", "embed/")}
                      title={`${movie.title} Trailer`}
                      className="h-full w-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {movie.galleryUrls && movie.galleryUrls.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-3 text-xl font-semibold">Gallery</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {movie.galleryUrls.map((url, i) => (
                      <div key={i} className="relative aspect-video overflow-hidden rounded-lg">
                        <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cast Tab */}
          <TabsContent value="cast">
            <Card>
              <CardContent className="p-6">
                {movie.cast && movie.cast.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {movie.cast.map((member, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                        {member.avatarUrl ? (
                          <Image
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
                  <p className="text-muted-foreground text-center">No cast information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Showtimes Tab */}
          <TabsContent value="showtimes" className="space-y-4">
            {/* Date strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {dates.map((d) => (
                <Button
                  key={d.value}
                  variant={selectedDate === d.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(d.value)}
                  className="shrink-0"
                >
                  {d.label}
                </Button>
              ))}
            </div>

            {/* Showtimes grouped by cinema */}
            {Object.keys(showtimesByCinema).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(showtimesByCinema).map(([cinemaName, sts]) => (
                  <Card key={cinemaName}>
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-4 w-4" />
                        <h3 className="font-semibold">{cinemaName}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sts.map((st) => (
                          <Button key={st.id} variant="outline" size="sm" asChild>
                            <Link href={`/booking/${st.id}` as any}>
                              {format(new Date(st.startTime), "HH:mm")}
                              {st.format && st.format !== "2D" && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  {st.format}
                                </Badge>
                              )}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">No showtimes available for this date</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            {/* Write Review */}
            {isAuthenticated ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-5 w-5" />
                    {t("writeReview")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{t("rating")}:</label>
                      <Select
                        value={String(reviewRating)}
                        onValueChange={(v) => setReviewRating(Number(v))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}/10
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Share your thoughts about this movie..."
                      rows={4}
                    />
                    <Button
                      onClick={handleSubmitReview}
                      disabled={createReview.isPending || !reviewContent.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {createReview.isPending ? "Submitting..." : t("writeReview")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-2">Login to write a review</p>
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews list */}
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                            {review.userName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium">{review.userName}</p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(review.createdAt), "PP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="fill-primary text-primary h-4 w-4" />
                          <span className="font-semibold">{review.rating}/10</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-3 text-sm">{review.content}</p>
                    </CardContent>
                  </Card>
                ))}

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
                  <span className="text-muted-foreground text-sm">Page {reviewPage}</span>
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
              <Card>
                <CardContent className="py-12 text-center">
                  <ThumbsUp className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
