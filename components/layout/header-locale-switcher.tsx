"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleFlagIcon } from "@/components/shared/locale-flag-icon";

const LOCALES = [
  { id: "vi" as const, short: "VN" },
  { id: "en" as const, short: "EN" },
] as const;

type Props = {
  className?: string;
};

export function HeaderLocaleSwitcher({ className }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  const switchLocale = useCallback(
    (id: (typeof LOCALES)[number]["id"]) => {
      if (id !== locale) {
        router.replace(pathname, { locale: id });
      }
      setOpen(false);
    },
    [locale, pathname, router]
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("cinect-lg-action", open && "is-open", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="cinect-lg-trigger"
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cinect-lg-option cinect-lg-option--trigger">
          <LocaleFlagIcon locale={current.id} size={24} />
          <span className="cinect-lg-txt">{current.short}</span>
        </span>
        <ChevronDown className="cinect-lg-arr" strokeWidth={2.5} aria-hidden />
      </button>

      <div className={cn("cinect-lg-action-popup", open && "is-open")} role="listbox" aria-label={t("language")}>
        <div className="cinect-lg-popup">
          {LOCALES.map(({ id, short }) => (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={locale === id}
              className={cn("cinect-lg-popup-item", locale === id && "is-active")}
              onClick={() => switchLocale(id)}
            >
              <LocaleFlagIcon locale={id} size={24} />
              <span className="cinect-lg-txt cinect-lg-txt--popup">{short}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
