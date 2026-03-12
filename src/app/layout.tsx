import { Inter, DM_Sans, DM_Serif_Display } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mapleinsight.ca"),
  title: { default: "Maple Insight", template: "%s | Maple Insight" },
  description: "Calm, clean, educational tools and guides for Canada - finance, immigration, and tech.",
  openGraph: {
    title: "Maple Insight",
    description: "Calm, clean, educational tools and guides for Canada - finance, immigration, and tech.",
    url: "https://mapleinsight.ca",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Maple Insight" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maple Insight",
    description: "Calm, clean, educational tools and guides for Canada - finance, immigration, and tech.",
    images: ["/og-default.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png" },
};

const inter = Inter({ subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif", display: "swap" });
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dmSans.variable} ${dmSerif.variable} bg-white text-[color:#495057]`}>
        <GoogleTagManager gtmId={gtmId} />
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
