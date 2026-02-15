"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Film } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Film className="h-5 w-5 text-primary" />
              <span>CinemaConnect</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Trai nghiem dien anh dinh cao. Dat ve truc tuyen, nhanh chong va
              tien loi.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("about")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  {t("careers")}
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("terms")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("contact")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/support" className="transition-colors hover:text-foreground">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link href="/support" className="transition-colors hover:text-foreground">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Follow Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  X (Twitter)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
