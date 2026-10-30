import type { Metadata } from "next";
import SiteHeader from "./components/site-header";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./keyvisual.css";
import { siteUrl, siteTitle, siteDescription } from "@/lib/site-metadata";

const vietnam = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteTitle,
  description: siteDescription,
  applicationName: "Global Citizens Day 2026",
  openGraph: {
    url: "/",
    type: "website",
    locale: "vi_VN",
    siteName: "Global Citizens Day 2026",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${vietnam.variable} ${playfair.variable}`}
    >
      <body><SiteHeader />{children}</body>
    </html>
  );
}
