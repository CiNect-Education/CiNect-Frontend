"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/shared/remote-image";
import { useDismissReviewPrompt, usePendingReviewPrompts } from "@/hooks/queries/use-community";
import { useAuth } from "@/providers/auth-provider";
import { Gift } from "lucide-react";

export function PostShowReviewPrompt() {
  const t = useTranslations("community");
  const { isAuthenticated } = useAuth();
  const { data } = usePendingReviewPrompts(isAuthenticated);
  const dismiss = useDismissReviewPrompt();
  const [open, setOpen] = useState(false);

  const prompts = data?.data ?? [];
  const current = prompts[0];

  useEffect(() => {
    if (current) setOpen(true);
  }, [current?.bookingId]);

  if (!isAuthenticated || !current) return null;

  const movie = current.movie;
  const movieHref = movie?.slug
    ? `/movies/${movie.slug}#community`
    : movie?.id
      ? `/movies/${movie.id}#community`
      : "/community";

  async function handleDismiss() {
    await dismiss.mutateAsync({ bookingId: current!.bookingId });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="text-primary h-5 w-5" />
            {t("postShowPromptTitle")}
          </DialogTitle>
          <DialogDescription>{t("postShowPromptDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          {movie?.posterUrl ? (
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              <RemoteImage
                src={movie.posterUrl}
                alt={movie.title ?? ""}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="font-medium">{movie?.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t("postShowPromptPoints")}</p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={handleDismiss} disabled={dismiss.isPending}>
            {t("postShowPromptLater")}
          </Button>
          <Button asChild onClick={() => setOpen(false)}>
            <Link href={movieHref}>{t("postShowPromptWrite")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
