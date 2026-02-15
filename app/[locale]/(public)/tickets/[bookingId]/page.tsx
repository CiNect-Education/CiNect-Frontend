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

export default function TicketPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { data: bookingRes, isLoading, error, refetch } = useBooking(bookingId);
  const booking = bookingRes?.data as import("@/types/domain").Booking | undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Placeholder for PDF download
    alert("PDF download feature coming soon");
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
  const showtimeStr = booking.showtime ?? booking.createdAt;
  const formatType = booking.format ?? "2D";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-3xl font-bold">Your Ticket</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
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
            <div className="rounded-lg border-4 border-primary/20 p-4">
              <QRCodeSVG
                value={qrCode ?? bookingId}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Scan this code at the cinema entrance
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Date & Time</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(showtimeStr), "PPP")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(showtimeStr), "p")}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Cinema</div>
                <div className="text-sm text-muted-foreground">{cinemaName}</div>
                <div className="text-sm text-muted-foreground">
                  Room {roomName}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Seats</div>
                <div className="text-sm text-muted-foreground">
                  {seats?.map((s) => `${s.row}${s.number}`).join(", ") ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Showtime</div>
                <div className="text-sm text-muted-foreground">
                  {showtimeStr}
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
                          (snack.unitPrice ?? snack.totalPrice ?? 0) *
                          snack.quantity
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
                <span className="text-muted-foreground">
                  Tickets ({seats.length})
                </span>
                <span>
                  $
                  {seats
                    .reduce((s, seat) => s + (seat.price ?? 0), 0)
                    .toFixed(2)}
                </span>
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
                        (snack.totalPrice ??
                          (snack.unitPrice ?? 0) * snack.quantity),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            )}
            {(booking.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${(booking.discountAmount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-lg">
                ${(payment?.amount ?? booking.finalAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Booking Info */}
          <div className="space-y-1 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <div>Booking ID: {booking.id}</div>
            <div>
              Transaction ID: {payment?.transactionId ?? "N/A"}
            </div>
            <div>
              Booked on: {format(new Date(booking.createdAt), "PPp")}
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
