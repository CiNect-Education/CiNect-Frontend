export type Coordinates = {
  lat: number;
  lng: number;
};

export function haversineKm(from: Coordinates, to: Coordinates): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

export function getCurrentPositionCoords(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEO_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => reject(err),
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 18_000,
      }
    );
  });
}

export function buildGoogleMapsPlaceUrl(params: {
  lat?: number;
  lng?: number;
  address: string;
  city?: string;
}): string {
  const { lat, lng, address, city } = params;
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const q = [address, city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function getTravelMode(): "driving" | "walking" | "bicycling" | "transit" {
  const v = (process.env.NEXT_PUBLIC_MAPS_TRAVEL_MODE ?? "driving").toLowerCase();
  if (v === "walking" || v === "bicycling" || v === "transit") return v;
  return "driving";
}

export function buildGoogleMapsDirectionsUrl(params: {
  origin: Coordinates;
  destination: { lat?: number; lng?: number; address: string; city?: string };
}): string {
  const destination =
    params.destination.lat != null && params.destination.lng != null
      ? `${params.destination.lat},${params.destination.lng}`
      : [params.destination.address, params.destination.city].filter(Boolean).join(", ");

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${params.origin.lat},${params.origin.lng}`
  )}&destination=${encodeURIComponent(destination)}&travelmode=${getTravelMode()}`;
}
