"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Search, Filter } from "lucide-react";

export default function OrdersPage() {
  const t = useTranslations("account");

  return (
    <div>
      <PageHeader
        title={t("orders")}
        description={t("ordersDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("orders") }]}
      />

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input placeholder="Search orders by ID..." className="pl-9" disabled />
            </div>
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table header for reference */}
          <div className="hidden rounded-md border sm:block">
            <div className="bg-muted/50 text-muted-foreground grid grid-cols-5 gap-4 border-b px-4 py-3 text-sm font-medium">
              <span>Order ID</span>
              <span>Movie</span>
              <span>Date</span>
              <span>Total</span>
              <span>Status</span>
            </div>
          </div>

          <EmptyState
            icon={Ticket}
            title="No orders yet"
            description="Your booking history will appear here once you make a purchase. Connect to backend API to load real data."
          />
        </CardContent>
      </Card>
    </div>
  );
}
