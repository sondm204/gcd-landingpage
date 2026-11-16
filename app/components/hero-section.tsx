"use client";
import { useCopy, useLocalizedData } from "@/i18n/copy";


import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ornaments";
import { event as eventSource } from "@/lib/event";

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
  const event = useLocalizedData(eventSource);
  const t = useCopy();
  const [introRun, setIntroRun] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const restart = () => setIntroRun((run) => run + 1);
    // Also runs when Next restores a previously visited home page.
    const frame = requestAnimationFrame(() => {
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        restart();
      }
    });
    window.addEventListener("restart-hero-intro", restart);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("restart-hero-intro", restart);
    };
  }, []);
  useEffect(() => {
    let inView = true;
    const update = () => {
      const running = inView && !document.hidden && !reducedMotion;
      if (rootRef.current) rootRef.current.dataset.running = String(running);
      if (running) void videoRef.current?.play().catch(() => { /* Keep the poster if autoplay is unavailable. */ });
      else videoRef.current?.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", update); update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [reducedMotion]);

  return <>
    <CloudIntro key={introRun} />
    <section ref={rootRef} className="hero hero-immersive" id="khoi-hanh" aria-labelledby="hero-title" data-running="true">
      <div className="hero-art" aria-hidden="true"><video ref={videoRef} src="/videos/hero_bg.mp4" poster="/keyvisual/1.png" autoPlay={!reducedMotion} muted loop playsInline preload="metadata" /></div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-atmosphere" aria-hidden="true"><span className="odyssey-glow glow-one" /><span className="odyssey-glow glow-two" /><span className="odyssey-spark spark-one">✦</span><span className="odyssey-spark spark-two">✦</span><span className="odyssey-spark spark-three">✧</span></div>
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-artwork hero-enter">
          <span className="hero-artwork-text">Global Citizens Day 2026. The Heritage Odyssey. Vietnam Roots – Global Minds.</span>
          <Image src="/keyvisual/Hero_text.png" alt="" fill sizes="(max-width: 800px) 90vw, (max-width: 1100px) 77vw, 900px" preload style={{ objectFit: "cover", objectPosition: "center bottom" }} />
        </h1>
        <p className="hero-message hero-enter">{t("Hiểu cội nguồn. Vững bản lĩnh.")}<br />{t("Khai mở tư duy toàn cầu. Chủ động kiến tạo tương lai.")}</p>
        <div className="hero-event-details hero-enter">
          <div><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3" /></svg><span><small>{t("HẸN BẠN VÀO")}</small><strong>{event.date}</strong></span></div>
          <div><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg><span><strong>{event.venue}</strong><small>{event.address}</small></span></div>
        </div>
        <div className="hero-actions hero-enter"><a href="#hanh-trinh" className="button button-red">{t("Bước vào hành trình")} <Arrow /></a><a href="#lich-trinh" className="hero-schedule-link">{t("Lịch trình sự kiện")} <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="hero-bottom"><a href="#hanh-trinh"><span className="scroll-pill">↓</span> {t("KHỞI HÀNH TỪ BẢN SẮC · KẾT NỐI VỚI THẾ GIỚI")}</a></div>
    </section>
  </>;
}
