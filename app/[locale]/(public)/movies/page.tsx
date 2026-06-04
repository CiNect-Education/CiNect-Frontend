"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClientOnly } from "@/components/system/client-only";
import { MoviesBookingLanding } from "@/components/movies/movies-booking-landing";
import { MoviesCatalogContent } from "./movies-catalog-content";

function MoviesPageRouter() {
  const searchParams = useSearchParams();
  const isCatalog = searchParams.get("view") === "catalog";

  if (isCatalog) {
    return <MoviesCatalogContent />;
  }

  return <MoviesBookingLanding />;
}

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <div className="bg-muted h-96 animate-pulse rounded-lg" />
        </div>
      }
    >
      <ClientOnly
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
            <div className="bg-muted h-96 animate-pulse rounded-lg" />
          </div>
        }
      >
        <MoviesPageRouter />
      </ClientOnly>
    </Suspense>
  );
}
