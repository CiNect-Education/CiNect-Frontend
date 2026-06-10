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
  useApproveCommunityReview,
  useApproveCommunityPost,
  useApproveCommunityPhoto,
  useAdminSupportTickets,
} from "@/hooks/queries/use-community";
import { Check } from "lucide-react";

type PendingItem = {
  id: string;
  kind: "review" | "post" | "photo";
  title: string;
  subtitle?: string;
};

export default function AdminCommunityPage() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"pending" | "support">("pending");
  const { data, isLoading, error, refetch } = useAdminCommunityPending();
  const { data: supportRes, isLoading: supportLoading, error: supportError, refetch: refetchSupport } =
    useAdminSupportTickets({ page: 1, limit: 50 });
  const approveReview = useApproveCommunityReview();
  const approvePost = useApproveCommunityPost();
  const approvePhoto = useApproveCommunityPhoto();

  const pending = useMemo<PendingItem[]>(() => {
    const raw = data?.data;
    if (!raw) return [];
    const reviews = (raw.reviews ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      kind: "review" as const,
      title: String((r.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: String((r.movie as { title?: string })?.title ?? r.content ?? ""),
    }));
    const posts = (raw.posts ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      kind: "post" as const,
      title: String((p.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: String(p.content ?? ""),
    }));
    const photos = (raw.photos ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      kind: "photo" as const,
      title: String((p.user as { fullName?: string })?.fullName ?? "User"),
      subtitle: String(p.caption ?? p.imageUrl ?? ""),
    }));
    return [...reviews, ...posts, ...photos];
  }, [data]);

  const tickets = supportRes?.data ?? [];

  function approveItem(item: PendingItem) {
    if (item.kind === "review") approveReview.mutate({ id: item.id }, { onSuccess: () => void refetch() });
    if (item.kind === "post") approvePost.mutate({ id: item.id }, { onSuccess: () => void refetch() });
    if (item.kind === "photo") approvePhoto.mutate({ id: item.id }, { onSuccess: () => void refetch() });
  }

  return (
    <div>
      <PageHeader
        title={t("communityModeration")}
        description={t("descCommunityModeration")}
        breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("communityModeration") }]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">{t("communityPending")}</TabsTrigger>
          <TabsTrigger value="support">{t("communitySupportTickets")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-md" />
          ) : error ? (
            <ApiErrorState error={error} onRetry={refetch} />
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground p-6 text-sm">{t("communityNoPending")}</CardContent>
            </Card>
          ) : (
            pending.map((item) => (
              <Card key={`${item.kind}-${item.id}`}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-muted-foreground text-sm">{item.subtitle}</p>
                    <Badge variant="outline">{item.kind.toUpperCase()}</Badge>
                  </div>
                  <Button size="sm" onClick={() => approveItem(item)}>
                    <Check className="mr-2 h-4 w-4" />
                    {t("communityApprove")}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="support" className="space-y-3">
          {supportLoading ? (
            <Skeleton className="h-40 w-full rounded-md" />
          ) : supportError ? (
            <ApiErrorState error={supportError} onRetry={refetchSupport} />
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground p-6 text-sm">{t("communityNoTickets")}</CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{ticket.subject}</p>
                    <Badge variant={ticket.isResolved ? "secondary" : "default"}>
                      {ticket.isResolved ? "Resolved" : "Open"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {ticket.name} · {ticket.email}
                  </p>
                  <p className="text-sm">{ticket.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
