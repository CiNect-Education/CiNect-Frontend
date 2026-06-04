"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export interface MovieTrailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trailerSource?: string | null;
  title?: string;
  className?: string;
}

/** Trailer lightbox (dialog + YouTube embed). */
export function MovieTrailerDialog({
  open,
  onOpenChange,
  trailerSource,
  title,
  className,
}: MovieTrailerDialogProps) {
  const t = useTranslations("home");
  const videoId = useMemo(
    () => (trailerSource ? parseYoutubeVideoId(trailerSource) : null),
    [trailerSource],
  );
  return (
    <Dialog open={open && Boolean(videoId)} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[min(960px,calc(100vw-2rem))] gap-0 overflow-hidden border-0 !bg-black p-0 shadow-2xl sm:rounded-md",
          "[&>button]:z-10 [&>button]:text-white [&>button]:opacity-90 [&>button]:hover:opacity-100",
          "[&>button]:top-3 [&>button]:right-3",
          className,
        )}
      >
        <DialogTitle className="sr-only">
          {title ? `${title} — ${t("watchTrailer")}` : t("watchTrailer")}
        </DialogTitle>
        {open && videoId ? (
          <div className="relative aspect-video w-full min-h-[min(54vw,540px)] bg-black">
            <iframe
              key={videoId}
              src={youtubeEmbedUrl(videoId, { autoplay: true })}
              title={title ? `${title} trailer` : t("watchTrailer")}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
