import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AFSF 2026 — Bilateral Meeting Room Booking",
  description: "Book AD7 or AD9 bilateral meeting rooms for the Africa Food Systems Forum 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-stone-800">{children}</body>
    </html>
  );
}
