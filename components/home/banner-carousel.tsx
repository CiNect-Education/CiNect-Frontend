"use client";

import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
              <div className="cinect-banner-carousel__slide relative w-full overflow-hidden rounded-lg bg-neutral-900">
                <RemoteImage
                  src={banner.imageUrl}
                  alt={banner.title ?? "Banner"}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious variant="ghost" className="cinect-banner-carousel__nav cinect-banner-carousel__nav--prev">
        <ChevronLeft className="cinect-banner-carousel__chevron" strokeWidth={2.25} aria-hidden />
      </CarouselPrevious>
      <CarouselNext variant="ghost" className="cinect-banner-carousel__nav cinect-banner-carousel__nav--next">
        <ChevronRight className="cinect-banner-carousel__chevron" strokeWidth={2.25} aria-hidden />
      </CarouselNext>
    </Carousel>
  );
}
