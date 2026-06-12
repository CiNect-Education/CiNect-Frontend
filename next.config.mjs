import createNextIntlPlugin from "next-intl/plugin";
import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

function withOptionalBundleAnalyzer(config) {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const bundleAnalyzer = require("@next/bundle-analyzer");
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    console.warn("[next.config] @next/bundle-analyzer not installed — run npm install to use analyze");
    return config;
  }
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: https: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "media-src 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "cinestar.com.vn" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/movie", destination: "/movies", permanent: true },
      { source: "/:locale/movie", destination: "/:locale/movies", permanent: true },
    ];
  },
  async rewrites() {
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1").replace(
      /\/api\/v1\/?$/,
      "",
    );
    return [
      {
        source: "/uploads/:path*",
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

export default withOptionalBundleAnalyzer(withNextIntl(nextConfig));
