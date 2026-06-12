"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clapperboard, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatShowtimesDateOption } from "@/lib/showtimes-page-utils";
import { cn } from "@/lib/utils";

const AUTO_OPEN_DELAY_MS = 160;
const ALL = "__ALL__";

function stepLabelText(heading: string) {
  return heading.replace(/^\d+\.\s*/, "");
}

type ShowtimesFilterBarProps = {
  date: string;
  movieId: string;
  cinemaId: string;
  dateOptions: { iso: string; date: Date }[];
  movieOptions: { id: string; title: string }[];
  cinemaOptions: { id: string; name: string }[];
  moviesLoading?: boolean;
  onDateChange: (iso: string) => void;
  onMovieChange: (id: string) => void;
  onCinemaChange: (id: string) => void;
};

export function ShowtimesFilterBar({
  date,
  movieId,
  cinemaId,
  dateOptions,
  movieOptions,
  cinemaOptions,
  moviesLoading,
  onDateChange,
  onMovieChange,
  onCinemaChange,
}: ShowtimesFilterBarProps) {
  const t = useTranslations("showtimes");
  const tHome = useTranslations("home");
  const locale = useLocale();

  const [openStep, setOpenStep] = useState<number | null>(null);
  const pendingAutoOpen = useRef<number | null>(null);
  const autoOpenTimer = useRef<number | null>(null);

  const clearAutoOpenTimer = useCallback(() => {
    if (autoOpenTimer.current !== null) {
      window.clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = null;
    }
  }, []);

  const openStepDropdown = useCallback(
    (step: number, delay = AUTO_OPEN_DELAY_MS) => {
      clearAutoOpenTimer();
      setOpenStep(null);
      autoOpenTimer.current = window.setTimeout(() => {
        setOpenStep(step);
        autoOpenTimer.current = null;
      }, delay);
    },
    [clearAutoOpenTimer],
  );

  const queueAutoOpen = useCallback((step: number) => {
    pendingAutoOpen.current = step;
    setOpenStep(null);
  }, []);

  useEffect(() => () => clearAutoOpenTimer(), [clearAutoOpenTimer]);

  useEffect(() => {
    const step = pendingAutoOpen.current;
    if (step === null) return;
    if (step === 1 && moviesLoading) return;
    if (step === 1 && movieOptions.length === 0) {
      pendingAutoOpen.current = null;
      return;
    }
    pendingAutoOpen.current = null;
    openStepDropdown(step);
  }, [moviesLoading, movieOptions.length, openStepDropdown]);

  function handleDateChange(value: string) {
    onDateChange(value);
    queueAutoOpen(1);
  }

  function handleMovieChange(value: string) {
    onMovieChange(value === ALL ? "" : value);
    if (value !== ALL) openStepDropdown(2);
  }

  function handleCinemaChange(value: string) {
    onCinemaChange(value === ALL ? "" : value);
    setOpenStep(null);
    clearAutoOpenTimer();
  }

  const steps = [
    {
      key: "date",
      heading: t("filterStepDate"),
      icon: Calendar,
      large: false,
      value: date,
      done: !!date,
      disabled: false,
      placeholder: t("selectDate"),
      options: dateOptions.map(({ iso, date: d }) => ({
        value: iso,
        label: formatShowtimesDateOption(d, locale, tHome("today"), tHome("tomorrow")),
      })),
      onChange: handleDateChange,
    },
    {
      key: "movie",
      heading: t("filterStepMovie"),
      icon: Clapperboard,
      large: true,
      value: movieId || ALL,
      done: !!movieId,
      disabled: !date,
      placeholder: t("selectMovie"),
      options: [
        { value: ALL, label: t("selectMovie") },
        ...movieOptions.map((m) => ({ value: m.id, label: m.title })),
      ],
      onChange: handleMovieChange,
    },
    {
      key: "cinema",
      heading: t("filterStepCinema"),
      icon: MapPin,
      large: false,
      value: cinemaId || ALL,
      done: !!cinemaId,
      disabled: !date,
      placeholder: t("selectCinema"),
      options: [
        { value: ALL, label: t("selectCinema") },
        ...cinemaOptions.map((c) => ({ value: c.id, label: c.name })),
      ],
      onChange: handleCinemaChange,
    },
  ] as const;

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <section className="st-filter" aria-label={t("title")}>
      <div className="st-filter__ambient" aria-hidden />
      <div className="st-filter__progress" aria-hidden>
        <span
          className="st-filter__progress-fill"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="st-filter__track">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const canOpen = !step.disabled && !(index === 1 && moviesLoading);
          const isActive = openStep === index;

          return (
            <div
              key={step.key}
              className={cn(
                "st-filter__step",
                step.large && "st-filter__step--wide",
                step.done && "st-filter__step--done",
                isActive && "st-filter__step--active",
                step.disabled && "st-filter__step--disabled",
              )}
            >
              <div className="st-filter__card">
                <div className="st-filter__card-shine" aria-hidden />
                <div className="st-filter__head">
                  <span className="st-filter__badge">{index + 1}</span>
                  <span className="st-filter__label">{stepLabelText(step.heading)}</span>
                  <span className="st-filter__icon" aria-hidden>
                    <Icon />
                  </span>
                </div>

                <div className="st-filter__control">
                  <Select
                    value={step.value}
                    open={canOpen && isActive}
                    onValueChange={step.onChange}
                    disabled={step.disabled}
                    onOpenChange={(open) => {
                      if (open) {
                        clearAutoOpenTimer();
                        pendingAutoOpen.current = null;
                        setOpenStep(index);
                        return;
                      }
                      if (openStep === index) setOpenStep(null);
                    }}
                  >
                    <SelectTrigger className="st-filter__trigger shadow-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder={step.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="cinect-dropdown-panel cinect-dropdown-scroll max-h-72">
                      {step.options.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="cinect-dropdown-item"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "st-filter__connector",
                    step.done && "st-filter__connector--lit",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
