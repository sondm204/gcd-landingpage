"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Arrow } from "./ornaments";

const birds = [
  { x: 0, y: 12, size: 29, delay: "-0.3s" },
  { x: 48, y: -5, size: 22, delay: "-0.8s" },
  { x: 94, y: 26, size: 26, delay: "-1.1s" },
  { x: 140, y: 8, size: 18, delay: "-0.5s" },
  { x: 181, y: 35, size: 20, delay: "-1.4s" },
];

function FlyingBird({ style }: { style: CSSProperties }) {
  return (
    <svg className="flying-bird" style={style} viewBox="0 0 80 50" fill="currentColor">
      <g className="bird-wing bird-wing-left">
        <path d="M41 29C30 20 18 5 2 9C12 12 21 19 28 28L40 32Z" />
      </g>
      <g className="bird-wing bird-wing-right">
        <path d="M39 29C49 16 62 4 78 8C65 12 55 21 48 29L40 32Z" />
      </g>
      <path d="M35 29L43 25L48 28L54 30L46 31L40 37L37 34L32 37Z" />
    </svg>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 600 160" fill="none">
      <path d="M18 117C49 87 94 107 115 83C141 50 182 72 204 56C230 18 292 18 320 48C349 30 388 42 403 67C449 51 482 82 486 96C528 82 569 104 587 120C517 134 457 130 408 137C336 151 278 132 221 139C154 145 72 139 18 117Z" fill="currentColor" />
      <path d="M5 133C94 122 154 131 224 123C300 115 353 137 433 125C494 118 546 127 595 137C449 149 175 157 5 133Z" fill="currentColor" opacity=".45" />
    </svg>
  );
}

function HeritageBoat() {
  return (
    <svg className="heritage-boat" viewBox="0 0 220 190" fill="none">
      <g className="boat-bob">
        <path d="M24 141Q109 164 199 137L181 158Q99 178 42 157Z" fill="#513d2a" stroke="#382e25" strokeWidth="2" />
        <path d="M30 143Q112 157 194 140M43 153Q111 167 182 151" stroke="#c29b60" strokeWidth="2" />
        <path d="M94 139V22M148 145V55" stroke="#4d3b29" strokeWidth="3" />
        <path d="M89 27C72 45 63 76 44 115Q67 121 89 121Z" fill="#a33d2c" stroke="#663626" />
        <path d="M99 24C128 42 131 82 142 118Q118 127 99 124Z" fill="#c26440" stroke="#713e2a" />
        <path d="M153 58C173 75 178 95 189 124L153 129Z" fill="#ab4c32" stroke="#713e2a" />
        <path d="M81 40L89 43M68 60L89 64M60 80L89 85M50 102L89 106M99 43L118 47M99 64L128 69M99 86L134 91M99 107L139 111M153 80L170 84M153 100L179 105M153 119L185 121" stroke="#e2b378" strokeWidth="1.3" opacity=".8" />
        <path d="M95 24L39 140M96 38L184 144M148 59L202 139" stroke="#8e7650" strokeWidth=".8" />
        <path d="M83 145V133H126V148" fill="#86613b" stroke="#4e3b28" />
        <path d="M76 134L89 125H120L133 137Z" fill="#594934" />
        <path d="M87 135H93V143H87ZM100 136H106V145H100ZM113 137H119V146H113Z" fill="#e0c595" />
        <path d="M169 143V132M166 132Q169 125 173 132" stroke="#43372a" strokeWidth="2" />
      </g>
      <g className="boat-wake" stroke="#e5e5c6" strokeLinecap="round">
        <path d="M10 166Q94 180 201 163" opacity=".65" />
        <path d="M34 178Q105 187 170 177" opacity=".35" />
        <path d="M0 157L23 160M194 153L219 150" opacity=".45" />
      </g>
    </svg>
  );
}

function CloudIntro() {
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Also remove the decorative layer if animation events are interrupted.
    const timeout = window.setTimeout(() => setFinished(true), 4500);
    return () => window.clearTimeout(timeout);
  }, []);

  if (finished) return null;

  return (
    <div className="cloud-intro" aria-hidden="true" onAnimationEnd={(event) => {
      if (event.target === event.currentTarget) setFinished(true);
    }}>
      <div className="intro-mist" />
      {["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"].map((position, index) => (
        <div className={`intro-cloud-bank bank-${position}`} key={position}>
          <Image
            src="/images/intro-cloud.webp"
            alt=""
            fill
            sizes="(max-width: 600px) 160vw, 90vw"
            preload={index === 0}
            loading={index === 0 ? undefined : "eager"}
          />
        </div>
      ))}
    </div>
  );
}

export default function HeroSection({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let inView = true;
    const update = () => {
      if (rootRef.current) {
        rootRef.current.dataset.running = String(inView && !document.hidden && !paused && !reducedMotion);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [paused, reducedMotion]);

  return (
    <>
    <CloudIntro />
    <section ref={rootRef} className="hero hero-immersive" id="khoi-hanh" aria-labelledby="hero-title" data-running="true">
      <div className="hero-art">
        <Image
          src="/images/heritage-panorama2.png"
          alt="Toàn cảnh nghệ thuật di sản Việt Nam: núi đá vôi, Tháp Rùa và kiến trúc Huế bên dòng sông xanh"
          fill
          preload
          sizes="(max-aspect-ratio: 16/9) 190vh, 100vw"
        />
      </div>
      <div className="hero-atmosphere" aria-hidden="true">
        <Cloud className="hero-cloud cloud-one" />
        <Cloud className="hero-cloud cloud-two" />
        <Cloud className="hero-cloud cloud-three" />
        <div className="bird-flock flock-near">
          {birds.map((bird, i) => <FlyingBird key={i} style={{ left: bird.x, top: bird.y, width: bird.size, "--wing-delay": bird.delay } as CSSProperties} />)}
        </div>
        <div className="bird-flock flock-far">
          {birds.slice(0, 3).map((bird, i) => <FlyingBird key={i} style={{ left: bird.x, top: bird.y, width: bird.size * .68, "--wing-delay": bird.delay } as CSSProperties} />)}
        </div>
        <div className="boat-course"><HeritageBoat /></div>
        <div className="river-shimmer shimmer-one" />
        <div className="river-shimmer shimmer-two" />
      </div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-topline"><span>MỘT HÀNH TRÌNH VỀ NGUỒN CỘI</span><span>VĂN HOÁ VIỆT · TINH THẦN TRẺ</span></div>
      <div className="hero-copy">
        <div className="eyebrow hero-enter"><span className="little-star">✳</span> VIETNAM ROOTS, GLOBAL MINDS <span className="little-star">✳</span></div>
        <h1 id="hero-title" className="hero-enter"><span>Việt Nam,</span><span>một dải <em>di sản.</em></span></h1>
        <p className="hero-enter">Từ những điều xưa cũ, mở ra những kết nối mới.<br />Một hành trình chạm vào hồn Việt.</p>
        <a href="#hanh-trinh" className="button button-red hero-enter">Bước vào hành trình <Arrow /></a>
        <div className="hero-caption hero-enter"><span className="tiny-line" /> HIỂU CỘI NGUỒN · VƯƠN THẾ GIỚI <span className="tiny-line" /></div>
      </div>
      <div className="hero-bottom">
        <a href="#hanh-trinh"><span className="scroll-pill">↓</span> CUỘN ĐỂ KHÁM PHÁ</a>
        <span className="hero-stops">03 ĐIỂM DỪNG <i /> 01 TINH THẦN VIỆT</span>
        <button
          className="hero-motion-toggle"
          aria-label={paused || reducedMotion ? "Bật chuyển động khung cảnh" : "Tạm dừng chuyển động khung cảnh"}
          aria-pressed={paused || reducedMotion}
          disabled={reducedMotion}
          onClick={() => setPaused(!paused)}
        >
          <span aria-hidden="true">{paused || reducedMotion ? "▷" : "Ⅱ"}</span>
          {reducedMotion ? "CHẾ ĐỘ TĨNH" : paused ? "BẬT CHUYỂN ĐỘNG" : "DỪNG CHUYỂN ĐỘNG"}
        </button>
      </div>
    </section>
    </>
  );
}
