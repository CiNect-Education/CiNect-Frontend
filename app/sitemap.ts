import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cinemaconnect.com";

  const staticPages = [
    "",
    "/movies",
    "/showtimes",
    "/cinemas",
    "/promotions",
    "/membership",
    "/gift",
    "/news",
    "/support",
  ];

  return staticPages.flatMap((page) => [
    {
      url: `${baseUrl}/vi${page}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: page === "" ? 1 : 0.8,
    },
    {
      url: `${baseUrl}/en${page}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: page === "" ? 1 : 0.8,
    },
  ]);
}
