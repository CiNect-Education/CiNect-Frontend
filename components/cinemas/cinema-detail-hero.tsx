"use client";

import { MapPin } from "lucide-react";
import { RemoteImage } from "@/components/shared/remote-image";
import { buildGoogleMapsPlaceUrl } from "@/lib/maps";
import type { Cinema } from "@/types/domain";
import { Film } from "lucide-react";

interface CinemaDetailHeroProps {
  cinema: Cinema;
}

/** Cinestar .hbooking-new — image left + .address-box gradient right */
export function CinemaDetailHero({ cinema }: CinemaDetailHeroProps) {
  const mapUrl = buildGoogleMapsPlaceUrl({
    lat: cinema.latitude,
    lng: cinema.longitude,
    address: cinema.address,
    city: cinema.city,
  });

  return (
    <section className="cinect-hbooking-new" aria-label={cinema.name}>
      <div className="cinect-hbooking-left">
        {cinema.imageUrl ? (
          <RemoteImage
            src={cinema.imageUrl}
            alt={cinema.name}
            fill
            sizes="(max-width: 1023px) 100vw, 40vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1e293b]">
            <Film className="h-12 w-12 text-white/30" aria-hidden />
          </div>
        )}
      </div>
      <div className="cinect-hbooking-right">
        <div className="cinect-address-box">
          <h4 className="cinect-address-box__title">{cinema.name}</h4>
          {cinema.address ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cinect-address-box__address"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{cinema.address}</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
