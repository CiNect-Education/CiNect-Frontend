"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { BookingRefundDialog } from "@/components/account/booking-refund-dialog";
import { CinectETicket } from "@/components/tickets/cinect-e-ticket";
import { CinectTicketDetail } from "@/components/tickets/cinect-ticket-detail";
import { useBooking } from "@/hooks/queries/use-booking-flow";
import { Download, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { enUS } from "date-fns/locale";
import { vi as viDateLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { printTicketHtml } from "@/lib/ticket-print";
import { isValid } from "date-fns";

export default function TicketPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const locale = useLocale();
  const t = useTranslations("tickets");
  const tAccount = useTranslations("account");
  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: bookingRes, isLoading, error, refetch } = useBooking(bookingId);
  const booking = bookingRes?.data as import("@/types/domain").Booking | undefined;
  const printTicketRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const ticketNode = printTicketRef.current;
    if (!ticketNode) {
      toast.error(t("printFailed"));
      return;
    }

    printTicketHtml(ticketNode.outerHTML, () => {
      toast.error(t("printFailed"));
    });
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

  const showtimeDate = new Date(booking.showtime);
  const canRefund =
    booking.status === "CONFIRMED" &&
    booking.payment?.status === "PAID" &&
    isValid(showtimeDate) &&
    showtimeDate >= new Date();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("yourTicket")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("arriveEarlyHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRefund ? (
            <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)} className="shrink-0">
              <Undo2 className="mr-2 h-4 w-4" />
              {tAccount("requestRefund")}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleDownload} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            {t("savePrintPdf")}
          </Button>
        </div>
      </div>

      <CinectTicketDetail booking={booking} locale={locale} dateFnsLocale={dateFnsLocale} />

      <BookingRefundDialog
        booking={booking}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSuccess={() => refetch()}
      />

      {/* Landscape e-ticket — print/PDF only (off-screen) */}
      <div className="ticket-print-source" aria-hidden="true">
        <CinectETicket
          ref={printTicketRef}
          booking={booking}
          locale={locale}
          dateFnsLocale={dateFnsLocale}
        />
      </div>
    </div>
  );
}
