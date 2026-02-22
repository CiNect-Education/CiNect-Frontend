import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
  movieSchema,
  movieListItemSchema,
  reviewSchema,
  createReviewSchema,
} from "@/lib/schemas/movie";
import type { Movie, MovieListItem, Review } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import type { CreateReviewInput } from "@/lib/schemas/movie";
import { z } from "zod";

// ─── Movie list ────────────────────────────────────────────────────

export function useMovies(params?: QueryParams) {
  return useApiQuery<MovieListItem[]>(["movies", JSON.stringify(params)], "/movies", params, {
    schema: z.array(movieListItemSchema),
  });
}

export function useNowShowingMovies(limit = 12) {
  return useApiQuery<MovieListItem[]>(
    ["movies", "now-showing", String(limit)],
    "/movies",
    { nowShowing: true, limit },
    { schema: z.array(movieListItemSchema) }
  );
}

export function useComingSoonMovies(limit = 12) {
  return useApiQuery<MovieListItem[]>(
    ["movies", "coming-soon", String(limit)],
    "/movies",
    { comingSoon: true, limit },
    { schema: z.array(movieListItemSchema) }
  );
}

// ─── Movie detail ──────────────────────────────────────────────────

export function useMovie(id: string) {
  return useApiQuery<Movie>(["movie", id], `/movies/${id}`, undefined, {
    schema: movieSchema,
    enabled: !!id,
  });
}

// ─── Reviews ───────────────────────────────────────────────────────

export function useMovieReviews(movieId: string, params?: QueryParams) {
  return useApiQuery<Review[]>(
    ["movie-reviews", movieId, JSON.stringify(params)],
    `/movies/${movieId}/reviews`,
    params,
    {
      schema: z.array(reviewSchema),
      enabled: !!movieId,
    }
  );
}

export function useCreateReview(movieId: string) {
  return useApiMutation<Review, CreateReviewInput>("post", `/movies/${movieId}/reviews`, {
    schema: reviewSchema,
    successMessage: "Review submitted",
    invalidateKeys: [["movie-reviews", movieId]],
  });
}
