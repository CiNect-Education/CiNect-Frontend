"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { persistSelectedBookingCity, bookingCityLabel } from "@/lib/booking-region";
import {
  detectBookingCityFromCoords,
  getCurrentPositionCoords,
} from "@/lib/detect-booking-region";
import { Loader2, LocateFixed } from "lucide-react";

type ButtonProps = React.ComponentProps<typeof Button>;

export interface DetectRegionButtonProps {
  /** After city is saved; use to sync URL or local React state */
  onApplied?: (cityId: string) => void;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Show text label beside icon (on small screens hidden unless `labelAlwaysVisible`) */
  showLabel?: boolean;
  /** Always show label (e.g. full-width control in settings on mobile) */
  labelAlwaysVisible?: boolean;
}

export function DetectRegionButton({
  onApplied,
  className,
  size = "sm",
  variant = "outline",
  showLabel = true,
  labelAlwaysVisible = false,
}: DetectRegionButtonProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const pos = await getCurrentPositionCoords();
      const { cityId } = await detectBookingCityFromCoords(
        pos.coords.latitude,
        pos.coords.longitude,
        { locale }
      );
      if (!cityId) {
        toast.error(t("locationDetectFailed"));
        return;
      }
      persistSelectedBookingCity(cityId);
      onApplied?.(cityId);
      toast.success(
        t("regionDetectedToast", { city: bookingCityLabel(cityId, locale) })
      );
    } catch (e: unknown) {
      const geo = e as GeolocationPositionError;
      if (geo?.code === 1) {
        toast.error(t("locationPermissionDenied"));
        return;
      }
      if (geo?.code === 2) {
        toast.error(t("locationUnavailable"));
        return;
      }
      if (geo?.code === 3) {
        toast.error(t("locationTimeout"));
        return;
      }
      const err = e as Error;
      if (err?.message === "GEO_UNSUPPORTED") {
        toast.error(t("locationUnsupported"));
        return;
      }
      toast.error(t("locationDetectFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-1.5", className)}
      disabled={busy}
      onClick={() => void handleClick()}
      title={t("useMyLocation")}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <LocateFixed className="h-4 w-4 shrink-0" />
      )}
      {showLabel && (
        <span className={labelAlwaysVisible ? "" : "hidden sm:inline"}>
          {t("useMyLocation")}
        </span>
      )}
    </Button>
  );
}
