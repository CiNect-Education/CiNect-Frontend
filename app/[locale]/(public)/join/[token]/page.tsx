"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useJoinCommunityGroup } from "@/hooks/queries/use-community";
import { Users, CalendarClock } from "lucide-react";

export default function GroupInviteLandingPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const t = useTranslations("community");
  const { data, isLoading, error, refetch } = useJoinCommunityGroup(token);

  const invite = data?.data as
    | {
        bookingId?: string;
        movieTitle?: string;
        cinemaName?: string;
        showtime?: string;
        inviterName?: string;
      }
    | undefined;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#f3ea28]" />
            <h1 className="text-xl font-semibold">{t("joinInviteTitle")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("joinInviteFrom", { name: invite?.inviterName ?? t("unknownUser") })}
          </p>
          <p className="font-medium">{invite?.movieTitle ?? "-"}</p>
          <p className="text-sm text-muted-foreground">{invite?.cinemaName ?? "-"}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>{invite?.showtime ? new Date(invite.showtime).toLocaleString() : "-"}</span>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={invite?.bookingId ? `/booking/success/${invite.bookingId}` : "/movies"}>
                {t("joinInviteAccept")}
              </Link>
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
