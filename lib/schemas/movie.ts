import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().nullable().transform((v) => v ?? undefined);

export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const castMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatarUrl: n(z.string()),
});

export const movieSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalTitle: n(z.string()),
  slug: z.string(),
  description: z.string(),
  posterUrl: z.string(),
  bannerUrl: n(z.string()),
  trailerUrl: n(z.string()),
  galleryUrls: n(z.array(z.string())),
  duration: z.number(),
  releaseDate: z.string(),
  endDate: n(z.string()),
  genres: z.array(genreSchema),
  director: z.string(),
  cast: z.array(castMemberSchema),
  language: z.string(),
  subtitles: n(z.string()),
  rating: n(z.number()),
  ratingCount: n(z.number()),
  ageRating: z.enum(["P", "C13", "C16", "C18"]),
  formats: z.array(z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"])),
  status: z.enum(["NOW_SHOWING", "COMING_SOON", "ENDED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const movieListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  posterUrl: z.string(),
  duration: z.number(),
  releaseDate: z.string(),
  genres: z.array(genreSchema),
  ageRating: z.enum(["P", "C13", "C16", "C18"]),
  formats: z.array(z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"])),
  rating: n(z.number()),
  status: z.enum(["NOW_SHOWING", "COMING_SOON", "ENDED"]),
});

export const reviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: n(z.string()),
  movieId: z.string(),
  rating: z.number().min(1).max(10),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createReviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(10),
  content: z.string().min(10, "Review must be at least 10 characters"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
