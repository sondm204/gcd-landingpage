"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BoothAccount from "../booths/components/booth-account";
import { Arrow } from "./ornaments";
import HomeLink from "./home-link";

export default function SiteHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} pathname={pathname} />;
}

function HeaderContent({ pathname }: { pathname: string }) {
  const home = pathname === "/";
  const booths = pathname === "/booths" || pathname.startsWith("/booths/");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => headerRef.current?.classList.toggle("over-hero", home && window.scrollY <= 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);

  return <>
    <header ref={headerRef} className={`site-header${home ? " over-hero" : ""}`} onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); toggleRef.current?.focus(); }
    }}>
      <HomeLink className="brand" aria-label="Global Citizens Day 2026 — Trang đầu" onClick={() => setMenuOpen(false)}>
        <Image src="/keyvisual/logo.png" alt="Logo Global Citizens Day 2026" width={48} height={48} style={{ display: "block", objectFit: "contain", flexShrink: 0 }} />
        <span className="brand-wordmark">GLOBAL CITIZENS DAY<small>THE HERITAGE ODYSSEY · 2026</small></span>
      </HomeLink>
      <nav id="site-navigation" className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Điều hướng chính" onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
      }}>
        <HomeLink className={home ? "active" : undefined} aria-current={home ? "page" : undefined}>Trang chủ</HomeLink>
        <Link href="/booths" className={booths ? "active" : undefined} aria-current={pathname === "/booths" ? "page" : undefined}>Gian hàng</Link>
        {booths && <BoothAccount />}
        {home ? <button className="nav-cta" onClick={() => {
          setMenuOpen(false);
          window.dispatchEvent(new Event("open-heritage-passport"));
        }}>Hẹn một chuyến đi <Arrow /></button> : <Link href="/#loi-hen" className="nav-cta">Hẹn một chuyến đi <Arrow /></Link>}
      </nav>
      <button ref={toggleRef} className="menu-toggle" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
    </header>
    {!home && <div className="site-header-spacer" aria-hidden="true" />}
  </>;
}
