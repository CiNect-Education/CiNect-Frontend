"use client";

import { cn } from "@/lib/utils";

/** Bump when replacing processed PNGs so browsers skip stale cache. */
const BRAND_LOGO_VERSION = "4";

const SIZES = {
  sm: "h-12",
  md: "h-14",
  lg: "h-[5rem]",
  xl: "h-32",
  /** Main site header — tall mark like cinestar.com.vn */
  header: "cinect-logo-mark--header h-[4.25rem] w-[11rem] sm:h-[4.5rem] sm:w-[12rem]",
  /** Footer — large, flat (no glow frame) */
  footer: "cinect-logo-mark--footer h-[6.5rem] w-[17rem] sm:h-28 sm:w-[19rem]",
} as const;

export type CinectBrandLogoSize = keyof typeof SIZES;

/** `auto` follows theme; `on-dark` / `on-light` for fixed backgrounds (e.g. footer). */
export type CinectBrandLogoSurface = "auto" | "on-dark" | "on-light";

type Props = {
  size?: CinectBrandLogoSize;
  surface?: CinectBrandLogoSurface;
  className?: string;
  shine?: boolean;
  /** No ambient glow / shine / blend modes (footer) */
  plain?: boolean;
  priority?: boolean;
};

/**
 * CiNect mark — large, borderless, tinted to match site palette (gold + violet).
 */
export function CinectBrandLogo({
  size = "sm",
  surface = "auto",
  className,
  shine = true,
  plain = false,
  priority = false,
}: Props) {
  const showEffects = shine && !plain;
  const surfaceKey =
    surface === "on-dark" ? "dark" : surface === "on-light" ? "light" : "auto";

  const lightClass = cn(
    "cinect-logo-img cinect-logo-img-light",
    surfaceKey === "dark" && "hidden",
    surfaceKey === "light" && "block",
    surfaceKey === "auto" && "block dark:hidden"
  );

  const darkClass = cn(
    "cinect-logo-img cinect-logo-img-dark",
    surfaceKey === "dark" && "block",
    surfaceKey === "light" && "hidden",
    surfaceKey === "auto" && "hidden dark:block"
  );

  return (
    <span
      className={cn(
        "cinect-logo-mark relative inline-flex shrink-0 items-center justify-center",
        surface === "on-dark" && "cinect-logo-mark--on-dark",
        surface === "on-light" && "cinect-logo-mark--on-light",
        surface === "auto" && "cinect-logo-mark--auto",
        plain && "cinect-logo-mark--plain",
        SIZES[size],
        className
      )}
    >
      {showEffects && (
        <span aria-hidden className="cinect-logo-ambient pointer-events-none absolute -inset-[35%] -z-10" />
      )}

      <span className="relative flex h-full items-center">
        {/* Native img: Next/Image optimizer flattens PNG alpha onto black in dev/prod */}
        <img
          src={`/brand/cinect-logo-light.png?v=${BRAND_LOGO_VERSION}`}
          alt="CiNect"
          width={512}
          height={341}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={lightClass}
        />
        <img
          src={`/brand/cinect-logo-dark.png?v=${BRAND_LOGO_VERSION}`}
          alt="CiNect"
          width={512}
          height={341}
          decoding="async"
          className={darkClass}
        />

        {showEffects && (
          <span
            className="cinect-logo-shine-wrap pointer-events-none absolute inset-0 z-[2] overflow-hidden"
            aria-hidden
          >
            <span className="cinect-logo-shine" />
          </span>
        )}
      </span>
    </span>
  );
}
