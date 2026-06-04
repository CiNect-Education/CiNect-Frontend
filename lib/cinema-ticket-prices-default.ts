/** Fallback when API unavailable — all room formats from DB. */
export type TicketPriceFormatLabel = "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";

export const TICKET_PRICE_FORMAT_ORDER: TicketPriceFormatLabel[] = [
  "2D",
  "3D",
  "IMAX",
  "4DX",
  "DOLBY",
];

export type TicketPriceRow = {
  id: string;
  categoryKey: string;
  slotPrimary: string;
  slotSecondary: string | null;
  subtitle: string | null;
  adultPrice: number;
  concessionPrice: number;
  sortOrder: number;
};

export type TicketPriceFormatGroup = {
  format: TicketPriceFormatLabel;
  rows: TicketPriceRow[];
};

const BASE_ROWS: Omit<TicketPriceRow, "id">[] = [
  {
    categoryKey: "happy_day",
    slotPrimary: "THỨ 2 (C'Monday)",
    slotSecondary: "THỨ 4 (C'Member)",
    subtitle: null,
    adultPrice: 45_000,
    concessionPrice: 45_000,
    sortOrder: 1,
  },
  {
    categoryKey: "happy_hour",
    slotPrimary: "Trước 10:00",
    slotSecondary: "Sau 22:00",
    subtitle: "C'Ten - Áp dụng cả tuần",
    adultPrice: 49_000,
    concessionPrice: 49_000,
    sortOrder: 2,
  },
  {
    categoryKey: "weekday",
    slotPrimary: "Thứ 3, 4, 5",
    slotSecondary: null,
    subtitle: null,
    adultPrice: 49_000,
    concessionPrice: 49_000,
    sortOrder: 3,
  },
  {
    categoryKey: "weekend",
    slotPrimary: "Thứ 6, 7, CN",
    slotSecondary: null,
    subtitle: null,
    adultPrice: 55_000,
    concessionPrice: 49_000,
    sortOrder: 4,
  },
  {
    categoryKey: "holiday",
    slotPrimary: "Theo quy định nghỉ Lễ, Tết",
    slotSecondary: null,
    subtitle: null,
    adultPrice: 60_000,
    concessionPrice: 60_000,
    sortOrder: 5,
  },
];

const SCALE: Record<TicketPriceFormatLabel, { adult: number[]; concession: number[] }> = {
  "2D": { adult: [1, 1, 1, 1, 1], concession: [1, 1, 1, 1, 1] },
  "3D": { adult: [1.22, 1.2, 1.2, 1.18, 1.17], concession: [1.22, 1.2, 1.2, 1.2, 1.17] },
  IMAX: { adult: [1.56, 1.63, 1.73, 1.64, 2], concession: [1.56, 1.63, 1.73, 1.63, 2] },
  "4DX": { adult: [1.78, 1.84, 1.94, 1.82, 2.17], concession: [1.78, 1.84, 1.94, 1.84, 2.17] },
  DOLBY: { adult: [1.44, 1.51, 1.59, 1.55, 1.83], concession: [1.44, 1.51, 1.59, 1.55, 1.83] },
};

function roundPrice(n: number): number {
  return Math.round(n / 1_000) * 1_000;
}

function buildGroup(format: TicketPriceFormatLabel): TicketPriceFormatGroup {
  const s = SCALE[format];
  return {
    format,
    rows: BASE_ROWS.map((row, i) => ({
      ...row,
      id: `${format.toLowerCase()}-${row.categoryKey}`,
      adultPrice: roundPrice(row.adultPrice * s.adult[i]),
      concessionPrice: roundPrice(row.concessionPrice * s.concession[i]),
    })),
  };
}

export const DEFAULT_CINEMA_TICKET_PRICES: TicketPriceFormatGroup[] =
  TICKET_PRICE_FORMAT_ORDER.map(buildGroup);
