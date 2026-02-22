"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { Ticket } from "lucide-react";

export default function OrderDetailPage() {
  const t = useTranslations("account");
  const params = useParams();
  const orderId = params.id as string;

  return (
    <div>
      <PageHeader
        title={`Order #${orderId}`}
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("orders"), href: "/account/orders" },
          { label: `#${orderId}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Details</CardTitle>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <CardDescription>Connect to backend to load order data.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Ticket}
              title="No order data available"
              description="Order details will be displayed once connected to the booking API."
            />
          </CardContent>
        </Card>

        {/* Payment Info */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>--</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>--</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Showtime Info</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>Cinema: --</p>
              <p>Room: --</p>
              <p>Date: --</p>
              <p>Time: --</p>
              <p>Seats: --</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
