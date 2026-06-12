"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { persistSelectedBookingCity, bookingCityLabel } from "@/lib/booking-region";
import { detectBookingCityFromCoords } from "@/lib/detect-booking-region";
import { locateUserPrecise } from "@/lib/user-location";
import { useProvincesLegacy, useProvincesNew } from "@/hooks/queries/use-cinemas";
import { Loader2, LocateFixed } from "lucide-react";

type ButtonProps = React.ComponentProps<typeof Button>;

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

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
  const { data: provincesRes } = useProvincesNew();
  const { data: legacyRes } = useProvincesLegacy();

  const provincesNew = useMemo(
    () => toList<{ code: string; nameVi: string; nameEn: string }>(provincesRes?.data),
    [provincesRes?.data]
  );
  const provincesLegacy = useMemo(
    () =>
      toList<{
        code: string;
        nameVi: string;
        nameEn: string;
        provinceNew: { code: string; nameVi: string; nameEn: string };
      }>(legacyRes?.data),
    [legacyRes?.data]
  );

  const legacyForDetect = useMemo(
    () =>
      provincesLegacy.map((p) => ({
        code: p.code,
        nameVi: p.nameVi,
        nameEn: p.nameEn,
        mergedInto: p.provinceNew.code,
      })),
    [provincesLegacy]
  );

  async function handleClick() {
    setBusy(true);
    try {
      const located = await locateUserPrecise();
      const { cityId } = await detectBookingCityFromCoords(
        located.lat,
        located.lng,
        { locale, provincesNew, provincesLegacy: legacyForDetect }
      );
      if (!cityId) {
        toast.error(t("locationDetectFailed"));
        return;
      }
      persistSelectedBookingCity(cityId);
      onApplied?.(cityId);
      toast.success(
        t("regionDetectedToast", {
          city: bookingCityLabel(cityId, locale, provincesNew, provincesLegacy),
        })
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
