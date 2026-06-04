/** First sentence or short excerpt for card hover tagline. */
export function movieTagline(description?: string, maxLen = 140): string | null {
  const text = description?.trim();
  if (!text) return null;
  const sentence = text.match(/^[^.!?…]+[.!?…]?/)?.[0]?.trim() ?? text;
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

const LANG_COUNTRY_KEYS: Record<string, string> = {
  japanese: "countryJapan",
  ja: "countryJapan",
  jpn: "countryJapan",
  korean: "countryKorea",
  ko: "countryKorea",
  kor: "countryKorea",
  english: "countryUSA",
  en: "countryUSA",
  eng: "countryUSA",
  vietnamese: "countryVietnam",
  vi: "countryVietnam",
  vie: "countryVietnam",
  chinese: "countryChina",
  zh: "countryChina",
  mandarin: "countryChina",
  cmn: "countryChina",
  french: "countryFrance",
  fr: "countryFrance",
  hindi: "countryIndia",
  thai: "countryThailand",
};

export function countryLabelForLanguage(
  language: string | undefined,
  tr: (key: string) => string,
): string | null {
  if (!language?.trim()) return null;
  const key = LANG_COUNTRY_KEYS[language.trim().toLowerCase()];
  if (!key) return null;
  try {
    return tr(key);
  } catch {
    return null;
  }
}
