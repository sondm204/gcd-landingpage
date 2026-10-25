import type { Metadata } from "next";
import Link from "next/link";
import BoothAccount from "./components/booth-account";
import "./booths.css";

export const metadata: Metadata = {
  title: "Gian hàng — Global Citizens Day 2026",
  description: "Chọn vị trí gian hàng và gửi đề xuất tham gia Global Citizens Day 2026. Vị trí được xác nhận sau khi ban tổ chức phê duyệt.",
};
export default function BoothsLayout({ children }: { children: React.ReactNode }) {
  return <div className="booths-app">
    <header className="booths-header"><Link href="/" className="booths-brand"><span>GCD<span>26</span></span><div>GLOBAL CITIZENS DAY<small>VIETNAM ROOTS, GLOBAL MIND</small></div></Link><nav aria-label="Điều hướng gian hàng"><Link href="/">Trang sự kiện ↗</Link><Link href="/booths">Sơ đồ gian hàng</Link><BoothAccount /></nav></header>
    {children}
    <footer className="booths-footer"><span>GLOBAL CITIZENS DAY 2026</span><span>Kết nối thương hiệu · Lan toả giá trị Việt</span><Link href="/">Về trang sự kiện ↗</Link></footer>
  </div>;
}
