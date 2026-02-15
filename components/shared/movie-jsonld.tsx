import type { Movie } from "@/types/domain";

export function MovieJsonLd({ movie }: { movie: Movie }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    image: movie.posterUrl,
    datePublished: movie.releaseDate,
    director: { "@type": "Person", name: movie.director },
    genre: movie.genres.map((g) => g.name),
    duration: `PT${movie.duration}M`,
    ...(movie.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: movie.rating,
        ratingCount: movie.ratingCount || 0,
        bestRating: 10,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
