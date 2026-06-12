import { normalizeBookingCityId } from "@/lib/booking-region";
import { PROVINCE_CENTROIDS, LEGACY_SHORT_ALIASES } from "@/lib/province-centroids";

/** Read in browser / Edge; empty on server */
export function getGoogleGeocodingBrowserKey(): string {
  if (typeof process === "undefined") return "";
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}

/** Rough Vietnam mainland + major islands (exclude false matches far away) */
export function isLatLngLikelyVietnam(lat: number, lng: number): boolean {
  return lat >= 8.0 && lat <= 23.6 && lng >= 102.0 && lng <= 110.2;
}

export type ProvinceMatchSource = {
  code: string;
  nameVi: string;
  nameEn: string;
  /** When set, GPS/text match resolves to this new-province code */
  mergedInto?: string;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function normalizeAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAdminPrefix(name: string): string {
  return name
    .replace(/^tinh\s+/i, "")
    .replace(/^thanh pho\s+/i, "")
    .replace(/^tp\.?\s+/i, "")
    .trim();
}

function buildMatchNeedles(source: ProvinceMatchSource[]): string[] {
  const needles: { code: string; needle: string }[] = [];
  for (const row of source) {
    const target = row.mergedInto ?? row.code;
    for (const raw of [row.nameVi, row.nameEn, stripAdminPrefix(row.nameVi)]) {
      const n = normalizeAscii(raw);
      if (n.length >= 3) needles.push({ code: target, needle: n });
    }
    const slugNeedle = normalizeAscii(row.code.replace(/-/g, " "));
    if (slugNeedle.length >= 3) needles.push({ code: target, needle: slugNeedle });
  }
  return needles
    .sort((a, b) => b.needle.length - a.needle.length)
    .map((x) => `${x.code}\0${x.needle}`);
}

/** Nearest province centroid within radius (no API key). */
export function approximateProvinceFromCoords(
  lat: number,
  lng: number,
  preferredCodes?: string[]
): string | null {
  if (!isLatLngLikelyVietnam(lat, lng)) return null;

  const codes =
    preferredCodes?.length && preferredCodes.every((c) => PROVINCE_CENTROIDS[c])
      ? preferredCodes
      : Object.keys(PROVINCE_CENTROIDS);

  let best: { code: string; d: number } | null = null;
  for (const code of codes) {
    const c = PROVINCE_CENTROIDS[code];
    if (!c) continue;
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d <= c.radiusKm && (!best || d < best.d)) {
      best = { code, d };
    }
  }
  return best?.code ?? null;
}

/** Match geocoded address text to a province code using API province names */
export function matchProvinceFromAddressText(
  text: string,
  provincesNew: ProvinceMatchSource[],
  provincesLegacy: ProvinceMatchSource[] = []
): string | null {
  const n = normalizeAscii(text);
  if (!n) return null;

  for (const alias of Object.entries(LEGACY_SHORT_ALIASES)) {
    if (n.includes(alias[0])) return alias[1];
  }

  const legacyWithMerge = provincesLegacy.map((p) => ({
    ...p,
    mergedInto: p.mergedInto,
  }));
  const combined = [...provincesNew, ...legacyWithMerge];
  const packed = buildMatchNeedles(combined);

  for (const entry of packed) {
    const sep = entry.indexOf("\0");
    const code = entry.slice(0, sep);
    const needle = entry.slice(sep + 1);
    if (n.includes(needle)) return normalizeBookingCityId(code);
  }

  return null;
}

type GoogleGeocodeResult = {
  formatted_address?: string;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
};

export async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
  apiKey: string,
  language: string,
  provincesNew: ProvinceMatchSource[],
  provincesLegacy: ProvinceMatchSource[] = []
): Promise<string | null> {
  if (!apiKey) return null;
  const lang = language.startsWith("vi") ? "vi" : "en";
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", lang);

  const res = await fetch(url.toString());
  const json = (await res.json()) as GoogleGeocodeResponse;
  if (json.status !== "OK" || !json.results?.length) {
    return null;
  }

  for (const r of json.results) {
    if (r.formatted_address) {
      const m = matchProvinceFromAddressText(r.formatted_address, provincesNew, provincesLegacy);
      if (m) return m;
    }
    const parts = r.address_components ?? [];
    for (const c of parts) {
      const blob = `${c.long_name} ${c.short_name}`;
      const m = matchProvinceFromAddressText(blob, provincesNew, provincesLegacy);
      if (m) return m;
    }
  }
  return null;
}

export type DetectBookingCityMethod = "google" | "approx" | "none";

export async function detectBookingCityFromCoords(
  lat: number,
  lng: number,
  options?: {
    locale?: string;
    provincesNew?: ProvinceMatchSource[];
    provincesLegacy?: ProvinceMatchSource[];
  }
): Promise<{ cityId: string | null; method: DetectBookingCityMethod }> {
  const locale = options?.locale ?? "vi";
  const provincesNew = options?.provincesNew ?? [];
  const provincesLegacy = options?.provincesLegacy ?? [];
  const key = getGoogleGeocodingBrowserKey();

  if (key && isLatLngLikelyVietnam(lat, lng)) {
    try {
      const fromGoogle = await reverseGeocodeGoogle(
        lat,
        lng,
        key,
        locale,
        provincesNew,
        provincesLegacy
      );
      if (fromGoogle) return { cityId: fromGoogle, method: "google" };
    } catch {
      // fall through to approximation
    }
  }

  const preferred = provincesNew.map((p) => p.code);
  const approx = approximateProvinceFromCoords(
    lat,
    lng,
    preferred.length ? preferred : undefined
  );
  if (approx) return { cityId: approx, method: "approx" };
  return { cityId: null, method: "none" };
}
