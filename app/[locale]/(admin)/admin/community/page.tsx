"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import {
  useAdminCommunityPending,
  useAdminCommunityStats,
  useApproveCommunityReview,
  useApproveCommunityPost,
  useApproveCommunityPhoto,
  useRejectCommunityReview,
  useRejectCommunityPost,
  useRejectCommunityPhoto,
  useAdminSupportTickets,
  useResolveSupportTicket,
} from "@/hooks/queries/use-community";
import { Check, X, MessageSquare, Headphones, Star, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

type PendingItem = {
  id: string;
  kind: "review" | "post" | "photo";
  title: string;
  subtitle?: string;
  detail?: string;
  rating?: number;
  isVerified?: boolean;
};

export default function AdminCommunityPage() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"reviews" | "support" | "legacy">("reviews");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved">("all");

  const { data: statsRes } = useAdminCommunityStats();
  const stats = statsRes?.data;

  const { data, isLoading, error, refetch } = useAdminCommunityPending();
  const { data: supportRes, isLoading: supportLoading, error: supportError, refetch: refetchSupport } =
    useAdminSupportTickets({ page: 1, limit: 100 });

  const approveReview = useApproveCommunityReview();
  const approvePost = useApproveCommunityPost();
  const approvePhoto = useApproveCommunityPhoto();
  const rejectReview = useRejectCommunityReview();
  const rejectPost = useRejectCommunityPost();
  const rejectPhoto = useRejectCommunityPhoto();
  const resolveTicket = useResolveSupportTicket();

  const { reviews, legacy } = useMemo(() => {
    const raw = data?.data;
    if (!raw) return { reviews: [] as PendingItem[], legacy: [] as PendingItem[] };

    const reviewItems = (raw.reviews ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      kind: "review" as const,
      title: String((r.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: String((r.movie as { title?: string })?.title ?? ""),
      detail: String(r.content ?? ""),
      rating: typeof r.rating === "number" ? r.rating : undefined,
      isVerified: Boolean(r.isVerified),
    }));

    const postItems = (raw.posts ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      kind: "post" as const,
      title: String((p.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: "Buzz post",
      detail: String(p.content ?? ""),
    }));

    const photoItems = (raw.photos ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      kind: "photo" as const,
      title: String((p.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: "Photo",
      detail: String(p.caption ?? p.imageUrl ?? ""),
    }));

    return { reviews: reviewItems, legacy: [...postItems, ...photoItems] };
  }, [data]);

  const tickets = useMemo(() => {
    const list = supportRes?.data ?? [];
    if (ticketFilter === "open") return list.filter((x) => !x.isResolved);
    if (ticketFilter === "resolved") return list.filter((x) => x.isResolved);
    return list;
  }, [supportRes, ticketFilter]);

  function approveItem(item: PendingItem) {
    const onSuccess = () => void refetch();
    if (item.kind === "review") approveReview.mutate({ id: item.id }, { onSuccess });
    if (item.kind === "post") approvePost.mutate({ id: item.id }, { onSuccess });
    if (item.kind === "photo") approvePhoto.mutate({ id: item.id }, { onSuccess });
  }

  function rejectItem(item: PendingItem) {
    const onSuccess = () => void refetch();
    if (item.kind === "review") rejectReview.mutate({ id: item.id }, { onSuccess });
    if (item.kind === "post") rejectPost.mutate({ id: item.id }, { onSuccess });
    if (item.kind === "photo") rejectPhoto.mutate({ id: item.id }, { onSuccess });
  }

  function renderPendingCard(item: PendingItem) {
    return (
      <Card key={`${item.kind}-${item.id}`} className="cinect-admin-panel">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{item.title}</p>
            {item.kind === "review" && typeof item.rating === "number" && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3" />
                {item.rating}/10
              </Badge>
            )}
            {item.isVerified && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <ShieldCheck className="h-3 w-3" />
                {t("communityVerified")}
              </Badge>
            )}
            <Badge variant="outline">{item.kind.toUpperCase()}</Badge>
          </div>
          {item.subtitle && <p className="text-sm font-medium">{item.subtitle}</p>}
          {item.detail && <p className="text-muted-foreground text-sm leading-relaxed">{item.detail}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approveItem(item)}>
              <Check className="mr-2 h-4 w-4" />
              {t("communityApprove")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => rejectItem(item)}>
              <X className="mr-2 h-4 w-4" />
              {t("communityReject")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader title={t("communityModeration")} description={t("descCommunityModeration")} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cinect-admin-panel">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{t("communityPendingReviews")}</p>
            <p className="text-2xl font-bold">{stats?.pendingReviews ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="cinect-admin-panel">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{t("communityVerifiedTotal")}</p>
            <p className="text-2xl font-bold">{stats?.verifiedReviews ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="cinect-admin-panel">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{t("communityOpenTickets")}</p>
            <p className="text-2xl font-bold">{stats?.openTickets ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="cinect-admin-panel">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{t("refundsTotal")}</p>
            <p className="text-2xl font-bold">{stats?.totalRefunds ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("communityReviewsTab")}
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <Headphones className="h-4 w-4" />
            {t("communitySupportTickets")}
          </TabsTrigger>
          {legacy.length > 0 && <TabsTrigger value="legacy">{t("communityLegacyTab")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="reviews" className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-md" />
          ) : error ? (
            <ApiErrorState error={error} onRetry={refetch} />
          ) : reviews.length === 0 ? (
            <Card className="cinect-admin-panel">
              <CardContent className="text-muted-foreground p-6 text-sm">{t("communityNoPendingReviews")}</CardContent>
            </Card>
          ) : (
            reviews.map(renderPendingCard)
          )}
        </TabsContent>

        <TabsContent value="support" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "open", "resolved"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={ticketFilter === f ? "default" : "outline"}
                onClick={() => setTicketFilter(f)}
              >
                {f === "all" ? t("filterAll") : f === "open" ? t("ticketOpen") : t("ticketResolved")}
              </Button>
            ))}
          </div>
          {supportLoading ? (
            <Skeleton className="h-40 w-full rounded-md" />
          ) : supportError ? (
            <ApiErrorState error={supportError} onRetry={refetchSupport} />
          ) : tickets.length === 0 ? (
            <Card className="cinect-admin-panel">
              <CardContent className="text-muted-foreground p-6 text-sm">{t("communityNoTickets")}</CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{ticket.subject}</p>
                    <Badge variant={ticket.isResolved ? "secondary" : "default"}>
                      {ticket.isResolved ? t("ticketResolved") : t("ticketOpen")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {ticket.name} · {ticket.email}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {ticket.createdAt ? format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm") : ""}
                  </p>
                  <p className="text-sm leading-relaxed">{ticket.message}</p>
                  {!ticket.isResolved && (
                    <Button
                      size="sm"
                      onClick={() =>
                        resolveTicket.mutate(
                          { id: ticket.id, isResolved: true },
                          { onSuccess: () => void refetchSupport() }
                        )
                      }
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {t("ticketMarkResolved")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="legacy" className="space-y-3">
          {legacy.map(renderPendingCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
