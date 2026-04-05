"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCinemas } from "@/hooks/queries/use-cinemas";
import { Building2, MapPin, Film } from "lucide-react";
import type { CinemaListItem } from "@/types/domain";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

const ALL_CITIES = "__ALL__";

export default function CinemasPage() {
  const t = useTranslations("cinemas");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const city = searchParams.get("city") || "";
  const amenities = useMemo(
    () => searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (amenities.length) params.amenities = amenities.join(",");

  const { data, isLoading, error, refetch } = useCinemas(params);
  const rawCinemas = toList<CinemaListItem>(data?.data ?? data);

  // Client-side filter so city + amenities always apply (backend supports city; amenities filtered here)
  const cinemas = useMemo(() => {
    let list = rawCinemas;
    if (city) list = list.filter((c) => (c.city ?? "").toLowerCase() === city.toLowerCase());
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

  const cityOptions = useMemo(() => {
    const fromData = [...new Set(rawCinemas.map((c) => c.city).filter(Boolean))];
    return fromData.length > 0 ? fromData : ["Ho Chi Minh", "Hanoi", "Da Nang"];
  }, [rawCinemas]);

  function setCity(c: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (c) p.set("city", c);
    else p.delete("city");
    router.push(`?${p.toString()}`);
  }

  function toggleAmenity(a: string) {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    const p = new URLSearchParams(searchParams.toString());
    if (next.length) p.set("amenities", next.join(","));
    else p.delete("amenities");
    router.push(`?${p.toString()}`);
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
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-4 w-4" />
            <Select
              value={city ? city : ALL_CITIES}
              onValueChange={(v) => setCity(v === ALL_CITIES ? "" : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={tCommon("allCities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CITIES}>{tCommon("allCities")}</SelectItem>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm">
            {tCommon("cinemasFound", { count: cinemas.length })}
          </div>
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
            <Link key={cinema.id} href={`/cinemas/${cinema.id}`}>
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
                  {cinema.amenities?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {cinema.amenities.slice(0, 4).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
