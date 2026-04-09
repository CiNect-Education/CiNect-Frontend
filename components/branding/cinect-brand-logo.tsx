"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 min-h-[2.25rem] min-w-[2.25rem]",
  md: "h-11 w-11 min-h-[2.75rem] min-w-[2.75rem]",
  lg: "h-14 w-14 min-h-[3.5rem] min-w-[3.5rem]",
  xl: "h-24 w-24 min-h-[6rem] min-w-[6rem]",
} as const;

export type CinectBrandLogoSize = keyof typeof SIZES;

type Props = {
  size?: CinectBrandLogoSize;
  className?: string;
  /** Extra shimmer + sparkles (default true) */
  sparkle?: boolean;
  priority?: boolean;
};

/**
 * CiNect mark in a circular frame: light asset on white, dark asset on near-black.
 * Harmonizes with theme via ring/offset using design tokens.
 */
export function CinectBrandLogo({ size = "sm", className, sparkle = true, priority = false }: Props) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", SIZES[size], className)}>
      {/* Soft brand-colored ambient glow */}
      <span
        aria-hidden
        className="cinect-logo-ambient absolute inset-0 -z-10 scale-[1.15] rounded-full blur-md"
      />

      <span
        className={cn(
          "relative flex h-full w-full overflow-hidden rounded-full",
          "shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)] dark:ring-primary/40"
        )}
      >
        {/* object-cover + scale: fill the circle (crop), zoom past PNG margins so it doesn’t sit “in a box” */}
        <Image
          src="/brand/cinect-logo-light.png"
          alt="CiNect"
          width={512}
          height={512}
          quality={100}
          className="relative z-[1] h-full w-full origin-center object-cover object-center scale-[1.18] transform-gpu dark:hidden"
          priority={priority}
          sizes="192px"
        />
        <Image
          src="/brand/cinect-logo-dark.png"
          alt="CiNect"
          width={512}
          height={512}
          quality={100}
          className="relative z-[1] hidden h-full w-full origin-center object-cover object-center scale-[1.18] transform-gpu dark:block"
          sizes="192px"
        />
        {/* Shine: no full-surface blend — that was washing out the mark */}
        <span
          className="cinect-logo-shine-wrap pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-full"
          aria-hidden
        >
          <span className="cinect-logo-shine" />
        </span>
      </span>

      {sparkle && (
        <>
          <span
            className="cinect-logo-sparkle absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-amber-400"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="cinect-logo-sparkle absolute -left-0.5 bottom-2 h-1 w-1 rounded-full bg-sky-400"
            style={{ animationDelay: "0.45s" }}
          />
          <span
            className="cinect-logo-sparkle absolute bottom-0 right-1.5 h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: "0.9s" }}
          />
        </>
      )}
    </span>
  );
}
