"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Ticket, MapPin, Gift, Building2 } from "lucide-react";
import { CinectBrandLogo } from "@/components/branding/cinect-brand-logo";
import { UserMenu } from "@/components/shared/user-menu";
import { GlobalSearch } from "@/components/shared/global-search";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { MobileNav } from "./mobile-nav";
import { HeaderLocaleSwitcher } from "./header-locale-switcher";
import { HeaderCityPicker } from "./header-city-picker";
import { ClientOnly } from "@/components/system/client-only";
import { cn } from "@/lib/utils";

const BOTTOM_RIGHT_NAV = [
  { key: "promotions", href: "/promotions" },
  { key: "campaigns", href: "/campaigns" },
  { key: "gift", href: "/gift" },
  { key: "support", href: "/support" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const path = pathname.replace(/^\/(vi|en)/, "") || "/";

  return (
    <header className="cinect-header-shell sticky top-0 z-50 w-full">
      <div className="cinect-header-main border-b border-white/10">
        <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center gap-2 px-3 sm:h-[4.5rem] sm:gap-3 sm:px-5 lg:px-8">
          <div className="shrink-0 lg:hidden">
            <MobileNav />
          </div>

          <Link href="/" className="flex shrink-0 items-center">
            <CinectBrandLogo size="header" surface="on-dark" priority plain />
            <span className="sr-only">CiNect</span>
          </Link>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Button asChild variant="cta" size="sm" className="h-9 gap-1.5 px-3.5 text-xs">
              <Link href="/showtimes">
                <Ticket className="h-4 w-4" />
                {t("bookNow")}
              </Link>
            </Button>
            <Button asChild variant="purple" size="sm" className="h-9 gap-1.5 px-3.5 text-xs">
              <Link href="/gift">
                <Gift className="h-4 w-4" />
                {t("gift")}
              </Link>
            </Button>
          </div>

          <div className="hidden min-w-0 flex-1 lg:block lg:max-w-2xl lg:px-2">
            <ClientOnly>
              <GlobalSearch variant="header" />
            </ClientOnly>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
            <div className="lg:hidden">
              <ClientOnly>
                <GlobalSearch variant="icon" className="text-white hover:bg-white/10" />
              </ClientOnly>
            </div>
            <div className="hidden lg:block">
              <ClientOnly>
                <SettingsPanel triggerClassName="text-white hover:text-[#f3ea28]" />
              </ClientOnly>
            </div>
            <ClientOnly>
              <UserMenu variant="header" />
            </ClientOnly>
            <ClientOnly>
              <HeaderLocaleSwitcher />
            </ClientOnly>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
            <Button asChild variant="cta" size="sm" className="h-8 gap-1 px-2.5 text-[0.65rem]">
              <Link href="/showtimes">
                <Ticket className="h-3.5 w-3.5" />
                <span className="max-[380px]:sr-only">{t("bookNow")}</span>
              </Link>
            </Button>
            <Button asChild variant="purple" size="sm" className="h-8 gap-1 px-2.5 text-[0.65rem]">
              <Link href="/gift" aria-label={t("gift")}>
                <Gift className="h-3.5 w-3.5" />
                <span className="sr-only">{t("gift")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="cinect-header-sub hidden border-b border-white/10 lg:block">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <nav className="flex items-center gap-6">
            <ClientOnly>
              <HeaderCityPicker />
            </ClientOnly>
            <Link
              href="/cinemas"
              className={cn(
                "cinect-header-sub-link flex items-center gap-1.5 text-sm font-semibold",
                path.startsWith("/cinemas") && "text-[#f3ea28]"
              )}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#f3ea28]" />
              {t("selectCinema")}
            </Link>
            <Link
              href="/showtimes"
              className={cn(
                "cinect-header-sub-link flex items-center gap-1.5 text-sm font-semibold",
                path.startsWith("/showtimes") && "text-[#f3ea28]"
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#f3ea28]" />
              {t("showtimes")}
            </Link>
          </nav>
          <nav className="flex items-center gap-5 xl:gap-7">
            {BOTTOM_RIGHT_NAV.map((item) => {
              const active = path === item.href || path.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "cinect-header-sub-link text-sm font-semibold whitespace-nowrap",
                    active && "text-[#f3ea28]"
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
