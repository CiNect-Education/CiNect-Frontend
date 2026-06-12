export function ShowtimesResultsSkeleton() {
  return (
    <div className="movies-showtime row" aria-hidden>
      <div className="sec-showtimes-left col">
        <div className="showtimes-skeleton-poster" />
        <div className="showtimes-skeleton-line" style={{ marginTop: "20px", width: "75%" }} />
        <div className="showtimes-skeleton-line" style={{ marginTop: "8px", width: "50%" }} />
      </div>
      <div className="sec-showtimes-right col">
        <div className="showtimes-skeleton-line" style={{ marginBottom: "16px", width: "40%" }} />
        <div className="showtimes-skeleton-line" style={{ marginBottom: "24px", width: "60%" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="showtimes-skeleton-chip" />
          ))}
        </div>
      </div>
    </div>
  );
}
