"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("account");

  return (
    <div>
      <PageHeader
        title={t("notifications")}
        description={t("notificationsDesc")}
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("notifications") },
        ]}
        actions={
          <Button variant="outline" size="sm" disabled>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You are all caught up. Notifications about your bookings, promotions, and membership updates will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
