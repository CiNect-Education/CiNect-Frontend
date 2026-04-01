"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/hooks/queries/use-bookings";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { Ticket, ArrowLeft } from "lucide-react";
import type { Booking } from "@/types/domain";

export default function OrderDetailPage() {
  const t = useTranslations("account");
  const params = useParams();
  const orderId = params.id as string;

  const { data, isLoading, error, refetch } = useBooking(orderId);
  const booking = (data?.data ?? data) as Booking | undefined;

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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : !booking ? (
        <Card className="cinect-glass border">
          <CardContent className="py-10 text-center">
            <Ticket className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
            <p className="text-sm font-semibold">Order not found</p>
            <p className="text-muted-foreground mt-1 text-sm">This order may have been removed.</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/account/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="cinect-glass border lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">Order Details</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{booking.status}</Badge>
                  <Badge variant="secondary">{(booking.finalAmount ?? 0).toLocaleString()}đ</Badge>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">#{booking.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">{booking.movieTitle}</p>
                <p className="text-muted-foreground text-xs">
                  {booking.cinemaName}
                  {booking.roomName ? ` • ${booking.roomName}` : ""} •{" "}
                  {format(new Date(booking.showtime), "PPpp")}
                </p>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Seats</p>
                  <p className="font-medium">
                    {booking.seats?.length
                      ? booking.seats.map((s) => `${s.row}${s.number}`).join(", ")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Format</p>
                  <p className="font-medium">{booking.format ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{format(new Date(booking.createdAt), "PPpp")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Updated</p>
                  <p className="font-medium">{format(new Date(booking.updatedAt), "PPpp")}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/account/orders">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/tickets/${booking.id}`}>View ticket</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="cinect-glass border">
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{(booking.totalAmount ?? 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{(booking.discountAmount ?? 0).toLocaleString()}đ</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{(booking.finalAmount ?? 0).toLocaleString()}đ</span>
                </div>

                {(booking.promotionCode || (booking.pointsUsed ?? 0) > 0 || booking.giftCardCode) && (
                  <div className="text-muted-foreground pt-2 text-xs">
                    {booking.promotionCode && <p>Promo: {booking.promotionCode}</p>}
                    {booking.pointsUsed && booking.pointsUsed > 0 && (
                      <p>Points: {booking.pointsUsed.toLocaleString()} pts</p>
                    )}
                    {booking.giftCardCode && <p>Gift card: {booking.giftCardCode}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cinect-glass border">
              <CardHeader>
                <CardTitle className="text-lg">Receipt</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                <p>Payment method: {booking.payment?.method ?? "—"}</p>
                <p>Payment status: {booking.payment?.status ?? "—"}</p>
                {booking.payment?.transactionId && <p>Transaction: {booking.payment.transactionId}</p>}
                {booking.payment?.paidAt && <p>Paid at: {format(new Date(booking.payment.paidAt), "PPpp")}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
