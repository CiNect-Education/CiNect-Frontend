"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { RemoteImage } from "@/components/shared/remote-image";

type PromoItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
};

interface CinemaDetailPromotionsProps {
  promotions: PromoItem[];
}

export function CinemaDetailPromotions({ promotions }: CinemaDetailPromotionsProps) {
  const t = useTranslations("cinemas");

  if (promotions.length === 0) return null;

  return (
    <section className="sec-km">
      <div className="km ht">
        <div className="sec-heading km-m-head">
          <h2 className="heading">{t("promotionsSection")}</h2>
          <Link href="/promotions" className="km-m-all">
            {t("allPromotions")}
          </Link>
        </div>
        <div className="km-m-slider">
          {promotions.map((promo) => (
            <Link key={promo.id} href={`/promotions/${promo.id}`} className="km-bn-img col col-4">
              {promo.imageUrl ? (
                <RemoteImage
                  src={promo.imageUrl}
                  alt={promo.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <span className="km-bn-fallback">{promo.title}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
