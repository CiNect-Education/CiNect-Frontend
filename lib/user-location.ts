import {
  type Coordinates,
  getCurrentPositionCoords,
  haversineKm,
} from "@/lib/maps";

export const USER_LOCATION_STORAGE_KEY = "cinect_user_location";

export const USER_LOCATION_CHANGED_EVENT = "cinect:user-location-changed";

export type StoredUserLocation = Coordinates & {
  accuracy?: number;
  updatedAt: number;
};

export function persistUserLocation(location: StoredUserLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(location));
  window.dispatchEvent(
    new CustomEvent(USER_LOCATION_CHANGED_EVENT, { detail: location })
  );
}

export function readUserLocation(): StoredUserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserLocation;
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** High-accuracy GPS; persisted for cinemas distance + directions. */
export async function locateUserPrecise(): Promise<StoredUserLocation> {
  const result = await getCurrentPositionCoords({
    highAccuracy: true,
    maximumAge: 0,
    timeout: 25_000,
  });
  const stored: StoredUserLocation = {
    lat: result.lat,
    lng: result.lng,
    accuracy: result.accuracy,
    updatedAt: Date.now(),
  };
  persistUserLocation(stored);
  return stored;
}

export function distanceToCinemaKm(
  user: Coordinates,
  cinema: { latitude?: number; longitude?: number }
): number | null {
  if (cinema.latitude == null || cinema.longitude == null) return null;
  if (Number.isNaN(cinema.latitude) || Number.isNaN(cinema.longitude)) return null;
  return haversineKm(user, { lat: cinema.latitude, lng: cinema.longitude });
}

export function sortByDistanceFromUser<T extends { latitude?: number; longitude?: number }>(
  items: T[],
  user: Coordinates | null
): T[] {
  if (!user) return items;
  return [...items].sort((a, b) => {
    const da = distanceToCinemaKm(user, a);
    const db = distanceToCinemaKm(user, b);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}
