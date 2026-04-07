/**
 * Map common API audio / subtitle labels to the active UI locale via next-intl keys under `showtimeDisplay`.
 */
export function localizeAudioLabel(raw: string, tr: (key: string) => string): string {
  const v = raw.trim();
  if (!v) return v;
  const n = v.toLowerCase().replace(/\s+/g, " ").trim();
  if (n === "english" || n === "en" || n === "eng") return tr("langEnglish");
  if (n === "vietnamese" || n === "vi" || n === "vie") return tr("langVietnamese");
  if (n === "korean" || n === "ko" || n === "kor") return tr("langKorean");
  if (n === "japanese" || n === "ja" || n === "jpn") return tr("langJapanese");
  if (n === "chinese" || n === "zh" || n === "mandarin" || n === "cmn") return tr("langChinese");
  return v;
}

/** Turns `Screen 1 - Dolby` into `Phòng 1 - Dolby` in Vietnamese. */
export function localizeRoomName(
  raw: string,
  tr: (key: string, values: { detail: string }) => string
): string {
  const v = raw.trim();
  const m = v.match(/^screen\s*(.+)$/i);
  if (m?.[1]) return tr("screenRoomDetail", { detail: m[1].trim() });
  return v;
}

export function formatVnd(amount: number, localeCode: string): string {
  const tag = localeCode.startsWith("vi") ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
