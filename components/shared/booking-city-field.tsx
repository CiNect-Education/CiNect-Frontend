"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type BookingCityOption = { id: string; label: string };

type Props = {
  cityOptions: BookingCityOption[];
  /** Selected city code, or "" for all */
  value: string;
  /** Label to show when value is set (from parent) */
  displayLabel: string;
  onChange: (cityId: string) => void;
  /** Narrow width for header/toolbar */
  compact?: boolean;
  className?: string;
};

/**
 * Stable city picker: only syncs display text when dropdown is closed (avoids input jumping while typing).
 */
export function BookingCityField({
  cityOptions,
  value,
  displayLabel,
  onChange,
  compact = false,
  className,
}: Props) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.label.toLowerCase().includes(q));
  })();

  useEffect(() => {
    if (open) return;
    setInputValue(displayLabel || "");
  }, [displayLabel, open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setInputValue(displayLabel || "");
        }
      }}
    >
      <PopoverTrigger asChild>
        <div className={cn("min-w-0", compact ? "max-w-[min(100%,11rem)] sm:max-w-[13rem]" : "w-full max-w-[min(100%,14rem)]", className)}>
          <Input
            value={inputValue}
            onFocus={() => {
              setOpen(true);
              setQuery(inputValue);
            }}
            onChange={(e) => {
              const v = e.target.value;
              setInputValue(v);
              setQuery(v);
              setOpen(true);
            }}
            placeholder={tCommon("allCities")}
            className={cn(
              "h-8 min-w-0 text-xs",
              compact && "px-2 py-1"
            )}
            autoComplete="off"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="z-[9999] max-h-60 w-[var(--radix-popover-trigger-width)] min-w-[10rem] overflow-auto p-0.5 text-xs"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <button
          type="button"
          className="hover:bg-accent text-muted-foreground hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            setInputValue("");
            setQuery("");
            setOpen(false);
          }}
        >
          {tCommon("allCities")}
        </button>
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(
              "hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left",
              value === c.id && "bg-accent"
            )}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(c.id);
              setInputValue(c.label);
              setQuery("");
              setOpen(false);
            }}
          >
            {c.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

type SegmentProps = {
  mode: "new" | "legacy";
  onChange: (mode: "new" | "legacy") => void;
  className?: string;
};

/** Compact 34 / 63 toggle — short labels, full text in title */
export function BookingAddressModeSegment({ mode, onChange, className }: SegmentProps) {
  const tCommon = useTranslations("common");

  return (
    <div
      className={cn(
        "bg-muted/50 inline-flex shrink-0 rounded-md border p-0.5",
        className
      )}
      role="group"
      aria-label={tCommon("addressSystem")}
    >
      <button
        type="button"
        title={tCommon("addressSystemNew")}
        onClick={() => onChange("new")}
        className={cn(
          "rounded px-2 py-0.5 text-[11px] font-semibold leading-tight transition sm:text-xs",
          mode === "new"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        34
      </button>
      <button
        type="button"
        title={tCommon("addressSystemLegacy")}
        onClick={() => onChange("legacy")}
        className={cn(
          "rounded px-2 py-0.5 text-[11px] font-semibold leading-tight transition sm:text-xs",
          mode === "legacy"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        63
      </button>
    </div>
  );
}
