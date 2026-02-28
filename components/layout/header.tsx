"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Film, Ticket, MapPin } from "lucide-react";
import { UserMenu } from "@/components/shared/user-menu";
import { GlobalSearch } from "@/components/shared/global-search";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { MobileNav } from "./mobile-nav";

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
  const [cityName, setCityName] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("selected_city");
    if (saved) {
      const city = CITIES.find((c) => c.id === saved);
      if (city) setCityName(city.name);
    }

    function onStorage() {
      const val = localStorage.getItem("selected_city");
      const city = CITIES.find((c) => c.id === val);
      setCityName(city?.name || "");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ─── Top Bar ─── */}
      <div className="border-border/50 bg-background/95 hidden border-b shadow-sm lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 lg:px-6">
          {/* Left: city + secondary links */}
          <div className="flex items-center gap-4">
            {cityName && (
              <span className="text-foreground/90 flex items-center gap-1 text-xs font-medium">
                <MapPin className="h-3 w-3" />
                {cityName}
              </span>
            )}
            <span className="text-border">|</span>
            <nav className="flex items-center gap-1">
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-foreground/85 hover:text-foreground rounded px-2 py-1 text-xs font-medium transition-colors"
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: user + settings */}
          <div className="flex items-center gap-2">
            <UserMenu />
            <SettingsPanel />
          </div>
        </div>
      </div>

      {/* ─── Main Nav Bar ─── */}
      <div className="border-border/50 bg-background/95 border-b shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:px-6">
          {/* Mobile nav trigger */}
          <div className="lg:hidden">
            <MobileNav />
          </div>

          {/* Logo */}
          <Link href="/" className="text-foreground flex items-center gap-2.5 font-bold">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Film className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="hidden text-lg tracking-tight sm:inline">CiNect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 lg:flex lg:items-center lg:justify-center">
            <ul className="flex items-center">
              {CORE_NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-foreground/90 hover:text-foreground after:bg-primary relative px-4 py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:transition-all hover:after:w-2/3"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right side: search + book now */}
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />

            {/* Mobile: settings + user */}
            <div className="flex items-center gap-1 lg:hidden">
              <SettingsPanel />
              <UserMenu />
            </div>

            {/* Desktop: Book Now CTA */}
            <Button asChild size="sm" className="hidden gap-2 lg:inline-flex">
              <Link href="/showtimes">
                <Ticket className="h-4 w-4" />
                {t("bookNow")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
