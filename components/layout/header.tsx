"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CitySelector } from "@/components/shared/city-selector";
import { DemoBackendBadge } from "@/components/shared/demo-backend-badge";
import { UserMenu } from "@/components/shared/user-menu";
import { GlobalSearch } from "@/components/shared/global-search";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { key: "movies", href: "/movies" },
  { key: "showtimes", href: "/showtimes" },
  { key: "cinemas", href: "/cinemas" },
  { key: "promotions", href: "/promotions" },
  { key: "campaigns", href: "/campaigns" },
  { key: "membership", href: "/membership" },
  { key: "gift", href: "/gift" },
  { key: "news", href: "/news" },
  { key: "support", href: "/support" },
] as const;

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        {/* Mobile nav */}
        <div className="lg:hidden">
          <MobileNav />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <Film className="h-6 w-6 text-primary" />
          <span className="hidden text-lg sm:inline">CinemaConnect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 lg:flex lg:items-center lg:justify-center">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">
          <DemoBackendBadge />
          <GlobalSearch />
          <CitySelector />
          <div className="hidden sm:flex sm:items-center sm:gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
