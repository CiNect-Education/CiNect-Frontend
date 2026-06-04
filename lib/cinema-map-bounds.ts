/** Vietnam mainland + major islands — matches booking region detection. */
export const VIETNAM_MAP_BOUNDS = {
  southWest: [8.0, 102.0] as [number, number],
  northEast: [23.6, 110.2] as [number, number],
};

/** Default center and zoom — fills the map panel with Vietnam (not world / SE Asia). */
export const VIETNAM_MAP_DEFAULT_VIEW = {
  center: [16.15, 106.35] as [number, number],
  zoom: 6,
};

export { isLatLngLikelyVietnam } from "@/lib/detect-booking-region";
