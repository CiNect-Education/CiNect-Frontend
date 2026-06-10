import "./cinect-showtimes.css";

export function ShowtimesSkeleton() {
  return (
    <div className="cinect-showtimes" aria-hidden>
      <div className="container">
        <div className="showtime-filter">
          <div className="showtime-filter-items">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`showtimes-skeleton-filter showtime-filter-item${i === 1 ? " showtime-filter-item--large" : ""}`}
              />
            ))}
          </div>
        </div>
        <div className="movies-showtime row">
          <div className="sec-showtimes-left col">
            <div className="showtimes-skeleton-poster" />
            <div className="showtimes-skeleton-line mt-8 w-3/4" />
            <div className="showtimes-skeleton-line mt-3 w-1/2" />
          </div>
          <div className="sec-showtimes-right col">
            <div className="showtimes-skeleton-line mb-4 w-2/5" />
            <div className="showtimes-skeleton-line mb-6 w-3/5" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="showtimes-skeleton-chip" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
