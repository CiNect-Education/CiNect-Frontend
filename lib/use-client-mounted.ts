"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** True only after hydration — use to gate browser-only render/fetch. */
export function useClientMounted() {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
}
