"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LocaleId = "vi" | "en";

/** Locale flag icons (remote assets from reference site) */
const FLAG_SRC: Record<LocaleId, string> = {
  vi: "https://cinestar.com.vn/assets/images/footer-vietnam.svg",
  en: "https://cinestar.com.vn/assets/images/footer-america.webp",
};

const FLAG_FALLBACK: Record<LocaleId, string> = {
  vi: "/flags/vn.svg",
  en: "/flags/en.svg",
};

type Props = {
  locale: LocaleId;
  className?: string;
};

export function LocaleFlagIcon({ locale, className }: Props) {
  const [src, setSrc] = useState(FLAG_SRC[locale]);

  useEffect(() => {
    setSrc(FLAG_SRC[locale]);
  }, [locale]);

  return (
    <span className={cn("cinect-lg-image", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={24}
        height={24}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setSrc(FLAG_FALLBACK[locale])}
      />
    </span>
  );
}
