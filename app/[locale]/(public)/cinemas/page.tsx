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
import { Building2, MapPin, Film } from "lucide-react";
import type { CinemaListItem } from "@/types/domain";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPlaceUrl,
  formatDistanceKm,
  getCurrentPositionCoords,
  haversineKm,
} from "@/lib/maps";
import {
  BookingAddressModeSegment,
  BookingCityField,
} from "@/components/shared/booking-city-field";
import { bookingCityLabel, normalizeBookingCityId } from "@/lib/booking-region";

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

  const city = normalizeBookingCityId(searchParams.get("city") || "");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
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
  }, [rawCinemas, city, amenities]);

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

  async function detectMyLocation() {
    setLocationError("");
    setIsLocating(true);
    try {
      const coords = await getCurrentPositionCoords();
      setUserCoords(coords);
    } catch {
      setLocationError(t("locationUnavailable"));
    } finally {
      setIsLocating(false);
    }
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
        breadcrumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
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

        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={detectMyLocation}
            aria-disabled={isLocating}
          >
            {isLocating ? t("locating") : t("useMyLocation")}
          </Badge>
          {locationError ? <span className="text-destructive text-xs">{locationError}</span> : null}
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

      {/* Cinema Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : cinemas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="text-muted-foreground mb-3 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">{t("emptyState")}</h3>
          <p className="text-muted-foreground text-sm">{tCommon("tryAdjustFilters")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema) => (
            <Link key={cinema.id} href={`/cinemas/${cinema.slug || cinema.id}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                <div className="bg-muted aspect-video overflow-hidden">
                  {cinema.imageUrl ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={cinema.imageUrl}
                        alt={cinema.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    </div>
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
                  {userCoords && cinema.latitude != null && cinema.longitude != null ? (
                    <p className="text-primary mb-3 text-xs font-medium">
                      {t("distanceFromYou", {
                        distance: formatDistanceKm(
                          haversineKm(userCoords, {
                            lat: cinema.latitude,
                            lng: cinema.longitude,
                          })
                        ),
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
          ))}
        </div>
      )}
    </div>
  );
}
