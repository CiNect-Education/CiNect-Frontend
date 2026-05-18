"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isUsableImageUrl, normalizeRemoteImageSrc } from "@/lib/remote-image";

type RemoteImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

/** Remote API images via native img (reliable for Amazon, Unsplash, Maps, Wikimedia). */
export function RemoteImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
}: RemoteImageProps) {
  const primary =
    typeof src === "string" && isUsableImageUrl(src)
      ? normalizeRemoteImageSrc(src)
      : null;
  const [currentSrc, setCurrentSrc] = useState(primary);

  useEffect(() => {
    setCurrentSrc(
      typeof src === "string" && isUsableImageUrl(src)
        ? normalizeRemoteImageSrc(src)
        : null,
    );
  }, [src]);

  if (!currentSrc) {
    return null;
  }

  const imgProps = {
    referrerPolicy: "no-referrer" as const,
    loading: (priority ? "eager" : "lazy") as "eager" | "lazy",
    decoding: "async" as const,
  };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        {...imgProps}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        onError={() => setCurrentSrc(null)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      {...imgProps}
      className={className}
      onError={() => setCurrentSrc(null)}
    />
  );
}
