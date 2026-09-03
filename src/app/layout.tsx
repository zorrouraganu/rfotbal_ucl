import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UCL Predictions", template: "%s · UCL Predictions" },
  description: "Predicții 1/X/2 și dublă șansă pentru UEFA Champions League 2026–27.",
  applicationName: "UCL Predictions",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#02040a", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ro" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
