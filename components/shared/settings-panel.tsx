"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bookingCityLabel,
  normalizeBookingCityId,
  persistSelectedBookingCity,
  SELECTED_CITY_STORAGE_KEY,
} from "@/lib/booking-region";
import { DetectRegionButton } from "@/components/shared/detect-region-button";
import {
  BookingAddressModeSegment,
  BookingCityField,
} from "@/components/shared/booking-city-field";
import { useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";

const LOCALES = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇺🇸" },
];

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export function SettingsPanel() {
  const t = useTranslations("nav");
  const { setTheme, theme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [addressMode, setAddressMode] = useState<"new" | "legacy">("new");
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();
  const provincesNew = useMemo(
    () => toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    [provincesRes?.data]
  );
  const provincesLegacy = useMemo(
    () =>
      toList<{
        code: string;
        nameVi: string;
        nameEn: string;
        provinceNew: { code: string; nameVi: string; nameEn: string };
      }>(legacyRes?.data),
    [legacyRes?.data]
  );
  const cityOptions = useMemo(() => {
    if (addressMode === "legacy" && provincesLegacy.length > 0) {
      return provincesLegacy.map((p) => ({
        id: p.code,
        label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
      }));
    }
    return provincesNew.map((p) => ({
      id: p.code,
      label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
    }));
  }, [addressMode, locale, provincesLegacy, provincesNew]);
  const cityLabel = useMemo(() => {
    if (!selectedCity) return "";
    return cityOptions.find((c) => c.id === selectedCity)?.label ?? bookingCityLabel(selectedCity, locale);
  }, [selectedCity, cityOptions, locale]);

  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
    if (saved) setSelectedCity(normalizeBookingCityId(saved));
  }, []);
  useEffect(() => {
    if (!selectedCity) return;
    if (provincesLegacy.some((p) => p.code === selectedCity)) {
      setAddressMode("legacy");
      return;
    }
    if (provincesNew.some((p) => p.code === selectedCity)) {
      setAddressMode("new");
    }
  }, [selectedCity, provincesLegacy, provincesNew]);

  function handleCitySelect(cityId: string) {
    const normalized = normalizeBookingCityId(cityId);
    setSelectedCity(normalized);
    persistSelectedBookingCity(normalized);
  }
  function handleAddressModeChange(nextMode: "new" | "legacy") {
    setAddressMode(nextMode);
    if (!selectedCity) return;
    const existsInNext =
      nextMode === "legacy"
        ? provincesLegacy.some((p) => p.code === selectedCity)
        : provincesNew.some((p) => p.code === selectedCity);
    if (!existsInNext) handleCitySelect("");
  }

  function handleLocaleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale as "vi" | "en" });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t("settings")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-80 flex-col p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-left text-base">
            <Settings className="text-primary h-4 w-4" />
            {t("settings")}
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-6">
          {/* Theme */}
          <div>
            <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              {t("theme")}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", icon: Sun, label: t("lightMode") },
                { value: "dark", icon: Moon, label: t("darkMode") },
                { value: "system", icon: Monitor, label: t("systemMode") },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs font-medium transition-all",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              {t("language")}
            </h4>
            <div className="flex flex-col gap-1.5">
              {LOCALES.map(({ id, label, flag }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleLocaleChange(id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    locale === id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{flag}</span>
                  {label}
                  {locale === id && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              {t("city")}
            </h4>
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5">
              <BookingAddressModeSegment mode={addressMode} onChange={handleAddressModeChange} />
              <BookingCityField
                cityOptions={cityOptions}
                value={selectedCity}
                displayLabel={cityLabel}
                onChange={handleCitySelect}
                compact
                className="min-w-0 flex-1"
              />
            </div>
            <div className="mb-1">
              <DetectRegionButton
                className="w-full"
                showLabel
                labelAlwaysVisible
                onApplied={(cityId) => handleCitySelect(cityId)}
              />
            </div>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
