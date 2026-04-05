import type { BookingCityId } from "@/lib/booking-region";
import { BOOKING_CITIES } from "@/lib/booking-region";

/** Read in browser / Edge; empty on server */
export function getGoogleGeocodingBrowserKey(): string {
  if (typeof process === "undefined") return "";
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}

/** Rough Vietnam mainland + major islands (exclude false matches far away) */
export function isLatLngLikelyVietnam(lat: number, lng: number): boolean {
  return lat >= 8.0 && lat <= 23.6 && lng >= 102.0 && lng <= 110.2;
}

const CITY_CENTROIDS: Record<
  BookingCityId,
  { lat: number; lng: number; radiusKm: number }
> = {
  hcm: { lat: 10.7769, lng: 106.7009, radiusKm: 55 },
  hn: { lat: 21.0285, lng: 105.8542, radiusKm: 45 },
  dn: { lat: 16.0471, lng: 108.2068, radiusKm: 38 },
  hp: { lat: 20.8449, lng: 106.6881, radiusKm: 35 },
  ct: { lat: 10.0452, lng: 105.7469, radiusKm: 42 },
  bd: { lat: 11.0044, lng: 106.6599, radiusKm: 28 },
  nt: { lat: 12.2388, lng: 109.1967, radiusKm: 38 },
  vt: { lat: 10.346, lng: 107.0843, radiusKm: 42 },
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

/** Nearest supported booking region within each city's radius (no API key). */
export function approximateBookingCityFromCoords(
  lat: number,
  lng: number
): BookingCityId | null {
  if (!isLatLngLikelyVietnam(lat, lng)) return null;
  let best: { id: BookingCityId; d: number } | null = null;
  for (const id of BOOKING_CITIES.map((c) => c.id)) {
    const c = CITY_CENTROIDS[id];
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d <= c.radiusKm && (!best || d < best.d)) {
      best = { id, d };
    }
  }
  return best?.id ?? null;
}

function normalizeAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Match Google address text to our booking city ids */
export function matchBookingCityFromAddressText(text: string): BookingCityId | null {
  const n = normalizeAscii(text);
  const rules: { id: BookingCityId; needles: string[] }[] = [
    {
      id: "hcm",
      needles: [
        "ho chi minh",
        "tp ho chi minh",
        "tphcm",
        "saigon",
        "sai gon",
        "thanh pho ho chi minh",
      ],
    },
    { id: "hn", needles: ["ha noi", "hanoi", "thanh pho ha noi"] },
    { id: "dn", needles: ["da nang", "danang", "thanh pho da nang"] },
    { id: "hp", needles: ["hai phong", "haiphong", "thanh pho hai phong"] },
    { id: "ct", needles: ["can tho", "thanh pho can tho"] },
    { id: "bd", needles: ["binh duong", "thu dau mot"] },
    { id: "nt", needles: ["nha trang", "khanh hoa", "thanh pho nha trang"] },
    { id: "vt", needles: ["vung tau", "ba ria", "ba ria vung tau", "thanh pho vung tau"] },
  ];
  for (const { id, needles } of rules) {
    if (needles.some((k) => n.includes(k))) return id;
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
  language: string
): Promise<BookingCityId | null> {
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
      const m = matchBookingCityFromAddressText(r.formatted_address);
      if (m) return m;
    }
    const parts = r.address_components ?? [];
    for (const c of parts) {
      const blob = `${c.long_name} ${c.short_name}`;
      const m = matchBookingCityFromAddressText(blob);
      if (m) return m;
    }
  }
  return null;
}

export type DetectBookingCityMethod = "google" | "approx" | "none";

export async function detectBookingCityFromCoords(
  lat: number,
  lng: number,
  options?: { locale?: string }
): Promise<{ cityId: BookingCityId | null; method: DetectBookingCityMethod }> {
  const locale = options?.locale ?? "vi";
  const key = getGoogleGeocodingBrowserKey();

  if (key && isLatLngLikelyVietnam(lat, lng)) {
    try {
      const fromGoogle = await reverseGeocodeGoogle(lat, lng, key, locale);
      if (fromGoogle) return { cityId: fromGoogle, method: "google" };
    } catch {
      // fall through to approximation
    }
  }

  const approx = approximateBookingCityFromCoords(lat, lng);
  if (approx) return { cityId: approx, method: "approx" };
  return { cityId: null, method: "none" };
}

export function getCurrentPositionCoords(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEO_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 18_000,
    });
  });
}
