export const REVIEW_EMOTION_TAG_KEYS = [
  "great",
  "satisfied",
  "touching",
  "funny",
  "meaningful",
  "masterpiece",
  "worth_watching",
] as const;

export type ReviewEmotionTagKey = (typeof REVIEW_EMOTION_TAG_KEYS)[number];
