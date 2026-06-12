"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatVnd } from "@/lib/showtime-display";
import type { HoldSeatGroup } from "@/types/domain";
import type { SeatDisplayUnit } from "@/lib/seat-selection";
import { Badge } from "@/components/ui/badge";

type Unit = SeatDisplayUnit | HoldSeatGroup;

interface SeatSelectionListProps {
  units: Unit[];
  showPrice?: boolean;
  compact?: boolean;
}

export function SeatSelectionList({ units, showPrice = true, compact = false }: SeatSelectionListProps) {
  const tb = useTranslations("booking");
  const locale = useLocale();
  const fmt = (n: number) => formatVnd(n, locale);

  const typeLabel = (type: string) => {
    if (type === "VIP") return tb("vip");
    if (type === "COUPLE") return tb("coupleSeatType");
    if (type === "DISABLED") return tb("disabled");
    return tb("standard");
  };

  return (
    <ul className={compact ? "space-y-1.5 text-xs" : "space-y-2 text-sm"}>
      {units.map((unit) => (
        <li key={`${unit.kind}-${unit.label}`} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {unit.kind === "couple"
                  ? tb("coupleSeatLabel", { label: unit.label })
                  : unit.label}
              </span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {typeLabel(unit.seatType)}
              </Badge>
            </div>
          </div>
          {showPrice && unit.price > 0 ? (
            <span className="shrink-0 font-medium tabular-nums">{fmt(unit.price)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
