export const REFUND_REASON_CODES = [
  "SCHEDULE_CONFLICT",
  "WRONG_BOOKING",
  "DUPLICATE",
  "FOUND_CHEAPER",
  "OTHER",
] as const;

export type RefundReasonCode = (typeof REFUND_REASON_CODES)[number];

export function buildRefundReasonPayload(
  reasonCode: RefundReasonCode,
  reasonDetail?: string,
): { reasonCode: RefundReasonCode; reasonDetail?: string } {
  if (reasonCode === "OTHER") {
    return { reasonCode, reasonDetail: reasonDetail?.trim() };
  }
  return { reasonCode };
}

export function parseStoredRefundReason(reason?: string | null): {
  code: RefundReasonCode | null;
  detail?: string;
} {
  if (!reason) return { code: null };
  if (reason.startsWith("OTHER:")) {
    return { code: "OTHER", detail: reason.slice(6).trim() };
  }
  if ((REFUND_REASON_CODES as readonly string[]).includes(reason)) {
    return { code: reason as RefundReasonCode };
  }
  return { code: "OTHER", detail: reason };
}
