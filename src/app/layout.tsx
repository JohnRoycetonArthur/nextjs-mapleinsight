import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mapleinsight.ca"),
  title: { default: "Maple Insight", template: "%s | Maple Insight" },
  description: "Calm, clean, educational tools and guides for Canada — finance, immigration, and tech.",
  openGraph: {
    title: "Maple Insight",
    description: "Calm, clean, educational tools and guides for Canada — finance, immigration, and tech.",
    url: "https://mapleinsight.ca",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png" },
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-[color:#495057]`}>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
