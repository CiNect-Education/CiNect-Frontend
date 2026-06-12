/** Local product shots — synced with `public/media/snacks` and seed `SEED_SNACK_IMAGES`. */
const SNACK_IMAGE_BY_NAME: Record<string, string> = {
  "Popcorn (L)": "/media/snacks/popcorn-l.png",
  "Popcorn (M)": "/media/snacks/popcorn-m.png",
  "Coca-Cola (L)": "/media/snacks/coca-cola-l.png",
  "Combo Couple": "/media/snacks/combo-couple.png",
  "Combo Family": "/media/snacks/combo-family.png",
  Nachos: "/media/snacks/nachos.png",
  "Hot Dog": "/media/snacks/hot-dog.png",
  "Water Bottle": "/media/snacks/water-bottle.png",
};

export function resolveSnackImageUrl(snack: {
  name: string;
  imageUrl?: string | null;
}): string | null {
  const local = SNACK_IMAGE_BY_NAME[snack.name.trim()];
  if (local) return local;
  const remote = snack.imageUrl?.trim();
  return remote || null;
}
