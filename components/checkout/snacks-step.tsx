"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatVnd } from "@/lib/showtime-display";
import { resolveSnackImageUrl } from "@/lib/snack-images";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SnackItem } from "@/types/domain";
import { Minus, Plus } from "lucide-react";
import { RemoteImage } from "@/components/shared/remote-image";

interface SnacksStepProps {
  snacks: SnackItem[];
  selectedSnacks: Array<{ snackId: string; quantity: number }>;
  onSnackChange: (snackId: string, quantity: number) => void;
  onContinue: () => void;
  onSaveFavorite?: () => void;
  onApplyFavorite?: () => void;
  hasFavorite?: boolean;
}

export function SnacksStep({
  snacks,
  selectedSnacks,
  onSnackChange,
  onContinue,
  onSaveFavorite,
  onApplyFavorite,
  hasFavorite,
}: SnacksStepProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const getQuantity = (snackId: string) => {
    return selectedSnacks.find((s) => s.snackId === snackId)?.quantity || 0;
  };

  const hasSelection = selectedSnacks.some((s) => s.quantity > 0);

  const bestValueSnackId =
    snacks.find((snack) => snack.name.toLowerCase().includes("combo"))?.id ?? snacks[0]?.id;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {snacks.map((snack, index) => {
          const quantity = getQuantity(snack.id);
          const unitPrice = toNumber(
            (snack as { unitPrice?: unknown }).unitPrice ?? (snack as { price?: unknown }).price,
          );
          const imageSrc = resolveSnackImageUrl(snack);
          const tiltClass =
            index % 2 === 0 ? "cinect-snack-image-tilt-left" : "cinect-snack-image-tilt-right";

          return (
            <div
              key={snack.id}
              className={cn(
                "cinect-snack-card cinect-flow-interactive group flex flex-col overflow-hidden p-0 sm:min-h-[9.5rem] sm:flex-row",
                quantity > 0 && "cinect-flow-interactive-selected",
              )}
            >
              <div className="cinect-snack-image-stage shrink-0 sm:w-[8.75rem]">
                {imageSrc ? (
                  <div className={cn("cinect-snack-image-tilt", tiltClass)}>
                    <RemoteImage
                      src={imageSrc}
                      alt={snack.name}
                      width={108}
                      height={108}
                      className="h-[6.75rem] w-[6.75rem] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "cinect-snack-image-tilt bg-muted/30 flex h-[6.75rem] w-[6.75rem] items-center justify-center rounded-lg",
                      tiltClass,
                    )}
                    aria-hidden
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 pt-3 sm:pt-4">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-snug">{snack.name}</h3>
                  {snack.id === bestValueSnackId && (
                    <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                      {t("bestValue")}
                    </p>
                  )}
                  {snack.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">{snack.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold tabular-nums">
                    {formatVnd(unitPrice, locale)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSnackChange(snack.id, Math.max(0, quantity - 1))}
                      disabled={quantity === 0}
                      aria-label={t("decreaseSnack", { name: snack.name })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSnackChange(snack.id, quantity + 1)}
                      disabled={(snack as { available?: boolean }).available === false}
                      aria-label={t("increaseSnack", { name: snack.name })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 gap-2">
          {onSaveFavorite && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onSaveFavorite}
              disabled={!hasSelection}
            >
              {t("saveFavoriteCombo")}
            </Button>
          )}
          {onApplyFavorite && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onApplyFavorite}
              disabled={!hasFavorite}
            >
              {t("useFavoriteCombo")}
            </Button>
          )}
        </div>
        <div className="flex flex-1 gap-2">
          <Button type="button" className="flex-1" onClick={onContinue}>
            {t("continueToPayment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
