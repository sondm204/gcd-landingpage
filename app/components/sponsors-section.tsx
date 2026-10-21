"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Lotus } from "./ornaments";

type Sponsor = {
  name: string;
  website: string;
  logo?: string;
  mark: string;
  kind: string;
  demo?: boolean;
};

type SponsorSlide = {
  title: string;
  description: string;
  label: string;
  media: { type: "image" | "video"; src: string; alt?: string };
};

// Các vị trí sau PNJ là dữ liệu minh họa, sẵn sàng thay bằng nhà tài trợ tiếp theo.
const sponsors: Sponsor[] = [
  { name: "PNJ", website: "https://www.pnj.com.vn/", logo: "/images/sponsors/pnj-logo.jpg", mark: "PNJ", kind: "Nhà tài trợ" },
  { name: "Thương hiệu 02", website: "https://example.com", mark: "02", kind: "Vị trí minh họa", demo: true },
  { name: "Thương hiệu 03", website: "https://example.com", mark: "03", kind: "Vị trí minh họa", demo: true },
  { name: "Thương hiệu 04", website: "https://example.com", mark: "04", kind: "Vị trí minh họa", demo: true },
];

// Có thể thêm { type: "video", src: "/sponsors/ten-video.mp4" } vào media.
const slides: SponsorSlide[] = [
  {
    title: "Dấu ấn PNJ trên hành trình.",
    description: "Một khung hình từ PNJ — nơi vẻ đẹp của từng chi tiết được trân trọng.",
    label: "HÌNH ẢNH PNJ",
    media: { type: "image", src: "/images/sponsors/pnj-image.jpg", alt: "Hình ảnh trang sức kim cương do người dùng cung cấp cho PNJ" },
  },
  {
    title: "Một điểm chạm, nhiều kết nối.",
    description: "Hình ảnh, chiến dịch hoặc video từ nhà tài trợ sẽ xuất hiện tại đây.",
    label: "KHUNG TRUYỀN THÔNG / MINH HỌA",
    media: { type: "image", src: "/images/heritage-collage.webp", alt: "Bức tranh ghép về văn hóa Việt Nam dùng làm hình minh họa" },
  },
];

export default function SponsorsSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || !visible || !pageVisible || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [current, paused, visible, pageVisible, reducedMotion]);

  const show = (index: number) => setCurrent((index + slides.length) % slides.length);
  const slide = slides[current];

  return (
    <section ref={sectionRef} id="nha-tai-tro" className="sponsors-section section-pad" aria-labelledby="sponsors-title">
      <div className="sponsors-heading">
        <div data-reveal>
          <span className="eyebrow">NHỮNG NGƯỜI BẠN ĐỒNG HÀNH</span>
          <h2 id="sponsors-title">Di sản được nối dài<br />bởi <em>những bàn tay chung sức.</em></h2>
        </div>
        <p data-reveal data-reveal-delay="110">Mỗi sự đồng hành mở thêm một lối để câu chuyện văn hóa Việt chạm đến nhiều người hơn.</p>
      </div>

      <div className="sponsors-rule" aria-hidden="true"><span>✳</span><span>ĐỒNG HÀNH CÙNG HÀNH TRÌNH</span><span>✳</span></div>

      <div className="sponsor-grid" aria-label="Danh sách nhà tài trợ và vị trí minh họa">
        {sponsors.map((sponsor, index) => (
          <a
            className="sponsor-card"
            key={sponsor.name}
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${sponsor.name} — mở website trong tab mới${sponsor.demo ? " (dữ liệu minh họa)" : ""}`}
            data-reveal
            data-reveal-delay={String(index * 65)}
          >
            <span className="sponsor-card-index">0{index + 1} / 0{sponsors.length}</span>
            <span className="sponsor-logo-wrap">
              {sponsor.logo ? <Image className="sponsor-logo" src={sponsor.logo} alt={`Logo ${sponsor.name}`} width={750} height={500} /> : <span className="sponsor-placeholder-logo" aria-hidden="true"><span>{sponsor.mark}</span><i>✳</i></span>}
            </span>
            <span className="sponsor-card-bottom"><span><strong>{sponsor.name}</strong><small>{sponsor.kind}</small></span><span className="sponsor-card-arrow" aria-hidden="true">↗</span></span>
          </a>
        ))}
      </div>
      <p className="sponsors-demo-note">PNJ dùng logo và hình ảnh được cung cấp. Những vị trí thương hiệu còn lại hiện là dữ liệu minh họa.</p>

      <div className="sponsor-feature" data-reveal onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
        <div className="sponsor-feature-media">
          {slide.media.type === "image" ? (
            <Image key={slide.media.src} src={slide.media.src} alt={slide.media.alt || slide.title} fill sizes="(max-width: 800px) 100vw, 58vw" />
          ) : (
            <video key={slide.media.src} src={slide.media.src} controls muted playsInline preload="metadata" aria-label={slide.title} onPlay={() => setPaused(true)} onEnded={() => setPaused(false)} />
          )}
          <span className="sponsor-media-label">{slide.label}</span>
        </div>
        <div className="sponsor-feature-copy">
          <div><span className="eyebrow">CÂU CHUYỆN ĐỒNG HÀNH</span><Lotus /><h3>{slide.title}</h3><p>{slide.description}</p></div>
          <div className="sponsor-slider-controls">
            <span className="sponsor-slide-count">0{current + 1} <span>/</span> 0{slides.length}</span>
            <div className="sponsor-slider-buttons">
              <button type="button" onClick={() => show(current - 1)} aria-label="Slide trước">←</button>
              <button type="button" onClick={() => show(current + 1)} aria-label="Slide tiếp theo">→</button>
            </div>
          </div>
        </div>
        <div className="sponsor-slider-dots" aria-label="Chọn slide">
          {slides.map((item, index) => <button key={item.title} type="button" className={index === current ? "active" : ""} onClick={() => show(index)} aria-label={`Đến slide ${index + 1}`} aria-current={index === current ? "true" : undefined} />)}
        </div>
      </div>
      <div className="sponsors-tail" aria-hidden="true"><span>DI SẢN ĐƯỢC TIẾP NỐI</span><span>✳</span><span>BỞI CHÚNG TA</span></div>
    </section>
  );
}
