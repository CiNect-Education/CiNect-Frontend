"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { useTranslations } from "next-intl";
import { formatVnd, localizeRoomName } from "@/lib/showtime-display";
import type { Booking } from "@/types/domain";
import { cn } from "@/lib/utils";

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

export type CinectETicketProps = {
  booking: Booking;
  locale: string;
  dateFnsLocale: Locale;
  className?: string;
};

export const CinectETicket = forwardRef<HTMLDivElement, CinectETicketProps>(function CinectETicket(
  { booking, locale, dateFnsLocale, className },
  ref
) {
  const t = useTranslations("tickets");
  const tShow = useTranslations("showtimeDisplay");
  const price = (n: number) => formatVnd(n, locale);

  const { seats, snacks, payment, qrCode } = booking;
  const showtimeDate = safeDate(resolveShowtime(booking));
  const seatLabels = seats?.map((s) => `${s.row}${s.number}`).join(", ") ?? "—";
  const roomLabel = booking.roomName
    ? localizeRoomName(booking.roomName, (k, v) => tShow(k, v))
    : "—";
  const totalPaid = toNumber(payment?.amount) || toNumber(booking.finalAmount);
  const paymentStatus = payment?.status ?? booking.status;
  const isPaid = paymentStatus === "PAID" || paymentStatus === "CONFIRMED" || paymentStatus === "COMPLETED";

  const snackSummary =
    snacks && snacks.length > 0
      ? snacks.map((s) => `${s.quantity}× ${s.name}`).join(" · ")
      : null;

  return (
    <div ref={ref} className={cn("cet-ticket", className)}>
      <aside className="cet-brand">
        <div className="cet-brand-logo">CiNect</div>
        <div className="cet-brand-tag">E-Ticket</div>
        <div className={cn("cet-brand-status", isPaid && "cet-brand-status--paid")}>
          {isPaid ? t("statusPaid") : paymentStatus}
        </div>
      </aside>

      <main className="cet-body">
        <div className="cet-body-head">
          <h2 className="cet-movie-title">{booking.movieTitle}</h2>
          <p className="cet-meta-line">
            <span>{booking.cinemaName}</span>
            <span className="cet-meta-dot">•</span>
            <span>{roomLabel}</span>
            <span className="cet-meta-dot">•</span>
            <span>{booking.format}</span>
          </p>
        </div>

        <div className="cet-info-grid">
          <div className="cet-info-cell">
            <span className="cet-info-label">{t("dateLabel")}</span>
            <span className="cet-info-value">
              {showtimeDate ? format(showtimeDate, "dd/MM/yyyy", { locale: dateFnsLocale }) : "—"}
            </span>
          </div>
          <div className="cet-info-cell">
            <span className="cet-info-label">{t("timeLabel")}</span>
            <span className="cet-info-value">
              {showtimeDate ? format(showtimeDate, "HH:mm", { locale: dateFnsLocale }) : "—"}
            </span>
          </div>
          <div className="cet-info-cell">
            <span className="cet-info-label">{t("seatsLabel")}</span>
            <span className="cet-info-value cet-info-value--seats">{seatLabels}</span>
          </div>
          <div className="cet-info-cell cet-info-cell--total">
            <span className="cet-info-label">{t("totalLabel")}</span>
            <span className="cet-info-value cet-info-value--total">{price(totalPaid)}</span>
          </div>
        </div>

        {snackSummary ? <p className="cet-snacks">{snackSummary}</p> : null}

        <div className="cet-footer-meta">
          <span>
            {t("bookingIdLabel")}: {booking.id.slice(0, 8).toUpperCase()}
          </span>
          {payment?.transactionId ? (
            <>
              <span className="cet-meta-dot">•</span>
              <span>
                {t("transactionIdLabel")}: {payment.transactionId.slice(0, 12)}
              </span>
            </>
          ) : null}
        </div>
      </main>

      <div className="cet-perforation" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="cet-perforation-dot" />
        ))}
      </div>

      <aside className="cet-stub">
        <div className="cet-qr-wrap">
          <QRCodeSVG value={qrCode ?? booking.id} size={108} level="H" includeMargin={false} />
        </div>
        <p className="cet-stub-hint">{t("scanQrHint")}</p>
        <p className="cet-stub-seats">{seatLabels}</p>
      </aside>
    </div>
  );
});
