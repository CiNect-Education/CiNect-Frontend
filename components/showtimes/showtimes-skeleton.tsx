import "./cinect-showtimes.css";

export function ShowtimesSkeleton() {
  return (
    <div className="cinect-showtimes" aria-hidden>
      <div className="container">
        <section className="st-filter" aria-hidden>
          <div className="st-filter__progress">
            <span className="st-filter__progress-fill" style={{ width: "33%" }} />
          </div>
          <div className="st-filter__track">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`st-filter__step${i === 1 ? " st-filter__step--wide" : ""}`}
              >
                <div
                  className={`showtimes-skeleton-filter${i === 1 ? " showtimes-skeleton-filter--wide" : ""}`}
                />
              </div>
            ))}
          </div>
        </section>
        <div className="movies-showtime row">
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
      </div>
    </div>
  );
}
