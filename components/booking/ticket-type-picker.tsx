"use client";

import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/showtime-display";
import type { TicketProductCode } from "@/types/domain";

export interface TicketProductOption {
  code: TicketProductCode;
  labelVi: string;
  labelEn: string;
  subLabelVi?: string | null;
  subLabelEn?: string | null;
  seatsPerUnit: number;
  unitPrice: number;
}

interface TicketTypePickerProps {
  products: TicketProductOption[];
  quantities: Partial<Record<TicketProductCode, number>>;
  onChange: (code: TicketProductCode, quantity: number) => void;
  className?: string;
}

export function TicketTypePicker({
  products,
  quantities,
  onChange,
  className,
}: TicketTypePickerProps) {
  const tb = useTranslations("booking");
  const locale = useLocale();
  const isVi = locale.startsWith("vi");

  return (
    <section className={cn("space-y-5 py-2", className)}>
      <h2 className="text-center text-lg font-bold tracking-wide uppercase sm:text-xl">
        {tb("selectTicketTypes")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {products.map((product) => {
          const qty = quantities[product.code] ?? 0;
          const label = isVi ? product.labelVi : product.labelEn;
          const subLabel = isVi
            ? (product.subLabelVi ?? product.subLabelEn)
            : (product.subLabelEn ?? product.subLabelVi);

          return (
            <div
              key={product.code}
              className="flex flex-col items-center px-4 py-5 text-center"
            >
              <div className="flex min-h-[3.25rem] w-full flex-col items-center justify-center">
                <p className="line-clamp-2 text-base leading-snug font-bold tracking-wide uppercase">
                  {label}
                </p>
              </div>
              <div className="mt-1 flex min-h-[1.25rem] items-center justify-center">
                {subLabel ? (
                  <p className="text-primary text-sm font-semibold uppercase">{subLabel}</p>
                ) : null}
              </div>
              <p className="mt-3 text-lg font-semibold tabular-nums">
                {formatVnd(product.unitPrice, locale)}
              </p>
              <div className="border-border/40 bg-muted/20 mt-3 flex items-center gap-0 overflow-hidden rounded-md border">
                <button
                  type="button"
                  className="hover:bg-muted/50 flex h-9 w-10 items-center justify-center transition disabled:opacity-40"
                  disabled={qty <= 0}
                  onClick={() => onChange(product.code, Math.max(0, qty - 1))}
                  aria-label={tb("decreaseTicket", { label })}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] px-2 text-center text-base font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  className="hover:bg-muted/50 flex h-9 w-10 items-center justify-center transition"
                  onClick={() => onChange(product.code, qty + 1)}
                  aria-label={tb("increaseTicket", { label })}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function requiredSeatCountFromTickets(
  products: TicketProductOption[],
  quantities: Partial<Record<TicketProductCode, number>>,
): number {
  return products.reduce((sum, p) => {
    const q = quantities[p.code] ?? 0;
    return sum + q * p.seatsPerUnit;
  }, 0);
}

export function ticketLinesTotal(
  products: TicketProductOption[],
  quantities: Partial<Record<TicketProductCode, number>>,
): number {
  return products.reduce((sum, p) => {
    const q = quantities[p.code] ?? 0;
    return sum + q * p.unitPrice;
  }, 0);
}

export function buildTicketLinesPayload(
  quantities: Partial<Record<TicketProductCode, number>>,
): { productCode: TicketProductCode; quantity: number }[] {
  return (Object.entries(quantities) as [TicketProductCode, number][])
    .filter(([, q]) => q > 0)
    .map(([productCode, quantity]) => ({ productCode, quantity }));
}
