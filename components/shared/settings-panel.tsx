"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, Sun, Moon, Monitor, MapPin, Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CITIES = [
  { id: "hcm", name: "TP. Ho Chi Minh" },
  { id: "hn", name: "Ha Noi" },
  { id: "dn", name: "Da Nang" },
  { id: "hp", name: "Hai Phong" },
  { id: "ct", name: "Can Tho" },
  { id: "bd", name: "Binh Duong" },
  { id: "nt", name: "Nha Trang" },
  { id: "vt", name: "Vung Tau" },
];

const LOCALES = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇺🇸" },
];

export function SettingsPanel() {
  const t = useTranslations("nav");
  const { setTheme, theme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("selected_city");
    if (saved) setSelectedCity(saved);
  }, []);

  function handleCitySelect(cityId: string) {
    setSelectedCity(cityId);
    localStorage.setItem("selected_city", cityId);
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
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-left text-base">
            <Settings className="h-4 w-4 text-primary" />
            {t("settings")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-5">
          {/* Theme */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
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
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("city")}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {CITIES.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCitySelect(city.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    selectedCity === city.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{city.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
