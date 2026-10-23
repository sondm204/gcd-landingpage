import type { Metadata } from "next";
import { Red_Rose } from "next/font/google";
import "./globals.css";

const vietnam = Red_Rose({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Red_Rose({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Citizens Day 2026 — Một Dải Di Sản",
  description: "Global Citizens Day 2026 — Vietnam Roots, Global Mind. Hiểu về cội nguồn, vững vàng bản lĩnh, khai mở tư duy toàn cầu và chủ động kiến tạo tương lai qua hội chợ, tranh biện và workshop · talkshow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${vietnam.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
