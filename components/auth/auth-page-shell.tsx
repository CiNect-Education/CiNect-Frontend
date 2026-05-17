"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Same assets as cinestar.com.vn login/register (saved under public/auth/). */
const AUTH_BG_DESKTOP = "/auth/bg-regis.jpg";
const AUTH_BG_MOBILE = "/auth/bg-regis-mobi.jpg";

type AuthTab = "login" | "register";

export function AuthPageShell({
  activeTab,
  children,
}: {
  activeTab: AuthTab;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");

  return (
    <section className="relative min-h-[min(760px,calc(100vh-9rem))] w-full overflow-hidden">
      <div className="cinect-auth-bg-layer bg-slate-950" aria-hidden>
        <div className="absolute inset-0">
          <Image
            src={AUTH_BG_DESKTOP}
            alt=""
            fill
            priority
            className="cinect-auth-bg-image hidden md:block"
            sizes="100vw"
          />
          <Image
            src={AUTH_BG_MOBILE}
            alt=""
            fill
            priority
            className="cinect-auth-bg-image md:hidden"
            sizes="100vw"
          />
        </div>
        <div className="cinect-auth-bg-tint absolute inset-0" />
        <div className="cinect-auth-bg-vignette absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-[inherit] max-w-7xl items-center px-4 py-8 sm:py-12 lg:px-8">
        <div className="w-full max-w-[440px]">
          <div className="flex">
            <Link
              href="/login"
              className={cn(
                "flex-1 px-3 py-3 text-center text-xs font-bold tracking-wide uppercase sm:px-4 sm:text-sm",
                activeTab === "login"
                  ? "cinect-auth-tab-active rounded-tl-lg"
                  : "cinect-auth-tab-inactive rounded-tl-lg"
              )}
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className={cn(
                "flex-1 px-3 py-3 text-center text-xs font-bold tracking-wide uppercase sm:px-4 sm:text-sm",
                activeTab === "register"
                  ? "cinect-auth-tab-active rounded-tr-lg"
                  : "cinect-auth-tab-inactive rounded-tr-lg"
              )}
            >
              {t("register")}
            </Link>
          </div>

          <div
            className={cn(
              "rounded-b-xl bg-white p-6 text-slate-900 shadow-2xl [color-scheme:light] sm:p-8",
              activeTab === "login" ? "rounded-tr-xl" : "rounded-tl-xl"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
