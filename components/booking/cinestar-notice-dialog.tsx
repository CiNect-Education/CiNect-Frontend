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
  title?: string;
}

/** Modal thông báo kiểu Cinestar (gradient tím–xanh, nút OK viền vàng). */
export function CinestarNoticeDialog({
  open,
  onOpenChange,
  message,
  title,
}: CinestarNoticeDialogProps) {
  const tb = useTranslations("booking");

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    onOpenChange(false);
  };

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
          <DialogTitle className="text-xl font-bold tracking-wide text-white uppercase">
            {title ?? tb("cinestarNoticeTitle")}
          </DialogTitle>
          <p
            id="cinestar-notice-message"
            className="mt-5 text-base leading-relaxed text-white/95"
          >
            {message}
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="min-w-[5.5rem] rounded border-2 border-[#f3ea28] bg-transparent px-6 py-1.5 text-base font-bold text-[#f3ea28] transition hover:bg-[#f3ea28]/10"
              onClick={() => onOpenChange(false)}
            >
              {tb("ok")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
