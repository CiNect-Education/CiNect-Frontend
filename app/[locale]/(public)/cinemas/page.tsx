"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCinemas, useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";
import { Building2, MapPin, Film, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CinemaListItem } from "@/types/domain";
import { RemoteImage } from "@/components/shared/remote-image";
import { Separator } from "@/components/ui/separator";
import {
  BookingAddressModeSegment,
  BookingCityField,
} from "@/components/shared/booking-city-field";
import { bookingCityLabel, normalizeBookingCityId } from "@/lib/booking-region";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPlaceUrl,
  formatDistanceKm,
} from "@/lib/maps";
import {
  distanceToCinemaKm,
  locateUserPrecise,
  readUserLocation,
  sortByDistanceFromUser,
  USER_LOCATION_CHANGED_EVENT,
} from "@/lib/user-location";
import { DetectRegionButton } from "@/components/shared/detect-region-button";
import { CinemaVietnamMap } from "@/components/cinemas/cinema-vietnam-map";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function CinemasPage() {
  const t = useTranslations("cinemas");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [addressMode, setAddressMode] = useState<"new" | "legacy">("new");
  const [showAllCinemas, setShowAllCinemas] = useState(false);

  const city = normalizeBookingCityId(searchParams.get("city") || "");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const amenities = useMemo(
    () => searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (amenities.length) params.amenities = amenities.join(",");

  const { data, isLoading, error, refetch } = useCinemas(params);
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();
  const rawCinemas = toList<CinemaListItem>(data?.data ?? data);

  // Backend handles city filtering; apply amenities on client.
  const cinemas = useMemo(() => {
    let list = rawCinemas;
    if (amenities.length)
      list = list.filter((c) =>
        amenities.every((a) => (c.amenities ?? []).includes(a))
      );
    return list;
  }, [rawCinemas, amenities]);

  const cinemasSorted = useMemo(
    () => sortByDistanceFromUser(cinemas, userCoords),
    [cinemas, userCoords]
  );

  const allAmenities = useMemo(
    () => Array.from(new Set(rawCinemas.flatMap((c) => c.amenities ?? []))).sort(),
    [rawCinemas]
  );

  const provincesNew = useMemo(
    () => toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    [provincesRes?.data]
  );
  const provincesLegacy = useMemo(
    () =>
      toList<{
        code: string;
        nameVi: string;
        nameEn: string;
        provinceNew: { code: string; nameVi: string; nameEn: string };
      }>(legacyRes?.data),
    [legacyRes?.data]
  );
  const cityOptions = useMemo(() => {
    if (addressMode === "legacy" && provincesLegacy.length > 0) {
      return provincesLegacy.map((p) => ({
        id: p.code,
        label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
      }));
    }
    return provincesNew.map((p) => ({
      id: p.code,
      label: locale.startsWith("vi") ? p.nameVi : p.nameEn,
    }));
  }, [addressMode, locale, provincesLegacy, provincesNew]);
  const cityLabel = useMemo(() => {
    if (!city) return "";
    return cityOptions.find((c) => c.id === city)?.label ?? bookingCityLabel(city, locale);
  }, [city, cityOptions, locale]);
  useEffect(() => {
    if (!city) return;
    if (provincesLegacy.some((p) => p.code === city)) {
      setAddressMode("legacy");
      return;
    }
    if (provincesNew.some((p) => p.code === city)) {
      setAddressMode("new");
    }
  }, [city, provincesLegacy, provincesNew]);

  useEffect(() => {
    setShowAllCinemas(false);
  }, [city, amenities.join(",")]);

  useEffect(() => {
    function syncUserLocation() {
      const stored = readUserLocation();
      setUserCoords(stored ? { lat: stored.lat, lng: stored.lng } : null);
    }
    syncUserLocation();
    window.addEventListener(USER_LOCATION_CHANGED_EVENT, syncUserLocation);
    return () => window.removeEventListener(USER_LOCATION_CHANGED_EVENT, syncUserLocation);
  }, []);

  function setCity(c: string) {
    const normalized = normalizeBookingCityId(c);
    const p = new URLSearchParams(searchParams.toString());
    if (normalized) p.set("city", normalized);
    else p.delete("city");
    router.push(`?${p.toString()}`);
  }
  function handleAddressModeChange(nextMode: "new" | "legacy") {
    setAddressMode(nextMode);
    if (!city) return;
    const existsInNext =
      nextMode === "legacy"
        ? provincesLegacy.some((p) => p.code === city)
        : provincesNew.some((p) => p.code === city);
    if (!existsInNext) setCity("");
  }

  function toggleAmenity(a: string) {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    const p = new URLSearchParams(searchParams.toString());
    if (next.length) p.set("amenities", next.join(","));
    else p.delete("amenities");
    router.push(`?${p.toString()}`);
  }

  function handleLocationApplied(cityId: string) {
    const stored = readUserLocation();
    if (stored) {
      setUserCoords({ lat: stored.lat, lng: stored.lng });
      setShowAllCinemas(true);
    }
    if (cityId) setCity(cityId);
  }

  function openPlaceMap(
    e: React.MouseEvent,
    cinema: Pick<CinemaListItem, "latitude" | "longitude" | "address" | "city">
  ) {
    e.preventDefault();
    e.stopPropagation();
    const url = buildGoogleMapsPlaceUrl({
      lat: cinema.latitude,
      lng: cinema.longitude,
      address: cinema.address,
      city: cinema.city,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openDirections(
    e: React.MouseEvent,
    cinema: Pick<CinemaListItem, "latitude" | "longitude" | "address" | "city">
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!userCoords) return;
    const url = buildGoogleMapsDirectionsUrl({
      origin: userCoords,
      destination: {
        lat: cinema.latitude,
        lng: cinema.longitude,
        address: cinema.address,
        city: cinema.city,
      },
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* Filters */}
      <div className="cinect-glass mb-6 rounded-xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 max-w-full">
            <MapPin className="text-muted-foreground hidden h-4 w-4 shrink-0 sm:block" />
            <BookingAddressModeSegment mode={addressMode} onChange={handleAddressModeChange} />
            <BookingCityField
              cityOptions={cityOptions}
              value={city}
              displayLabel={cityLabel}
              onChange={setCity}
              compact
            />
          </div>

          <div className="text-muted-foreground text-sm">
            {tCommon("cinemasFound", { count: cinemas.length })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DetectRegionButton
            size="sm"
            variant="outline"
            showLabel
            onApplied={(cityId) => handleLocationApplied(cityId)}
          />
          {userCoords ? (
            <span className="text-muted-foreground text-xs">
              {t("sortedByNearest")}
            </span>
          ) : null}
        </div>

        {allAmenities.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">{tCommon("amenitiesLabel")}</span>
              {allAmenities.map((a) => (
                <Badge
                  key={a}
                  variant={amenities.includes(a) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAmenity(a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>

      {!isLoading && !error && cinemasSorted.length > 0 ? (
        <CinemaVietnamMap cinemas={cinemasSorted} userCoords={userCoords} />
      ) : null}

      {/* Cinema grid — collapsed until user expands */}
      {error ? (
        <ApiErrorState error={error} onRetry={refetch} className="mt-8" />
      ) : !isLoading && cinemas.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="text-muted-foreground mb-3 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">{t("emptyState")}</h3>
          <p className="text-muted-foreground text-sm">{tCommon("tryAdjustFilters")}</p>
        </div>
      ) : !isLoading && cinemasSorted.length > 0 ? (
        <section className="mt-8" aria-label={t("allCinemas")}>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-w-[min(100%,20rem)] border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-[#f3ea28]"
              aria-expanded={showAllCinemas}
              onClick={() => setShowAllCinemas((open) => !open)}
            >
              {showAllCinemas
                ? t("hideAllCinemas")
                : t("showAllCinemas", { count: cinemasSorted.length })}
              <ChevronDown
                className={cn("ml-2 h-5 w-5 shrink-0 transition-transform", showAllCinemas && "rotate-180")}
                aria-hidden
              />
            </Button>
          </div>

          {showAllCinemas ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cinemasSorted.map((cinema) => {
                const distanceKm =
                  userCoords != null ? distanceToCinemaKm(userCoords, cinema) : null;
                return (
                <Link key={cinema.id} href={`/cinemas/${cinema.slug || cinema.id}`}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="bg-muted relative aspect-video overflow-hidden">
                      {cinema.imageUrl ? (
                        <>
                          <RemoteImage
                            src={cinema.imageUrl}
                            alt={cinema.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="text-muted-foreground h-16 w-16" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-2 font-semibold">{cinema.name}</h3>
                      <div className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{cinema.address}</span>
                      </div>
                      <p className="text-muted-foreground mb-3 text-xs">{cinema.city}</p>
                      {distanceKm != null ? (
                        <p className="text-primary mb-3 text-xs font-medium">
                          {t("distanceFromYou", {
                            distance: formatDistanceKm(distanceKm),
                          })}
                        </p>
                      ) : null}
                      {cinema.amenities?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {cinema.amenities.slice(0, 4).map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer"
                          onClick={(e) => openPlaceMap(e, cinema)}
                        >
                          {t("openInMaps")}
                        </Badge>
                        {userCoords ? (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={(e) => openDirections(e, cinema)}
                          >
                            {t("directionsFromMe")}
                          </Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : isLoading && showAllCinemas ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-2/3" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
