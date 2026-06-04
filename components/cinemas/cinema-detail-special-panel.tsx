"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";

interface CinemaDetailSpecialPanelProps {
  children?: ReactNode;
}

/** Cinestar: empty special tab shows play icon + "ĐANG CẬP NHẬT". */
export function CinemaDetailSpecialEmpty() {
  const t = useTranslations("cinemas");

  return (
    <div className="movies-special-empty" role="status">
      <div className="movies-special-empty__icon" aria-hidden>
        <span className="movies-special-empty__screen">
          <Play className="movies-special-empty__play" />
        </span>
        <span className="movies-special-empty__bar">
          <span className="movies-special-empty__knob" />
        </span>
      </div>
      <p className="movies-special-empty__label">{t("specialUpdating")}</p>
    </div>
  );
}

export function CinemaDetailSpecialPanel({ children }: CinemaDetailSpecialPanelProps) {
  if (!children) {
    return <CinemaDetailSpecialEmpty />;
  }
  return <>{children}</>;
}
