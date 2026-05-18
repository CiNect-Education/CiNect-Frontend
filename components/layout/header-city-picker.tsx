"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  bookingCityLabel,
  normalizeBookingCityId,
  persistSelectedBookingCity,
  SELECTED_CITY_STORAGE_KEY,
  BOOKING_CITY_CHANGED_EVENT,
} from "@/lib/booking-region";
import { useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export function HeaderCityPicker({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [selectedCity, setSelectedCity] = useState("");
  const [query, setQuery] = useState("");
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();

  const provincesNew = useMemo(
    () => toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    [provincesRes?.data]
  );
  const provincesLegacy = useMemo(
    () =>
      toList<{ code: string; nameVi: string; nameEn: string }>(legacyRes?.data),
    [legacyRes?.data]
  );

  const cityOptions = useMemo(() => {
    const source = provincesNew.length > 0 ? provincesNew : provincesLegacy;
    return source.map((p) => ({
      id: p.code,
      label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
    }));
  }, [locale, provincesLegacy, provincesNew]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.label.toLowerCase().includes(q));
  }, [cityOptions, query]);

  const displayLabel = useMemo(() => {
    if (!selectedCity) return t("selectCity");
    return (
      cityOptions.find((c) => c.id === selectedCity)?.label ??
      bookingCityLabel(selectedCity, locale)
    );
  }, [selectedCity, cityOptions, locale, t]);

  useEffect(() => {
    function sync() {
      const saved = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
      if (saved) setSelectedCity(normalizeBookingCityId(saved));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(BOOKING_CITY_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(BOOKING_CITY_CHANGED_EVENT, sync);
    };
  }, []);

  function selectCity(cityId: string) {
    const normalized = normalizeBookingCityId(cityId);
    setSelectedCity(normalized);
    persistSelectedBookingCity(normalized);
    setQuery("");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "cinect-header-sub-link flex items-center gap-1.5 text-sm font-semibold outline-none",
          className
        )}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#f3ea28]" />
        <span className="max-w-[10rem] truncate">{displayLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("selectCity")}
          className="mb-2 h-9"
        />
        <div className="max-h-56 overflow-y-auto">
          <DropdownMenuItem
            onClick={() => selectCity("")}
            className="cursor-pointer font-medium"
          >
            {tCommon("allCities")}
          </DropdownMenuItem>
          {filtered.map((city) => (
            <DropdownMenuItem
              key={city.id}
              onClick={() => selectCity(city.id)}
              className={cn(
                "cursor-pointer",
                selectedCity === city.id && "bg-primary/10 text-primary"
              )}
            >
              {city.label}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
