import { locales, type Locale } from "@/i18n/config";

export function normalizeLocalizedPath(path: string | null | undefined): string {
  if (!path) return "/";

  let normalized = path.trim();
  if (!normalized) return "/";

  for (;;) {
    let stripped = false;

    for (const locale of locales) {
      const prefix = `/${locale}`;
      if (normalized === prefix) {
        normalized = "/";
        stripped = true;
        break;
      }

      if (normalized.startsWith(`${prefix}/`)) {
        normalized = normalized.slice(prefix.length) || "/";
        stripped = true;
        break;
      }
    }

    if (!stripped) break;
  }

  return normalized;
}

/** Build a browser URL with a single locale prefix (for window.location). */
export function toLocalizedHref(locale: Locale | string, path: string | null | undefined): string {
  const normalized = normalizeLocalizedPath(path);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}