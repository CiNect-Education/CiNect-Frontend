"use client";

import { cn } from "@/lib/utils";

type MovieExternalScoresProps = {
  imdbRating?: number | null;
  metacriticScore?: number | null;
  size?: "sm" | "md";
  className?: string;
};

function formatImdb(value: number) {
  return Number.isInteger(value) ? `${value}.0` : value.toFixed(1);
}

export function MovieExternalScores({
  imdbRating,
  metacriticScore,
  size = "md",
  className,
}: MovieExternalScoresProps) {
  const hasImdb = imdbRating != null && imdbRating > 0;
  const hasMc = metacriticScore != null && metacriticScore > 0;
  if (!hasImdb && !hasMc) return null;

  const scoreText = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {hasImdb ? (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-tight text-black"
            style={{ backgroundColor: "#F5C518" }}
            aria-hidden
          >
            IMDb
          </span>
          <span className={cn("font-semibold text-foreground tabular-nums", scoreText)}>
            {formatImdb(imdbRating)}
          </span>
        </div>
      ) : null}
      {hasMc ? (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#C9A227] bg-[#1B2A4A] text-[11px] font-bold italic text-white"
            aria-hidden
          >
            m
          </span>
          <span className={cn("font-semibold text-foreground tabular-nums", scoreText)}>
            {metacriticScore}
          </span>
        </div>
      ) : null}
    </div>
  );
}
