"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SnackItem } from "@/types/domain";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";

interface SnacksStepProps {
  snacks: SnackItem[];
  selectedSnacks: Array<{ snackId: string; quantity: number }>;
  onSnackChange: (snackId: string, quantity: number) => void;
  onSkip: () => void;
  onContinue: () => void;
  onSaveFavorite?: () => void;
  onApplyFavorite?: () => void;
  hasFavorite?: boolean;
}

export function SnacksStep({
  snacks,
  selectedSnacks,
  onSnackChange,
  onSkip,
  onContinue,
  onSaveFavorite,
  onApplyFavorite,
  hasFavorite,
}: SnacksStepProps) {
  const getQuantity = (snackId: string) => {
    return selectedSnacks.find((s) => s.snackId === snackId)?.quantity || 0;
  };

  const hasSelection = selectedSnacks.some((s) => s.quantity > 0);

  // Simple heuristic: mark the first snack whose name contains \"combo\" as Best value
  const bestValueSnackId =
    snacks.find((snack) => snack.name.toLowerCase().includes("combo"))?.id ?? snacks[0]?.id;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {snacks.map((snack) => {
          const quantity = getQuantity(snack.id);
          return (
            <Card key={snack.id} className="p-4">
              <div className="flex gap-4">
                {snack.imageUrl && (
                  <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                    <Image src={snack.imageUrl} alt={snack.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold">{snack.name}</h3>
                    {snack.id === bestValueSnackId && (
                      <p className="text-emerald-600 text-xs font-semibold">Best value</p>
                    )}
                    {snack.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {snack.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      $
                      {(
                        (snack as { unitPrice?: number }).unitPrice ??
                        (snack as { price?: number }).price ??
                        0
                      ).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSnackChange(snack.id, Math.max(0, quantity - 1))}
                        disabled={quantity === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSnackChange(snack.id, quantity + 1)}
                        disabled={(snack as { available?: boolean }).available === false}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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
              Save as favorite
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
              Use favorite
            </Button>
          )}
        </div>
        <div className="flex flex-1 gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onSkip}>
            Skip
          </Button>
          <Button type="button" className="flex-1" onClick={onContinue}>
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
