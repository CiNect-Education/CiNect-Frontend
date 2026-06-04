"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCinemaTicketPrices } from "@/hooks/queries/use-cinemas";
import {
  DEFAULT_CINEMA_TICKET_PRICES,
  TICKET_PRICE_FORMAT_ORDER,
  type TicketPriceFormatGroup,
  type TicketPriceFormatLabel,
  type TicketPriceRow,
} from "@/lib/cinema-ticket-prices-default";
import { cn } from "@/lib/utils";

function formatVnd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CinemaDetailTicketPricesProps {
  cinemaId: string;
}

export function CinemaDetailTicketPrices({ cinemaId }: CinemaDetailTicketPricesProps) {
  const t = useTranslations("cinemas");
  const locale = useLocale();
  const { data } = useCinemaTicketPrices(cinemaId);

  const formats = useMemo<TicketPriceFormatGroup[]>(() => {
    const apiFormats = data?.data?.formats;
    if (apiFormats?.length) {
      return apiFormats as TicketPriceFormatGroup[];
    }
    return DEFAULT_CINEMA_TICKET_PRICES;
  }, [data]);

  const formatTabs = useMemo(() => {
    const fromApi = formats.map((g) => g.format);
    return TICKET_PRICE_FORMAT_ORDER.filter((f) => fromApi.includes(f)).length > 0
      ? TICKET_PRICE_FORMAT_ORDER.filter((f) => fromApi.includes(f))
      : fromApi;
  }, [formats]);

  const [activeFormat, setActiveFormat] = useState<TicketPriceFormatLabel>("2D");

  useEffect(() => {
    if (formatTabs.length > 0 && !formatTabs.includes(activeFormat)) {
      setActiveFormat(formatTabs[0]);
    }
  }, [formatTabs, activeFormat]);

  const activeGroup =
    formats.find((g) => g.format === activeFormat) ??
    formats[0] ??
    DEFAULT_CINEMA_TICKET_PRICES[0];

  const categoryLabel = (key: string) => {
    const map: Record<string, string> = {
      happy_day: t("priceCategoryHappyDay"),
      happy_hour: t("priceCategoryHappyHour"),
      weekday: t("priceCategoryWeekday"),
      weekend: t("priceCategoryWeekend"),
      holiday: t("priceCategoryHoliday"),
    };
    return map[key] ?? key;
  };

  return (
    <div className="price-ticket">
      <div className="price-ticket-wr">
        <div className="tab-price-ticket">
          <div className="tab-control">
            <ul className="list">
              {formatTabs.map((fmt) => (
                <li key={fmt}>
                  <button
                    type="button"
                    className={cn("it tabBtn", activeFormat === fmt && "active")}
                    onClick={() => setActiveFormat(fmt)}
                  >
                    {fmt}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="tab-table">
            <div className="price-table-panel open">
              <table className="price-table">
                <thead>
                  <tr>
                    <th className="price-table__brand">
                      <span className="price-table__brand-logo">CiNect</span>
                      <span className="price-table__brand-title">
                        {t("priceTableTitle", { format: activeFormat })}
                      </span>
                    </th>
                    <th>{t("priceColShowtime")}</th>
                    <th>{t("priceColAdult")}</th>
                    <th>{t("priceColConcession")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGroup.rows.length > 0 ? (
                    activeGroup.rows.map((row: TicketPriceRow) => {
                      const samePrice = row.adultPrice === row.concessionPrice;
                      const isHappyDay = row.categoryKey === "happy_day";
                      return (
                        <tr
                          key={row.id}
                          className={cn(isHappyDay && "price-table__row--highlight")}
                        >
                          <td className="price-table__cat">
                            <span className="price-table__cat-name">
                              {categoryLabel(row.categoryKey)}
                            </span>
                            {row.subtitle ? (
                              <span className="price-table__cat-sub">({row.subtitle})</span>
                            ) : null}
                          </td>
                          <td className="price-table__slots">
                            <span>{row.slotPrimary}</span>
                            {row.slotSecondary ? <span>{row.slotSecondary}</span> : null}
                          </td>
                          {samePrice && isHappyDay ? (
                            <td className="price-table__merged" colSpan={2}>
                              <span className="price-table__amount price-table__amount--hero">
                                {formatVnd(row.adultPrice, locale)}
                              </span>
                            </td>
                          ) : (
                            <>
                              <td className="price-table__amount-cell">
                                <span className="price-table__amount">
                                  {formatVnd(row.adultPrice, locale)}
                                </span>
                              </td>
                              <td className="price-table__amount-cell price-table__amount-cell--concession">
                                <span className="price-table__amount">
                                  {formatVnd(row.concessionPrice, locale)}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="price-table__empty">
                        {t("ticketPricesFormatEmpty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="price-table-notes">
                <div className="price-table-notes__col">
                  <p>{t("priceNoteConcession")}</p>
                </div>
                <div className="price-table-notes__col">
                  <p>{t("priceNoteHappyDay")}</p>
                  <p>{t("priceNoteHappyHour")}</p>
                  <p>{t("priceNoteHoliday")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
