"use client";

import { cn } from "@/lib/utils";
import type { CinemaDetailTab } from "./cinema-detail-utils";

export type CinemaDetailTabItem = {
  id: CinemaDetailTab;
  label: string;
};

interface CinemaDetailTabsProps {
  tabs: CinemaDetailTabItem[];
  activeTab: CinemaDetailTab;
  onTabChange: (tab: CinemaDetailTab) => void;
  ariaLabel: string;
}

/** Cinestar: .movies-fil.sticky > .movies-fil-slider > .swiper-slide > .movies-fil-btn-mobile */
export function CinemaDetailTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
}: CinemaDetailTabsProps) {
  return (
    <nav className="movies-fil sticky" aria-label={ariaLabel}>
      <div className="movies-fil-slider">
        <div className="movies-fil-track">
          {tabs.map((item) => (
            <div key={item.id} className="movies-fil-slide col">
              <button
                type="button"
                className={cn(
                  "movies-fil-btn-mobile",
                  activeTab === item.id && "active",
                )}
                onClick={() => onTabChange(item.id)}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                <span className="txt">{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
