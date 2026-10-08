import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Aegis — the browser that keeps you",
  description:
    "Aegis is a lightweight, privacy-first mobile browser concept with built-in tracker and ad blocking. UI/UX prototype v0.",
  icons: { icon: "/favicon.svg" },
};

/* Lets the Android keyboard shrink the layout instead of covering it, so
   the bottom toolbar and chat inputs stay visible while typing. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full bg-ink-950 text-mist-100">{children}</body>
    </html>
  );
}
