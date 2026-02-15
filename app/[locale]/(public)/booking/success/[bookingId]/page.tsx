"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBooking } from "@/hooks/queries/use-booking-flow";
import { CheckCircle, Download, Calendar, MapPin, Clock } from "lucide-react";

export default function BookingSuccessPage() {
  const params = useParams();
  const t = useTranslations();
  const bookingId = params.bookingId as string;

  const { data: bookingRes, isLoading, error, refetch } = useBooking(bookingId);
  const booking = bookingRes?.data as import("@/types/domain").Booking | undefined;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your booking has been confirmed. Check your email for details.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Booking Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Booking Details</h2>
              <span className="text-sm text-muted-foreground">#{booking.id}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{booking.movieTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.showtime || booking.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {new Date(booking.showtime || booking.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Show Time</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{booking.cinemaName}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.roomName} • {booking.seats?.length || 0} seats
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seats */}
          <div>
            <h3 className="font-semibold mb-2">Seats</h3>
            <div className="flex flex-wrap gap-2">
              {booking.seats?.map((seat) => (
                <div key={seat.seatId} className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
                  {seat.row}{seat.number}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div>
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tickets</span>
                <span>${booking.payment?.amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total Paid</span>
                <span>${booking.payment?.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Ticket
            </Button>
            <Button asChild className="flex-1">
              <Link href="/account/orders">View Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="ghost" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
