"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CinestarNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  title?: string | null;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/** Modal thông báo kiểu Cinestar (gradient tím–xanh, nút viền vàng). */
export function CinestarNoticeDialog({
  open,
  onOpenChange,
  message,
  title,
  showCancel = false,
  onConfirm,
  onCancel,
}: CinestarNoticeDialogProps) {
  const tb = useTranslations("booking");
  const tCommon = useTranslations("common");

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    if (showCancel) {
      onCancel?.();
    }
    onOpenChange(false);
  };

  const resolvedTitle = title === undefined ? tb("cinestarNoticeTitle") : title;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby="cinestar-notice-message"
        className={cn(
          "max-w-[22rem] gap-0 border-0 p-0 shadow-2xl sm:rounded-sm",
          "bg-gradient-to-r from-[#7b2cbf] via-[#5a4fcf] to-[#3a86ff]",
          "[&>button]:hidden",
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="px-8 py-10 text-center text-white">
          {resolvedTitle ? (
            <DialogTitle className="text-xl font-bold tracking-wide text-white uppercase">
              {resolvedTitle}
            </DialogTitle>
          ) : (
            <DialogTitle className="sr-only">{tb("cinestarNoticeTitle")}</DialogTitle>
          )}
          <p
            id="cinestar-notice-message"
            className={cn(
              "text-base leading-relaxed text-white/95",
              resolvedTitle ? "mt-5" : "mt-0",
            )}
          >
            {message}
          </p>
          <div
            className={cn(
              "mt-8 flex justify-center gap-3",
              showCancel ? "flex-row" : "",
            )}
          >
            {showCancel && (
              <button
                type="button"
                className="min-w-[5.5rem] rounded border-2 border-[#f3ea28] bg-transparent px-5 py-1.5 text-sm font-bold tracking-wide text-[#f3ea28] uppercase transition hover:bg-[#f3ea28]/10"
                onClick={() => {
                  onCancel?.();
                  onOpenChange(false);
                }}
              >
                {tCommon("cancel")}
              </button>
            )}
            <button
              type="button"
              className="min-w-[5.5rem] rounded border-2 border-[#f3ea28] bg-transparent px-6 py-1.5 text-sm font-bold tracking-wide text-[#f3ea28] uppercase transition hover:bg-[#f3ea28]/10"
              onClick={() => {
                onConfirm?.();
                onOpenChange(false);
              }}
            >
              {tb("ok")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
