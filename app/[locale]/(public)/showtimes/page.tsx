import { Suspense } from "react";
import ShowtimesLoading from "./loading";
import ShowtimesPageClient from "./showtimes-page-client";

export default function ShowtimesPage() {
  return (
    <Suspense fallback={<ShowtimesLoading />}>
      <ShowtimesPageClient />
    </Suspense>
  );
}
