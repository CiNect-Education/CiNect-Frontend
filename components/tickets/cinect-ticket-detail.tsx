"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { useTranslations } from "next-intl";
import { formatVnd, localizeRoomName } from "@/lib/showtime-display";
import type { Booking } from "@/types/domain";

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function safeDate(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}

function resolveShowtime(booking: Booking): unknown {
  const raw = booking.showtime as unknown;
  if (typeof raw === "string" || typeof raw === "number") return raw;
  if (raw && typeof raw === "object" && "startTime" in raw) {
    return (raw as { startTime?: unknown }).startTime;
  }
  return booking.createdAt;
}

type Props = {
  booking: Booking;
  locale: string;
  dateFnsLocale: Locale;
};

export function CinectTicketDetail({ booking, locale, dateFnsLocale }: Props) {
  const t = useTranslations("tickets");
  const tShow = useTranslations("showtimeDisplay");
  const price = (n: number) => formatVnd(n, locale);

  const { seats, snacks, payment, qrCode } = booking;
  const showtimeDate = safeDate(resolveShowtime(booking));
  const roomLabel = booking.roomName
    ? localizeRoomName(booking.roomName, (k, v) => tShow(k, v))
    : "—";

  return (
    <Card className="cinect-glass border-border/60">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{booking.movieTitle}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{booking.format}</Badge>
              {payment ? (
                <Badge
                  variant={payment.status === "PAID" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {payment.status}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-center py-6">
          <div className="border-primary/20 rounded-lg border-4 p-4">
            <QRCodeSVG value={qrCode ?? booking.id} size={200} level="H" includeMargin={false} />
          </div>
        </div>

        <div className="text-muted-foreground space-y-1 text-center text-sm">
          <p>{t("scanQrHint")}</p>
          <p>{t("arriveEarlyHint")}</p>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("dateLabel")}</div>
              <div className="text-muted-foreground text-sm">
                {showtimeDate ? format(showtimeDate, "PPP", { locale: dateFnsLocale }) : "—"}
              </div>
              <div className="text-muted-foreground text-sm">
                {showtimeDate ? format(showtimeDate, "p", { locale: dateFnsLocale }) : "—"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("cinemaInfo")}</div>
              <div className="text-muted-foreground text-sm">{booking.cinemaName}</div>
              <div className="text-muted-foreground text-sm">{roomLabel}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("seatsLabel")}</div>
              <div className="text-muted-foreground text-sm">
                {seats?.map((s) => `${s.row}${s.number}`).join(", ") ?? "—"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("timeLabel")}</div>
              <div className="text-muted-foreground text-sm">
                {showtimeDate ? format(showtimeDate, "PPpp", { locale: dateFnsLocale }) : "—"}
              </div>
            </div>
          </div>
        </div>

        {snacks && snacks.length > 0 ? (
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
                      {price(
                        (toNumber(snack.unitPrice) || toNumber(snack.totalPrice)) *
                          toNumber(snack.quantity)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between font-bold">
            <span>{t("totalLabel")}</span>
            <span className="text-lg">
              {price(toNumber(payment?.amount) || toNumber(booking.finalAmount))}
            </span>
          </div>
        </div>

        <div className="bg-muted text-muted-foreground space-y-1 rounded-lg p-4 text-xs">
          <div>
            {t("bookingIdLabel")}: {booking.id}
          </div>
          <div>
            {t("transactionIdLabel")}: {payment?.transactionId ?? "N/A"}
          </div>
          <div>
            {showtimeDate
              ? format(safeDate(booking.createdAt) ?? showtimeDate, "PPp", { locale: dateFnsLocale })
              : "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
