"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildGoogleMapsPlaceUrl } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { CinemaListItem } from "@/types/domain";

type CinemaWithCoords = CinemaListItem & { latitude: number; longitude: number };

/** Leaflet from CDN (no npm install required). */
type LeafletGlobal = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  marker: (ll: [number, number]) => LeafletMarker;
  latLng: (lat: number, lng: number) => unknown;
  latLngBounds: (sw: unknown, ne?: unknown) => LeafletBounds;
  Icon: { Default: { mergeOptions: (o: Record<string, string>) => void } };
};

type LeafletMap = {
  setView: (c: [number, number] | { lat: number; lng: number }, z: number, o?: { animate?: boolean }) => LeafletMap;
  remove: () => void;
  invalidateSize: () => void;
  getZoom: () => number;
  fitBounds: (b: LeafletBounds, o?: { padding?: [number, number]; maxZoom?: number }) => void;
};

type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindPopup: (html: string, o?: Record<string, unknown>) => LeafletMarker;
  on: (ev: string, fn: () => void) => LeafletMarker;
  getLatLng: () => { lat: number; lng: number };
  openPopup: () => LeafletMarker;
};

type LeafletBounds = {
  extend: (ll: unknown) => LeafletBounds;
  isValid: () => boolean;
};

function getLeaflet(): LeafletGlobal {
  const L = (typeof window !== "undefined" ? (window as unknown as { L?: LeafletGlobal }).L : undefined) as
    | LeafletGlobal
    | undefined;
  if (!L) throw new Error("Leaflet not loaded");
  return L;
}

const LEAFLET_VER = "1.9.4";
const LEAFLET_BASE = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist`;
const LEAFLET_ICON_BASE = `${LEAFLET_BASE}/images`;

function injectLeafletCss() {
  const id = "cinect-leaflet-css";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `${LEAFLET_BASE}/leaflet.css`;
  document.head.appendChild(link);
}

function loadLeafletScript(): Promise<void> {
  const src = `${LEAFLET_BASE}/leaflet.js`;
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as unknown as { L?: unknown }).L) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet load")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Leaflet script"));
    document.head.appendChild(s);
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function CinemaVietnamMap({ cinemas }: { cinemas: CinemaListItem[] }) {
  const t = useTranslations("cinemas");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const withCoords = useMemo(
    () =>
      cinemas.filter(
        (c): c is CinemaWithCoords =>
          typeof c.latitude === "number" &&
          typeof c.longitude === "number" &&
          !Number.isNaN(c.latitude) &&
          !Number.isNaN(c.longitude)
      ),
    [cinemas]
  );

  const coordsKey = useMemo(
    () => withCoords.map((c) => `${c.id}:${c.latitude}:${c.longitude}`).join("|"),
    [withCoords]
  );

  useEffect(() => {
    if (withCoords.length === 0 || !containerRef.current) return;

    let disposed = false;

    void (async () => {
      try {
        injectLeafletCss();
        await loadLeafletScript();
        const L = getLeaflet();

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: `${LEAFLET_ICON_BASE}/marker-icon-2x.png`,
          iconUrl: `${LEAFLET_ICON_BASE}/marker-icon.png`,
          shadowUrl: `${LEAFLET_ICON_BASE}/marker-shadow.png`,
        });

        if (disposed || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: true,
          attributionControl: true,
        }).setView([16.2, 106.8], 6);

        if (disposed) {
          map.remove();
          return;
        }

        mapRef.current = map;
        markersRef.current.clear();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: `&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>`,
        }).addTo(map);

        let bounds: LeafletBounds | null = null;

        for (const c of withCoords) {
          const latlng: [number, number] = [c.latitude, c.longitude];
          const ll = L.latLng(c.latitude, c.longitude);
          bounds = bounds == null ? L.latLngBounds(ll, ll) : bounds.extend(ll);

          const mapsUrl = buildGoogleMapsPlaceUrl({
            lat: c.latitude,
            lng: c.longitude,
            address: c.address,
            city: c.city,
          });

          const detailHref = `/${locale}/cinemas/${c.slug || c.id}`;

          const roomsLine =
            c.roomCount > 0
              ? `<p class="cinect-osm-popup__meta">${escapeHtml(t("mapRoomCount", { count: c.roomCount }))}</p>`
              : "";

          const html = `
          <div class="cinect-osm-popup">
            <strong class="cinect-osm-popup__title">${escapeHtml(c.name)}</strong>
            ${roomsLine}
            <p class="cinect-osm-popup__addr">${escapeHtml(c.address)}</p>
            <p class="cinect-osm-popup__city">${escapeHtml(c.city)}</p>
            <div class="cinect-osm-popup__actions">
              <a class="cinect-osm-popup__link cinect-osm-popup__link--primary" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("openInMaps"))}</a>
              <a class="cinect-osm-popup__link" href="${detailHref}">${escapeHtml(t("mapViewDetail"))}</a>
            </div>
          </div>
        `;

          const marker = L.marker(latlng)
            .addTo(map)
            .bindPopup(html, { maxWidth: 300, className: "cinect-osm-popup-wrap" });
          marker.on("click", () => {
            setActiveId(c.id);
          });
          markersRef.current.set(c.id, marker);
        }

        if (bounds != null && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }

        requestAnimationFrame(() => map.invalidateSize());
        setTimeout(() => map.invalidateSize(), 250);

        if (!disposed) {
          setMapError(false);
          setMapReady(true);
        }
      } catch {
        if (!disposed) {
          setMapError(true);
          setMapReady(false);
        }
      }
    })();

    return () => {
      disposed = true;
      setMapReady(false);
      markersRef.current.clear();
      const m = mapRef.current;
      mapRef.current = null;
      m?.remove();
    };
  }, [coordsKey, locale]);

  useEffect(() => {
    if (!activeId || !mapRef.current) return;
    const marker = markersRef.current.get(activeId);
    if (!marker) return;
    const ll = marker.getLatLng();
    mapRef.current.setView(ll, Math.max(mapRef.current.getZoom(), 13), { animate: true });
    marker.openPopup();
  }, [activeId]);

  if (withCoords.length === 0) return null;

  return (
    <section className="cinect-cinema-map mb-10" aria-labelledby="cinema-map-heading">
      <div className="mb-6 text-center md:mb-8">
        <h2
          id="cinema-map-heading"
          className="font-display text-2xl font-bold tracking-wide text-white uppercase md:text-3xl"
        >
          {t("mapTitle")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-sm md:text-base">
          {t("mapDescription")}
        </p>
      </div>

      <div className="cinect-cinema-map__layout grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,360px)] lg:items-start lg:gap-8">
        <div className="cinect-cinema-map__canvas-wrap relative w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
          <div
            ref={containerRef}
            className="cinect-cinema-map__leaflet z-0 h-[min(520px,58vh)] w-full min-h-[320px]"
            role="application"
            aria-label={t("mapTitle")}
          />
          {!mapReady && !mapError ? (
            <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-slate-950/50 text-sm text-white/80">
              {t("mapLoading")}
            </div>
          ) : null}
          {mapError ? (
            <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-950/80 p-4 text-center text-sm text-amber-100">
              {t("mapLoadError")}
            </div>
          ) : null}
        </div>

        <ul className="cinect-cinema-map__list flex max-h-[min(520px,58vh)] flex-col gap-2 overflow-y-auto pr-1">
          {withCoords.map((cinema) => (
            <li key={cinema.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(cinema.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveId(cinema.id);
                  }
                }}
                className={cn(
                  "w-full cursor-pointer rounded-lg border border-white/10 bg-gradient-to-br from-[#3366cc]/35 to-[#663399]/40 p-3 text-left transition-colors hover:border-[#3366cc]/50",
                  activeId === cinema.id && "border-[#f3ea28]/60 ring-1 ring-[#f3ea28]/40"
                )}
              >
                <p className="text-sm font-semibold text-white">{cinema.name}</p>
                {cinema.roomCount > 0 ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("mapRoomCount", { count: cinema.roomCount })}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{cinema.address}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/cinemas/${cinema.slug || cinema.id}`}>{t("mapViewDetail")}</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 bg-[#f3ea28] text-xs font-bold text-[#0f172a] hover:bg-[#f3ea28]/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        buildGoogleMapsPlaceUrl({
                          lat: cinema.latitude,
                          lng: cinema.longitude,
                          address: cinema.address,
                          city: cinema.city,
                        }),
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {t("openInMaps")}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
