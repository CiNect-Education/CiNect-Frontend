/** Matches `selected_city` in Settings / Header; sent as ?city= on showtimes API */
export const SELECTED_CITY_STORAGE_KEY = "selected_city";

/** Same-tab listeners (e.g. header) — `storage` only fires across tabs */
export const BOOKING_CITY_CHANGED_EVENT = "cinect:booking-city-changed";

export function persistSelectedBookingCity(cityId: string) {
  if (typeof window === "undefined") return;
  if (cityId) localStorage.setItem(SELECTED_CITY_STORAGE_KEY, cityId);
  else localStorage.removeItem(SELECTED_CITY_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(BOOKING_CITY_CHANGED_EVENT, { detail: { cityId } })
  );
}

export const BOOKING_CITIES = [
  { id: "hcm", labelVi: "TP. Hồ Chí Minh", labelEn: "Ho Chi Minh City" },
  { id: "hn", labelVi: "Hà Nội", labelEn: "Hanoi" },
  { id: "dn", labelVi: "Đà Nẵng", labelEn: "Da Nang" },
  { id: "hp", labelVi: "Hải Phòng", labelEn: "Hai Phong" },
  { id: "ct", labelVi: "Cần Thơ", labelEn: "Can Tho" },
  { id: "bd", labelVi: "Bình Dương", labelEn: "Binh Duong" },
  { id: "nt", labelVi: "Nha Trang", labelEn: "Nha Trang" },
  { id: "vt", labelVi: "Vũng Tàu", labelEn: "Vung Tau" },
] as const;

export type BookingCityId = (typeof BOOKING_CITIES)[number]["id"];

const CITY_ALIASES: Record<string, string> = {
  hcm: "ho-chi-minh-city",
  hn: "ha-noi",
  dn: "da-nang",
  hp: "hai-phong",
  ct: "can-tho",
  bd: "ho-chi-minh-city",
  nt: "khanh-hoa",
  vt: "ho-chi-minh-city",
};

export type BookingCityOption = {
  id: string;
  label: string;
};

export function normalizeBookingCityId(cityId: string): string {
  const v = (cityId || "").trim().toLowerCase();
  return CITY_ALIASES[v] ?? v;
}

export function buildBookingCityOptions(
  locale: string,
  provincesNew: Array<{ code: string; nameVi: string; nameEn: string }>,
  provincesLegacy: Array<{
    code: string;
    nameVi: string;
    nameEn: string;
    provinceNew: { code: string; nameVi: string; nameEn: string };
  }>
): BookingCityOption[] {
  if (provincesNew.length === 0) {
    return BOOKING_CITIES.map((c) => ({ id: c.id, label: bookingCityLabel(c.id, locale) }));
  }

  const suffix = locale.startsWith("vi") ? " (tỉnh cũ)" : " (legacy)";
  const newOptions = provincesNew.map((p) => ({
    id: p.code,
    label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
  }));
  const legacyOptions = provincesLegacy
    .filter((p) => !provincesNew.some((n) => n.code === p.code))
    .map((p) => ({
      id: p.code,
      label: `${locale.startsWith("vi") ? p.nameVi : p.nameEn}${suffix}`,
    }));
  return [...newOptions, ...legacyOptions];
}

export function bookingCityLabel(id: string, locale: string): string {
  const c = BOOKING_CITIES.find((x) => x.id === id);
  if (!c) return id;
  return locale.startsWith("vi") ? c.labelVi : c.labelEn;
}

/** Calendar date in the user's local timezone (avoid UTC off-by-one). */
export function localCalendarDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
