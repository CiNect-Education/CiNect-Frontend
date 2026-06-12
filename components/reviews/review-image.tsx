"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { isUsableImageUrl, normalizeReviewImageSrc } from "@/lib/remote-image";

type ReviewImageProps = {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
};

/** Review attachment — same-origin `/uploads/reviews/*` via Next rewrite. */
export function ReviewImage({ src, alt = "", className }: ReviewImageProps) {
  const normalized =
    typeof src === "string" && isUsableImageUrl(src) ? normalizeReviewImageSrc(src) : null;
  const [currentSrc, setCurrentSrc] = useState(normalized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(
      typeof src === "string" && isUsableImageUrl(src) ? normalizeReviewImageSrc(src) : null,
    );
    setFailed(false);
  }, [src]);

  if (!currentSrc || failed) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex h-full w-full items-center justify-center",
          className,
        )}
        aria-hidden={!alt}
      >
        <ImageOff className="h-6 w-6 opacity-60" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
