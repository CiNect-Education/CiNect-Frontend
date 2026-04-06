"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SELECTED_CITY_STORAGE_KEY,
  buildBookingCityOptions,
  normalizeBookingCityId,
  persistSelectedBookingCity,
} from "@/lib/booking-region";
import { useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export function CitySelector() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();
  const cityOptions = buildBookingCityOptions(
    locale,
    toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    toList<{
      code: string;
      nameVi: string;
      nameEn: string;
      provinceNew: { code: string; nameVi: string; nameEn: string };
    }>(legacyRes?.data)
  );

  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
    if (saved) setSelectedCity(normalizeBookingCityId(saved));
  }, []);

  function handleSelect(cityId: string) {
    const normalized = normalizeBookingCityId(cityId);
    setSelectedCity(normalized);
    persistSelectedBookingCity(normalized);
  }

  const currentCity = cityOptions.find((c) => c.id === selectedCity);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentCity ? currentCity.label : t("selectCity")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {cityOptions.map((city) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => handleSelect(city.id)}
            className={selectedCity === city.id ? "bg-accent" : ""}
          >
            {city.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
