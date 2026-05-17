import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "CiNect - Trải nghiệm điện ảnh đỉnh cao",
    template: "%s | CiNect",
  },
  description:
    "Khám phá phim mới nhất, đặt vé trực tuyến và tận hưởng ưu đãi độc quyền tại CiNect.",
  icons: {
    icon: [
      { url: "/favicon.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=5", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=5", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png?v=5", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f4a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1f4a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png?v=5" />
        <link rel="icon" href="/favicon.png?v=5" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-48.png?v=5" type="image/png" sizes="48x48" />
      </head>
      <body className={`${inter.variable} ${beVietnam.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
