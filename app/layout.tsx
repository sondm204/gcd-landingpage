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
  description: "Global Citizens Day 2026 — Bước vào con đường di sản Việt Nam. Khám phá hội chợ văn hoá, tranh biện sinh viên và workshop · talkshow kết nối những giá trị xưa với thế hệ hôm nay.",
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
