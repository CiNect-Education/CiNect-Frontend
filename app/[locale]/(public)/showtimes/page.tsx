import { Suspense } from "react";
import ShowtimesLoading from "./loading";
import ShowtimesPageClient from "./showtimes-page-client";
import { ClientOnly } from "@/components/system/client-only";

export default function ShowtimesPage() {
  return (
    <Suspense fallback={<ShowtimesLoading />}>
      <ClientOnly fallback={<ShowtimesLoading />}>
        <ShowtimesPageClient />
      </ClientOnly>
    </Suspense>
  );
}
