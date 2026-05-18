"use client";

import { Link } from "@/i18n/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { RemoteImage } from "@/components/shared/remote-image";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  priority: number;
  title?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  if (!banners.length) return null;

  return (
    <Carousel opts={{ align: "start", loop: true }} className="cinect-banner-carousel w-full">
      <CarouselContent className="ml-0">
        {banners.map((banner) => (
          <CarouselItem key={banner.id} className="basis-full pl-0">
            <Link href={banner.linkUrl || "#"} className="block">
              <div className="cinect-banner-carousel__slide relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted md:aspect-[3/1]">
                <RemoteImage
                  src={banner.imageUrl}
                  alt={banner.title ?? "Banner"}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="cinect-carousel-nav cinect-carousel-nav--prev left-3 top-1/2 -translate-y-1/2 border-0 bg-black/45 text-white hover:bg-black/65 md:left-4" />
      <CarouselNext className="cinect-carousel-nav cinect-carousel-nav--next right-3 top-1/2 -translate-y-1/2 border-0 bg-black/45 text-white hover:bg-black/65 md:right-4" />
    </Carousel>
  );
}
