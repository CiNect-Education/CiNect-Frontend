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
