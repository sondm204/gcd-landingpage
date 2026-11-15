import type { Metadata } from "next";
import SiteHeader from "./components/site-header";
import "./fonts.css";
import "./globals.css";
import "./keyvisual.css";
import { siteUrl, siteTitle, siteDescription } from "@/lib/site-metadata";


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
    >
      <body><SiteHeader />{children}</body>
    </html>
  );
}
