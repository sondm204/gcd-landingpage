"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ornaments";
import HeritageLockup from "./heritage-lockup";
import { event } from "@/lib/event";

function CloudIntro() {
  const [finished, setFinished] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setFinished(true), 4500); return () => clearTimeout(timer); }, []);
  if (finished) return null;
  return <div className="cloud-intro" aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setFinished(true); }}>
    <div className="intro-mist" />
    {["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"].map((position, index) => <div className={`intro-cloud-bank bank-${position}`} key={position}><Image src="/images/intro-cloud.webp" alt="" fill sizes="(max-width: 600px) 160vw, 90vw" preload={index === 0} loading={index === 0 ? undefined : "eager"} /></div>)}
  </div>;
}

export default function HeroSection({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let inView = true;
    const update = () => { if (rootRef.current) rootRef.current.dataset.running = String(inView && !document.hidden && !reducedMotion); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", update); update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [reducedMotion]);

  return <>
    <CloudIntro />
    <section ref={rootRef} className="hero hero-immersive" id="khoi-hanh" aria-labelledby="hero-title" data-running="true">
      <div className="hero-art"><Image src="/keyvisual/1.png" alt="Dải lụa di sản Việt Nam màu xanh và vàng nối lên địa cầu trong ánh bình minh" fill preload sizes="100vw" /></div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-atmosphere" aria-hidden="true"><span className="odyssey-glow glow-one" /><span className="odyssey-glow glow-two" /><span className="odyssey-spark spark-one">✦</span><span className="odyssey-spark spark-two">✦</span><span className="odyssey-spark spark-three">✧</span></div>
      <div className="hero-copy">
        <div className="eyebrow hero-enter hero-event-name"><span /> HÀNH TRÌNH CÔNG DÂN TOÀN CẦU <span /></div>
        <h1 id="hero-title" className="hero-enter"><span>GLOBAL</span><span>CITIZENS DAY <em>2026</em></span></h1>
        <HeritageLockup className="hero-enter" />
        <p className="hero-slogan hero-enter"><span>VIETNAM ROOTS</span><i aria-hidden="true">✦</i><span>GLOBAL MINDS</span></p>
        <p className="hero-message hero-enter">Hiểu cội nguồn. Vững bản lĩnh.<br />Khai mở tư duy toàn cầu. Chủ động kiến tạo tương lai.</p>
        <div className="hero-event-details hero-enter">
          <div><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3" /></svg><span><small>HẸN BẠN VÀO</small><strong>{event.date}</strong></span></div>
          <div><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg><span><strong>{event.venue}</strong><small>{event.address}</small></span></div>
        </div>
        <div className="hero-actions hero-enter"><a href="#hanh-trinh" className="button button-red">Bước vào hành trình <Arrow /></a><a href="#lich-trinh" className="hero-schedule-link">Lịch trình sự kiện <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="hero-bottom"><a href="#hanh-trinh"><span className="scroll-pill">↓</span> KHỞI HÀNH TỪ BẢN SẮC · KẾT NỐI VỚI THẾ GIỚI</a></div>
    </section>
  </>;
}
