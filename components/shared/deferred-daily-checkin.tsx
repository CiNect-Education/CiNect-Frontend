"use client";

import dynamic from "next/dynamic";
import { useDeferredMount } from "@/lib/use-deferred-mount";

const DailyCheckinPopup = dynamic(
  () => import("@/components/shared/daily-checkin-popup").then((m) => m.DailyCheckinPopup),
  { ssr: false },
);

export function DeferredDailyCheckin() {
  const ready = useDeferredMount(2500);
  if (!ready) return null;
  return <DailyCheckinPopup />;
}
