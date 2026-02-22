"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCinema, useCinemaShowtimes } from "@/hooks/queries/use-cinemas";
import { MapPin, Phone, Mail, Film, ExternalLink, Calendar, Ticket } from "lucide-react";
import type { Cinema, Showtime } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function CinemaDetailPage() {
  const params = useParams();
  const t = useTranslations("cinemas");
  const cinemaId = params.id as string;
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: cinemaRes, isLoading, error, refetch } = useCinema(cinemaId);
  const { data: showtimesRes } = useCinemaShowtimes(cinemaId, selectedDate);

  const cinema = cinemaRes?.data as import("@/types/domain").Cinema | undefined;
  const showtimes = toList<Showtime>(showtimesRes?.data ?? showtimesRes);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageHeader
          title=""
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: t("title") || "Cinemas", href: "/cinemas" },
            { label: "Cinema Detail" },
          ]}
        />
        <Skeleton className="mb-6 aspect-video max-w-2xl rounded-lg" />
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Cinema not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/cinemas">Back to Cinemas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mapUrl =
    cinema.latitude != null && cinema.longitude != null
      ? `https://www.google.com/maps?q=${cinema.latitude},${cinema.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.address)}`;

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={cinema.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: t("title") || "Cinemas", href: "/cinemas" },
          { label: cinema.name },
        ]}
      />

      <div className="bg-muted mb-6 aspect-video max-w-2xl overflow-hidden rounded-lg">
        {cinema.imageUrl ? (
          <img src={cinema.imageUrl} alt={cinema.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="text-muted-foreground h-24 w-24" />
          </div>
        )}
      </div>

      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold">{cinema.name}</h2>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {cinema.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {cinema.address}
            </span>
          )}
          {cinema.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {cinema.phone}
            </span>
          )}
          {cinema.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {cinema.email}
            </span>
          )}
        </div>
        {cinema.amenities?.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {cinema.amenities.map((a) => (
              <Badge key={a} variant="secondary">
                {a}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-6">
        <Button variant="outline" asChild>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Google Maps
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("currentShowtimes") || "Showtimes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {next7Days.map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                return (
                  <Button
                    key={dateStr}
                    variant={selectedDate === dateStr ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(dateStr)}
                    className="shrink-0"
                  >
                    {d.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Button>
                );
              })}
            </div>
            {showtimes.length > 0 ? (
              <div className="space-y-3">
                {showtimes.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted relative h-14 w-10 overflow-hidden rounded">
                        {st.moviePosterUrl ? (
                          <img
                            src={st.moviePosterUrl}
                            alt={st.movieTitle || "Movie"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Film className="text-muted-foreground absolute inset-0 m-auto h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{st.movieTitle || "Movie"}</p>
                        <p className="text-muted-foreground text-xs">
                          {st.roomName} • {st.format}
                          {st.language ? ` • ${st.language}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {new Date(st.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/booking?showtime=${st.id}`}>
                          <Ticket className="mr-1 h-4 w-4" />
                          Book
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No showtimes for this date
              </p>
            )}
          </CardContent>
        </Card>

        {cinema.rooms?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                {t("rooms") || "Rooms"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cinema.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="font-medium">{room.name}</span>
                    <Badge variant="outline">
                      {room.format} • {room.totalSeats} seats
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
