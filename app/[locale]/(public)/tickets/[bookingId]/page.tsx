"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBooking } from "@/hooks/queries/use-booking-flow";
import { Download, Printer, Calendar, MapPin, Clock, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

function safeDate(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const d = new Date(value as any);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default function TicketPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { data: bookingRes, isLoading, error, refetch } = useBooking(bookingId);
  const booking = bookingRes?.data as import("@/types/domain").Booking | undefined;

  const handleDownload = () => {
    // Use browser print dialog so users can choose "Save as PDF"
    window.print();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!booking) return null;

  const { seats, snacks, payment, qrCode } = booking;
  const movieTitle = booking.movieTitle ?? "Movie";
  const cinemaName = booking.cinemaName ?? "";
  const roomName = booking.roomName ?? "";
  const showtimeValue =
    typeof booking.showtime === "string" || typeof booking.showtime === "number" || booking.showtime instanceof Date
      ? booking.showtime
      : booking.showtime && typeof booking.showtime === "object" && "startTime" in (booking.showtime as any)
        ? (booking.showtime as { startTime?: unknown }).startTime
        : booking.createdAt;
  const showtimeStr =
    typeof showtimeValue === "string" || typeof showtimeValue === "number"
      ? String(showtimeValue)
      : showtimeValue instanceof Date
        ? showtimeValue.toISOString()
        : String(booking.createdAt);
  const formatType = booking.format ?? "2D";
  const showtimeDate = safeDate(showtimeValue);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-3xl font-bold">Your Ticket</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Save / Print PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{movieTitle}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formatType}</Badge>
                {payment && (
                  <Badge
                    variant={payment.status === "PAID" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {payment.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="border-primary/20 rounded-lg border-4 p-4">
              <QRCodeSVG value={qrCode ?? bookingId} size={200} level="H" includeMargin={false} />
            </div>
          </div>

          <div className="text-muted-foreground text-center text-sm space-y-1">
            <p>Scan this QR code at the cinema entrance.</p>
            <p>Vui lòng có mặt trước giờ chiếu khoảng 15 phút để làm thủ tục vào rạp.</p>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Date & Time</div>
                <div className="text-muted-foreground text-sm">
                  {showtimeDate ? format(showtimeDate, "PPP") : "—"}
                </div>
                <div className="text-muted-foreground text-sm">
                  {showtimeDate ? format(showtimeDate, "p") : "—"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Cinema</div>
                <div className="text-muted-foreground text-sm">{cinemaName}</div>
                <div className="text-muted-foreground text-sm">Room {roomName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Seats</div>
                <div className="text-muted-foreground text-sm">
                  {seats?.map((s) => `${s.row}${s.number}`).join(", ") ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Showtime</div>
                <div className="text-muted-foreground text-sm">
                  {showtimeDate ? format(showtimeDate, "PPpp") : "—"}
                </div>
              </div>
            </div>
          </div>

          {snacks && snacks.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium">Snacks & Combos</div>
                <div className="space-y-2">
                  {snacks.map((snack, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {snack.quantity}x {snack.name}
                      </span>
                      <span>
                        $
                        {(
                          (toNumber(snack.unitPrice) || toNumber(snack.totalPrice)) *
                          toNumber(snack.quantity)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            {seats && seats.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tickets ({seats.length})</span>
                <span>${seats.reduce((s, seat) => s + toNumber(seat.price), 0).toFixed(2)}</span>
              </div>
            )}
            {snacks && snacks.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Snacks</span>
                <span>
                  $
                  {snacks
                    .reduce(
                      (s, snack) =>
                        s +
                        (toNumber(snack.totalPrice) ||
                          toNumber(snack.unitPrice) * toNumber(snack.quantity)),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            )}
            {toNumber(booking.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${toNumber(booking.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-lg">
                ${(toNumber(payment?.amount) || toNumber(booking.finalAmount)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-muted text-muted-foreground space-y-1 rounded-lg p-4 text-xs">
            <div>Booking ID: {booking.id}</div>
            <div>Transaction ID: {payment?.transactionId ?? "N/A"}</div>
            <div>
              Booked on:{" "}
              {safeDate(booking.createdAt) ? format(new Date(booking.createdAt), "PPp") : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
