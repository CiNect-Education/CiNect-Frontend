import type { MovieStatus } from "@/types/domain";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Aligns with backend `resolveListingStatus` — future release → COMING_SOON. */
export function resolveMovieListingStatus(
  releaseDate: string | Date,
  catalogStatus: MovieStatus,
  now = new Date(),
): MovieStatus {
  const today = startOfUtcDay(now);
  const release = startOfUtcDay(new Date(releaseDate));

  if (release > today) {
    return "COMING_SOON";
  }

  if (catalogStatus === "COMING_SOON") {
    return "NOW_SHOWING";
  }

  return catalogStatus;
}
