"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
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
  const alternateLocales = LOCALES.filter((l) => l.id !== locale);

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
        <span className="cinect-lg-popup">
          <span className="cinect-lg-option">
            <LocaleFlagIcon locale={current.id} />
            <span className="cinect-lg-txt">{current.short}</span>
            <span className="cinect-lg-arr" aria-hidden />
          </span>
        </span>
      </button>

      <div className={cn("cinect-lg-action-popup", open && "is-open")} role="listbox" aria-label={t("language")}>
        <div className="cinect-lg-popup">
          {alternateLocales.map(({ id, short }) => (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={false}
              className="cinect-lg-popup-item"
              onClick={() => switchLocale(id)}
            >
              <span className="cinect-lg-option">
                <LocaleFlagIcon locale={id} />
                <span className="cinect-lg-txt cinect-lg-txt--popup">{short}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
