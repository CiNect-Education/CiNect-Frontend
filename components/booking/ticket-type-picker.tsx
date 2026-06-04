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
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-gradient-to-br from-[#1a0f2e] via-[#120a22] to-[#0d0618] p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="mb-5 text-center text-lg font-bold tracking-wide text-white uppercase sm:text-xl">
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
              className="flex flex-col items-center gap-3 rounded-lg border border-white/25 px-4 py-5 text-center"
            >
              <div>
                <p className="text-base font-bold tracking-wide text-white uppercase">
                  {label}
                </p>
                {subLabel ? (
                  <p className="mt-0.5 text-sm font-semibold text-[#f3ea28] uppercase">
                    {subLabel}
                  </p>
                ) : null}
              </div>
              <p className="text-lg font-semibold text-white">
                {formatVnd(product.unitPrice, locale)}
              </p>
              <div className="flex items-center gap-0 overflow-hidden rounded border border-white/40 bg-white/10">
                <button
                  type="button"
                  className="flex h-9 w-10 items-center justify-center text-white transition hover:bg-white/15 disabled:opacity-40"
                  disabled={qty <= 0}
                  onClick={() => onChange(product.code, Math.max(0, qty - 1))}
                  aria-label={tb("decreaseTicket", { label })}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] px-2 text-center text-base font-semibold text-white">
                  {qty}
                </span>
                <button
                  type="button"
                  className="flex h-9 w-10 items-center justify-center text-white transition hover:bg-white/15"
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
