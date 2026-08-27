import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LocaleHtmlLang } from "../src/i18n/LocaleHtmlLang";

// Self-hosted by next/font at build time, so the PWA keeps working offline.
const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "Neurogaze — triase berbasis pola tatapan",
  description:
    "PWA luring untuk demonstrasi triase skrining dini risiko ASD di layanan Posyandu. Bukan alat diagnosis.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "Neurogaze — triase berbasis pola tatapan",
    description:
      "PWA luring untuk demonstrasi triase skrining dini risiko ASD di layanan Posyandu. Bukan alat diagnosis.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Neurogaze" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neurogaze — triase berbasis pola tatapan",
    description: "PWA luring untuk Posyandu. Bukan alat diagnosis.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d665d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <LocaleHtmlLang />
        {children}
      </body>
    </html>
  );
}
