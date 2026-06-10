import { z } from "zod";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { reviewSchema } from "@/lib/schemas/movie";
import type { QueryParams } from "@/types/api";

const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().nullable().transform((v) => v ?? undefined);

const pollOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  votes: z.number(),
});

const communityPostSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    userAvatar: n(z.string()),
    content: z.string(),
    type: n(z.string()),
    hashtags: n(z.array(z.string())),
    pollOptions: n(z.array(pollOptionSchema)),
    likeCount: n(z.number()),
    createdAt: z.string(),
    movie: n(z.object({ id: z.string(), title: z.string(), slug: z.string() })),
  })
  .passthrough();

const communityPhotoSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    imageUrl: z.string(),
    caption: n(z.string()),
    createdAt: z.string(),
    user: n(z.object({ id: z.string(), fullName: z.string(), avatar: n(z.string()) })),
    movie: n(z.object({ id: z.string(), title: z.string(), slug: z.string() })),
  })
  .passthrough();

const watchlistItemSchema = z
  .object({
    id: z.string(),
    movieId: z.string(),
    notifyWhenAvailable: z.boolean(),
    createdAt: z.string(),
    movie: n(
      z.object({
        id: z.string(),
        title: z.string(),
        slug: z.string(),
        posterUrl: n(z.string()),
        status: n(z.string()),
      })
    ),
  })
  .passthrough();

const groupInviteSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  sharePath: z.string(),
  showtimeId: z.string(),
  movieTitle: z.string(),
  cinemaName: z.string(),
  startTime: z.string(),
  seats: z.array(z.string()),
});

const inviteLandingSchema = z.object({
  token: z.string(),
  showtimeId: z.string(),
  movie: n(z.object({ id: z.string(), title: z.string(), slug: z.string(), posterUrl: n(z.string()) })),
  cinema: n(z.object({ id: z.string(), name: z.string(), address: n(z.string()), city: n(z.string()) })),
  startTime: z.string(),
  hostName: z.string(),
  seats: z.array(z.string()),
  bookingUrl: z.string(),
});

const publicProfileSchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    avatar: n(z.string()),
    city: n(z.string()),
    membershipTier: z.string(),
    reviewCount: z.number(),
    bookingCount: z.number(),
    memberSince: z.string(),
    recentReviews: z.array(z.any()),
    isOwnProfile: z.boolean(),
  })
  .passthrough();

const adminPendingSchema = z.object({
  reviews: z.array(z.any()),
  posts: z.array(z.any()),
  photos: z.array(z.any()),
});

const supportTicketSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    subject: z.string(),
    message: z.string(),
    isResolved: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export function useCommunityReviews(params?: QueryParams) {
  return useApiQuery(["community", "reviews", JSON.stringify(params ?? {})], "/community/reviews", params, {
    schema: z.array(reviewSchema) as unknown as z.ZodType<z.infer<typeof reviewSchema>[]>,
  });
}

export function useCommunityPosts(params?: QueryParams) {
  return useApiQuery(["community", "posts", JSON.stringify(params ?? {})], "/community/posts", params, {
    schema: z.array(communityPostSchema) as unknown as z.ZodType<z.infer<typeof communityPostSchema>[]>,
  });
}

export function useCreateCommunityPost() {
  return useApiMutation("post", "/community/posts", {
    invalidateKeys: [["community", "posts"]],
  });
}

export function useVoteCommunityPost() {
  return useApiMutation<{ pollOptions: z.infer<typeof pollOptionSchema>[] }, { id: string; optionId: string }>(
    "post",
    (v) => `/community/posts/${v.id}/vote`,
    {
      invalidateKeys: [["community", "posts"]],
    }
  );
}

export function useCommunityPhotos(params?: QueryParams) {
  return useApiQuery(["community", "photos", JSON.stringify(params ?? {})], "/community/photos", params, {
    schema: z.array(communityPhotoSchema) as unknown as z.ZodType<z.infer<typeof communityPhotoSchema>[]>,
  });
}

export function useCreateCommunityPhoto() {
  return useApiMutation("post", "/community/photos", {
    invalidateKeys: [["community", "photos"]],
  });
}

export function useCommunityUserProfile(id: string) {
  return useApiQuery(["community", "user", id], `/community/users/${id}`, undefined, {
    enabled: !!id,
    schema: publicProfileSchema,
  });
}

export function useCommunityWatchlist() {
  return useApiQuery(["community", "watchlist"], "/community/watchlist", undefined, {
    schema: z.array(watchlistItemSchema) as unknown as z.ZodType<z.infer<typeof watchlistItemSchema>[]>,
  });
}

export function useAddToWatchlist(movieId: string) {
  return useApiMutation("post", `/community/watchlist/${movieId}`, {
    invalidateKeys: [["community", "watchlist"]],
  });
}

export function useRemoveFromWatchlist(movieId: string) {
  return useApiMutation("delete", `/community/watchlist/${movieId}`, {
    invalidateKeys: [["community", "watchlist"]],
  });
}

export function useJoinCommunityGroup(token: string) {
  return useApiQuery(["community", "join", token], `/community/join/${token}`, undefined, {
    enabled: !!token,
    schema: inviteLandingSchema,
  });
}

export function useInviteBookingFriends(bookingId: string) {
  return useApiMutation<z.infer<typeof groupInviteSchema>, void>("post", `/community/bookings/${bookingId}/invite`);
}

export function useReviewReaction() {
  return useApiMutation<{ liked: boolean; helpfulCount: number }, { reviewId: string }>(
    "post",
    (v) => `/community/reviews/${v.reviewId}/react`,
    {
      invalidateKeys: [["movie-reviews"], ["community", "reviews"]],
    }
  );
}

export function useAdminCommunityPending() {
  return useApiQuery(["admin", "community", "pending"], "/admin/community/pending", undefined, {
    schema: adminPendingSchema,
  });
}

export function useApproveCommunityReview() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/reviews/${v.id}/approve`, {
    invalidateKeys: [["admin", "community", "pending"]],
  });
}

export function useApproveCommunityPost() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/posts/${v.id}/approve`, {
    invalidateKeys: [["admin", "community", "pending"]],
  });
}

export function useApproveCommunityPhoto() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/photos/${v.id}/approve`, {
    invalidateKeys: [["admin", "community", "pending"]],
  });
}

export function useAdminSupportTickets(params?: QueryParams) {
  return useApiQuery(
    ["admin", "support", "tickets", JSON.stringify(params ?? {})],
    "/admin/support/tickets",
    params,
    {
      schema: z.array(supportTicketSchema) as unknown as z.ZodType<z.infer<typeof supportTicketSchema>[]>,
    }
  );
}

const adminCommunityStatsSchema = z.object({
  pendingReviews: z.number(),
  openTickets: z.number(),
  totalRefunds: z.number(),
  verifiedReviews: z.number(),
});

export function useAdminCommunityStats() {
  return useApiQuery(["admin", "community", "stats"], "/admin/community/stats", undefined, {
    schema: adminCommunityStatsSchema,
  });
}

export function useRejectCommunityReview() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/reviews/${v.id}/reject`, {
    invalidateKeys: [["admin", "community", "pending"], ["admin", "community", "stats"]],
  });
}

export function useRejectCommunityPost() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/posts/${v.id}/reject`, {
    invalidateKeys: [["admin", "community", "pending"], ["admin", "community", "stats"]],
  });
}

export function useRejectCommunityPhoto() {
  return useApiMutation("post", (v: { id: string }) => `/admin/community/photos/${v.id}/reject`, {
    invalidateKeys: [["admin", "community", "pending"], ["admin", "community", "stats"]],
  });
}

export function useResolveSupportTicket() {
  return useApiMutation("patch", (v: { id: string; isResolved: boolean }) => `/admin/support/tickets/${v.id}`, {
    invalidateKeys: [["admin", "support", "tickets"], ["admin", "community", "stats"]],
  });
}
