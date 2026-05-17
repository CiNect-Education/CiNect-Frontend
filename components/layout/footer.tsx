"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { CinectBrandLogo } from "@/components/branding/cinect-brand-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCinemas } from "@/hooks/queries/use-cinemas";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Facebook, Gift, Instagram, Ticket, Youtube } from "lucide-react";
import type { CinemaListItem } from "@/types/domain";

const LOCALES = [
  { id: "vi" as const, label: "VN", flag: "🇻🇳" },
  { id: "en" as const, label: "EN", flag: "🇬🇧" },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://youtube.com", label: "YouTube", icon: Youtube },
];

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="cinect-footer-heading">{title}</h4>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="cinect-footer-link">
        {children}
      </Link>
    </li>
  );
}

function FooterCinemaList() {
  const t = useTranslations("footer");
  const { data, isLoading } = useCinemas();
  const cinemas = (data?.data ?? data ?? []) as CinemaListItem[];

  return (
    <div className="xl:col-span-3">
      <h4 className="cinect-footer-heading">{t("cinemaSystem")}</h4>
      {isLoading ? (
        <p className="text-sm text-white/60">{t("cinemasLoading")}</p>
      ) : cinemas.length === 0 ? (
        <p className="text-sm text-white/60">{t("cinemasEmpty")}</p>
      ) : (
        <ul className="cinect-footer-cinema-list space-y-0.5">
          {cinemas.map((cinema) => (
            <li key={cinema.id}>
              <Link
                href={`/cinemas/${cinema.slug || cinema.id}`}
                className="cinect-footer-link text-[0.8125rem] leading-snug"
              >
                {cinema.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/cinemas" className="cinect-footer-link mt-3 text-sm font-semibold text-primary">
        {t("viewAllCinemas")} →
      </Link>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <footer className="cinect-footer border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 xl:gap-8">
          <div className="space-y-5 sm:col-span-2 xl:col-span-3">
            <Link href="/" className="inline-flex">
              <CinectBrandLogo size="footer" surface="on-dark" plain />
              <span className="sr-only">CiNect</span>
            </Link>
            <p className="font-display text-sm font-bold tracking-wide text-white uppercase">
              {t("brandSlogan")}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">{t("brandTagline")}</p>

            <div className="flex flex-wrap gap-2.5">
              <Button asChild variant="cta" size="sm" className="h-10 px-5 font-bold uppercase">
                <Link href="/showtimes">
                  <Ticket className="h-4 w-4" />
                  {t("bookTickets")}
                </Link>
              </Button>
              <Button asChild variant="outlineLight" size="sm" className="h-10 px-5">
                <Link href="/gift">
                  <Gift className="h-4 w-4" />
                  {t("bookGifts")}
                </Link>
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-white/55 uppercase">
                {t("followUs")}
              </p>
              <div className="flex gap-2">
                {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-primary/50 hover:bg-white/10 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-white/55">{t("language")}:</span>
              {LOCALES.map(({ id, label, flag }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => router.replace(pathname, { locale: id })}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                    locale === id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/25 text-white/80 hover:border-white/40 hover:text-white"
                  )}
                >
                  <span aria-hidden>{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FooterColumn title={t("account")}>
            {isAuthenticated ? (
              <>
                <FooterLink href="/account/profile">{t("myProfile")}</FooterLink>
                <FooterLink href="/account/orders">{t("myOrders")}</FooterLink>
                <FooterLink href="/account/membership">{t("membership")}</FooterLink>
              </>
            ) : (
              <>
                <FooterLink href="/login">{t("login")}</FooterLink>
                <FooterLink href="/register">{t("register")}</FooterLink>
                <FooterLink href="/membership">{t("membership")}</FooterLink>
              </>
            )}
          </FooterColumn>

          <FooterColumn title={t("watchMovies")}>
            <FooterLink href="/movies">{t("nowShowing")}</FooterLink>
            <FooterLink href="/showtimes">{t("showtimes")}</FooterLink>
            <FooterLink href="/promotions">{t("promotions")}</FooterLink>
            <FooterLink href="/cinemas">{tNav("cinemas")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("cinect")}>
            <FooterLink href="/support">{t("about")}</FooterLink>
            <FooterLink href="/support">{t("contact")}</FooterLink>
            <FooterLink href="/support">{t("careers")}</FooterLink>
            <FooterLink href="/news">{t("news")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("otherServices")}>
            <FooterLink href="/gift">{t("gift")}</FooterLink>
            <FooterLink href="/campaigns">{t("campaigns")}</FooterLink>
            <FooterLink href="/membership">{t("membership")}</FooterLink>
            <FooterLink href="/support">{t("support")}</FooterLink>
          </FooterColumn>

          <FooterCinemaList />
        </div>

        <Separator className="my-8 bg-white/15" />

        <div className="flex flex-col gap-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("copyright", { year })}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/support" className="hover:text-primary">
              {t("bottomPrivacy")}
            </Link>
            <Link href="/news" className="hover:text-primary">
              {t("bottomNews")}
            </Link>
            <Link href="/support" className="hover:text-primary">
              {t("bottomFaq")}
            </Link>
            <Link href="/support" className="hover:text-primary">
              {t("terms")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
