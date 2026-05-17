"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Ticket, MapPin, Popcorn } from "lucide-react";
import { CinectBrandLogo } from "@/components/branding/cinect-brand-logo";
import { UserMenu } from "@/components/shared/user-menu";
import { GlobalSearch } from "@/components/shared/global-search";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { MobileNav } from "./mobile-nav";
import { ClientOnly } from "@/components/system/client-only";
import { cn } from "@/lib/utils";
import {
  BOOKING_CITY_CHANGED_EVENT,
  SELECTED_CITY_STORAGE_KEY,
} from "@/lib/booking-region";

const CORE_NAV = [
  { key: "movies", href: "/movies" },
  { key: "showtimes", href: "/showtimes" },
  { key: "cinemas", href: "/cinemas" },
  { key: "promotions", href: "/promotions" },
  { key: "news", href: "/news" },
] as const;

const SECONDARY_NAV = [
  { key: "campaigns", href: "/campaigns" },
  { key: "membership", href: "/membership" },
  { key: "gift", href: "/gift" },
  { key: "support", href: "/support" },
] as const;

const CITIES = [
  { id: "hcm", name: "TP. HCM" },
  { id: "hn", name: "Hà Nội" },
  { id: "dn", name: "Đà Nẵng" },
  { id: "hp", name: "Hải Phòng" },
  { id: "ct", name: "Cần Thơ" },
  { id: "bd", name: "Bình Dương" },
  { id: "nt", name: "Nha Trang" },
  { id: "vt", name: "Vũng Tàu" },
];

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const path = pathname.replace(/^\/(vi|en)/, "") || "/";
  const [cityName, setCityName] = useState<string>("");

  useEffect(() => {
    function syncCityLabel() {
      const val = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
      const city = CITIES.find((c) => c.id === val);
      setCityName(city?.name || "");
    }
    syncCityLabel();

    function onStorage() {
      syncCityLabel();
    }
    function onLocalChange() {
      syncCityLabel();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(BOOKING_CITY_CHANGED_EVENT, onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BOOKING_CITY_CHANGED_EVENT, onLocalChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar (Cinestar secondary links) */}
      <div className="cinect-header-top hidden border-b lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {cityName && (
              <span className="text-foreground/90 flex items-center gap-1 text-xs font-semibold">
                <MapPin className="h-3 w-3 text-primary" />
                {cityName}
              </span>
            )}
            {cityName && <span className="text-border/80">|</span>}
            <nav className="flex items-center gap-1">
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary rounded px-2 py-1 text-xs font-semibold transition-colors"
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ClientOnly>
              <UserMenu />
            </ClientOnly>
            <ClientOnly>
              <SettingsPanel />
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* Main bar: logo + CTA + search (Cinestar style) */}
      <div className="cinect-header-main border-b">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-2 px-3 sm:h-[4.75rem] sm:gap-3 sm:px-4 lg:px-6">
          <div className="lg:hidden">
            <MobileNav />
          </div>

          <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
            <CinectBrandLogo size="header" priority />
            <span className="sr-only">CiNect</span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="cta" size="sm" className="gap-1.5 px-4">
              <Link href="/showtimes">
                <Ticket className="h-4 w-4" />
                {t("bookNow")}
              </Link>
            </Button>
            <Button asChild variant="purple" size="sm" className="gap-1.5 px-4">
              <Link href="/gift">
                <Popcorn className="h-4 w-4" />
                {t("gift")}
              </Link>
            </Button>
          </div>

          <div className="mx-1 hidden min-w-0 flex-1 md:block lg:mx-3">
            <ClientOnly>
              <GlobalSearch />
            </ClientOnly>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <ClientOnly>
              <GlobalSearch />
            </ClientOnly>
            <ClientOnly>
              <SettingsPanel />
            </ClientOnly>
            <ClientOnly>
              <UserMenu />
            </ClientOnly>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <Button asChild variant="cta" size="sm" className="gap-1.5 px-3">
              <Link href="/showtimes">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">{t("bookNow")}</span>
              </Link>
            </Button>
            <Button asChild variant="purple" size="sm" className="gap-1.5 px-3">
              <Link href="/gift" aria-label={t("gift")}>
                <Popcorn className="h-4 w-4" />
                <span className="sr-only">{t("gift")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Core nav strip */}
      <div className="cinect-header-nav hidden border-b border-white/10 lg:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-center px-4 lg:px-6">
          <nav>
            <ul className="flex items-center">
              {CORE_NAV.map((item) => {
                const active =
                  path === item.href || (item.href !== "/" && path.startsWith(item.href));
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      data-active={active ? "true" : undefined}
                      className={cn(
                        "cinect-nav-link px-5 py-2.5 text-sm",
                        active ? "text-primary" : "text-[hsl(var(--header-nav-foreground)/0.88)]",
                        "hover:text-primary"
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
