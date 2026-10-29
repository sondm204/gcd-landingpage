import type { Metadata } from "next";
import Link from "next/link";
import BoothAccount from "./components/booth-account";
import "./booths.css";
import "./booths-keyvisual.css";

export const metadata: Metadata = {
  title: "Gian hàng — Global Citizens Day 2026",
  description: "Chọn vị trí gian hàng và gửi đề xuất tham gia Global Citizens Day 2026. Vị trí được xác nhận sau khi ban tổ chức phê duyệt.",
  alternates: { canonical: "/booths" },
  openGraph: {
    type: "website", locale: "vi_VN", siteName: "Global Citizens Day 2026", url: "/booths",
    title: "Gian hàng — Global Citizens Day 2026",
    images: [{ url: "/opengraph-image?v=heritage-odyssey", width: 1200, height: 630, alt: "Global Citizens Day 2026 — The Heritage Odyssey" }],
    description: "Chọn vị trí gian hàng, mang câu chuyện thương hiệu đến Global Citizens Day 2026. Gửi đề xuất và kết nối cùng cộng đồng.",
  },
  twitter: {
    card: "summary_large_image", title: "Gian hàng — Global Citizens Day 2026",
    images: ["/twitter-image?v=heritage-odyssey"],
    description: "Chọn vị trí gian hàng, mang câu chuyện thương hiệu đến Global Citizens Day 2026.",
  },
};
export default function BoothsLayout({ children }: { children: React.ReactNode }) {
  return <div className="booths-app">
    <header className="booths-header"><Link href="/" className="booths-brand"><span>GCD<span>26</span></span><div>GLOBAL CITIZENS DAY<small>VIETNAM ROOTS, GLOBAL MINDS</small></div></Link><nav aria-label="Điều hướng gian hàng"><Link href="/">Trang sự kiện ↗</Link><Link href="/booths">Sơ đồ gian hàng</Link><BoothAccount /></nav></header>
    {children}
    <footer className="booths-footer"><span>GLOBAL CITIZENS DAY 2026</span><span>Kết nối thương hiệu · Lan toả giá trị Việt</span><Link href="/">Về trang sự kiện ↗</Link></footer>
  </div>;
}
