import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/lib/providers";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "GridIron Intel",
  description: "NFL Historical Database — 14,000+ games from 1966–2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
