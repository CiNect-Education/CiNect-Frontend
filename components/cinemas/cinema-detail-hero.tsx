"use client";

import { MapPin } from "lucide-react";
import { RemoteImage } from "@/components/shared/remote-image";
import { buildGoogleMapsPlaceUrl } from "@/lib/maps";
import type { Cinema } from "@/types/domain";
import { Film } from "lucide-react";

interface CinemaDetailHeroProps {
  cinema: Cinema;
}

/** Cinestar: .hbooking-new > .hbooking-left + .hbooking-right > .address-box */
export function CinemaDetailHero({ cinema }: CinemaDetailHeroProps) {
  const mapUrl = buildGoogleMapsPlaceUrl({
    lat: cinema.latitude,
    lng: cinema.longitude,
    address: cinema.address,
    city: cinema.city,
  });

  return (
    <div className="hbooking-new" aria-label={cinema.name}>
      <div className="hbooking-left">
        {cinema.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cinema.imageUrl} alt={cinema.name} />
        ) : (
          <div className="hbooking-left__placeholder">
            <Film className="h-12 w-12 text-white/30" aria-hidden />
          </div>
        )}
      </div>
      <div className="hbooking-right">
        <div className="address-box">
          <h4 className="sub-tittle txt-upper">{cinema.name}</h4>
          {cinema.address ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              <span className="ic" aria-hidden>
                <MapPin className="h-4 w-4" />
              </span>
              <span className="txt">{cinema.address}</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
