"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { RemoteImage } from "@/components/shared/remote-image";
import { useJoinCommunityGroup } from "@/hooks/queries/use-community";
import { Users, CalendarClock, MapPin, Armchair } from "lucide-react";

export default function GroupInviteLandingPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const locale = useLocale();
  const t = useTranslations("community");
  const { data, isLoading, error, refetch } = useJoinCommunityGroup(token);

  const invite = data?.data;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const showtimeLabel = new Date(invite.startTime).toLocaleString(
    locale.startsWith("vi") ? "vi-VN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card className="overflow-hidden border-[#f3ea28]/25">
        {invite.movie?.posterUrl ? (
          <div className="relative h-40 bg-muted">
            <RemoteImage
              src={invite.movie.posterUrl}
              alt={invite.movie.title ?? ""}
              fill
              className="object-cover opacity-60"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : null}
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#f3ea28]" />
            <h1 className="text-xl font-semibold">{t("joinInviteTitle")}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("joinInviteFrom", { name: invite.hostName ?? t("unknownUser") })}
          </p>
          <p className="font-display text-lg font-bold">{invite.movie?.title ?? "-"}</p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#f3ea28]" />
              {invite.cinema?.name ?? "-"}
              {invite.cinema?.city ? ` · ${invite.cinema.city}` : ""}
            </p>
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-[#f3ea28]" />
              {showtimeLabel}
            </p>
            {invite.seats?.length ? (
              <p className="flex flex-wrap items-center gap-2">
                <Armchair className="h-4 w-4 shrink-0 text-[#f3ea28]" />
                {invite.seats.map((seat) => (
                  <Badge key={seat} variant="outline" className="text-xs">
                    {seat}
                  </Badge>
                ))}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild>
              <Link href={invite.bookingUrl ?? "/movies"}>{t("joinInviteAccept")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/movies">{t("joinInviteBrowse")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
