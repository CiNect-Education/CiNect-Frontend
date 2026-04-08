import { locales } from "@/i18n/config";

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