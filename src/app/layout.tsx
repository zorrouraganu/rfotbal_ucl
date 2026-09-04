import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UCL Predictions", template: "%s · UCL Predictions" },
  description: "Predicții 1/X/2 și dublă șansă pentru UEFA Champions League 2026–27.",
  applicationName: "UCL Predictions",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#02040a", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <head><link rel="preload" href="/assets/stadium-glass-2026.webp" as="image" type="image/webp" fetchPriority="high" /></head>
      <body>{children}</body>
    </html>
  );
}
