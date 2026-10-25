"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, Lantern, Lotus, Sun } from "./ornaments";
import HeroSection from "./hero-section";
import SponsorsSection from "./sponsors-section";
import GlobalMindSection from "./global-mind-section";
import { programs } from "./journey-programs";

// Thêm các trang đã có vào danh sách này để mở rộng điều hướng chính.
const pageLinks = [
  { href: "/booths", label: "Gian hàng" },
];

const HeritageViewer = dynamic(() => import("./heritage-viewer"), {
  ssr: false,
  loading: () => <div className="scene-loading"><Sun /><span>Đang mở một miền di sản…</span></div>,
});



export default function HeritageJourney() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("khoi-hanh");
  const [modal, setModal] = useState<number | "passport" | null>(null);
  const [selected, setSelected] = useState<string[]>(programs.map((p) => p.id));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const modalOpen = modal !== null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        const onRevealEnd = (event: Event) => {
          const transition = event as TransitionEvent;
          if (transition.target === entry.target && transition.propertyName === "transform") {
            entry.target.classList.remove("reveal-pending");
            entry.target.removeEventListener("transitionend", onRevealEnd);
          }
        };
        entry.target.addEventListener("transitionend", onRevealEnd);
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (!media.matches) {
        el.style.setProperty("--float-delay", `${Math.min(Number(el.dataset.revealDelay || 0), 300)}ms`);
        el.classList.add("reveal-pending");
      }
      reveal.observe(el);
    });
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    const sceneObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSceneVisible(true);
        sceneObserver.disconnect();
      }
    }, { rootMargin: "250px" });
    if (sceneRef.current) sceneObserver.observe(sceneRef.current);
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty("--journey-progress", `${max > 0 ? window.scrollY / max : 0}`);
        headerRef.current?.classList.toggle("over-hero", window.scrollY < 60);
        if (!media.matches) document.documentElement.style.setProperty("--hero-shift", `${Math.min(window.scrollY * 0.12, 95)}px`);
        const marker = Math.min(window.innerHeight * 0.35, 260);
        let currentSection = sections[0]?.id || "khoi-hanh";
        for (const section of sections) {
          if (section.getBoundingClientRect().top > marker) break;
          currentSection = section.id;
        }
        if (max > 0 && window.scrollY >= max - 4) currentSection = sections.at(-1)?.id || currentSection;
        setActive(currentSection);
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    try {
      const stored = JSON.parse(localStorage.getItem("heritage-passport") || "null");
      if (Array.isArray(stored) && stored.length && stored.every((id) => programs.some((p) => p.id === id))) {
        setSelected(stored); setSaved(true);
      }
    } catch { /* Storage is optional; the itinerary can still be downloaded. */ }
    return () => {
      media.removeEventListener("change", update);
      reveal.disconnect(); sceneObserver.disconnect();
      window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--hero-shift");
      document.documentElement.style.removeProperty("--journey-progress");
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (modalOpen) {
      if (!dialog?.open) lastFocus.current = document.activeElement as HTMLElement;
      dialog?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
        dialog?.close();
        lastFocus.current?.focus();
      };
    }
  }, [modalOpen]);

  function savePassport() {
    try {
      localStorage.setItem("heritage-passport", JSON.stringify(selected));
      setSaved(true); setSaveError(false);
    } catch { setSaveError(true); }
  }

  function downloadPassport() {
    const text = `MỘT DẢI DI SẢN\nVietnam Roots, Global Mind\n\nHÀNH TRÌNH CỦA TÔI\n${programs.filter((p) => selected.includes(p.id)).map((p) => `\n${p.number}. ${p.type}\n${p.short}\n${p.description}\n`).join("")}\nNgày, địa điểm và lịch chi tiết: sẽ được công bố.\nĐây là bản lưu lịch trình cá nhân, không phải vé tham dự hay xác nhận đăng ký.`;
    const url = URL.createObjectURL(new Blob(["\ufeff", text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "hanh-trinh-di-san.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const closeModal = () => setModal(null);

  return (
    <>
      <a href="#hanh-trinh" className="skip-link">
        Bỏ qua phần mở đầu
      </a>
      <div className="reading-progress" aria-hidden="true" />
      <header ref={headerRef} className="site-header over-hero">
        <a
          href="#khoi-hanh"
          className="brand"
          aria-label="Một Dải Di Sản — Trang đầu"
        >
          <span className="brand-seal">
            di
            <br />
            sản<span>✳</span>
          </span>
          <span className="brand-wordmark">
            MỘT DẢI DI SẢN<small>VIETNAM ROOTS, GLOBAL MIND</small>
          </span>
        </a>
        <nav
          className={menuOpen ? "main-nav open" : "main-nav"}
          aria-label="Điều hướng chính"
        >
          {pageLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button
            className="nav-cta"
            onClick={() => {
              setModal("passport");
              setMenuOpen(false);
            }}
          >
            Hẹn một chuyến đi <Arrow />
          </button>
        </nav>
        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>
      <main>
        <HeroSection reducedMotion={reducedMotion} />
        <div
          className="program-logos section-pad"
          aria-label="Các đơn vị chương trình"
        >
          <Image
            src="/images/logo_VN.png"
            alt="Logo Việt Nam"
            width={180}
            height={110}
          />
          <Image
            src="/images/logo_danhnhan.png"
            alt="Logo Danh Nhân"
            width={180}
            height={110}
          />
          <Image
            src="/images/logo_ThangLong.png"
            alt="Logo Thăng Long"
            width={180}
            height={110}
          />
        </div>
        <div className="ticker" aria-hidden="true">
          <div>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i}>
                TỪ CỘI NGUỒN <b>✳</b> ĐẾN THẾ GIỚI <b>✳</b> VIETNAM ROOTS,
                GLOBAL MIND <b>✳</b>
              </span>
            ))}
          </div>
        </div>
        <section className="introduction section-pad" id="hanh-trinh">
          <div className="intro-side" data-reveal>
            <span className="eyebrow">TỪ GỐC RỄ VIỆT ĐẾN TƯ DUY TOÀN CẦU</span>
            <Sun />
            <span className="vertical-note">MỖI BƯỚC ĐI, MỘT KẾT NỐI</span>
          </div>
          <div className="intro-copy">
            <h2 data-reveal>
              Hiểu mình đến từ đâu.
              <br />
              Tự tin <em>bước cùng thế giới.</em>
            </h2>
            <div className="intro-columns">
              <p data-reveal data-reveal-delay="90">
                Global Citizens Day 2026 mở ra hành trình để người trẻ hiểu giá trị Việt, rèn bản lĩnh và học cách kết nối trong một thế giới đa văn hoá.
              </p>
              <p data-reveal data-reveal-delay="180">
                Từ trải nghiệm văn hoá đến tranh biện và sáng tạo, mỗi điểm dừng là một cơ hội để hỏi sâu hơn, nhìn rộng hơn và chủ động chọn bước đi của mình.
              </p>
            </div>
          </div>
          <a
            href="#hoi-cho"
            className="intro-next"
            aria-label="Đến trạm đầu tiên"
          >
            ↓
          </a>
        </section>
        <GlobalMindSection />
        <div className="journey-heading section-pad">
          <span className="eyebrow" data-reveal>
            TRẢI NGHIỆM ĐỂ TRƯỞNG THÀNH
          </span>
          <h2 data-reveal data-reveal-delay="70">
            Ba điểm dừng.
            <br />
            <em>Mở rộng một tầm nhìn.</em>
          </h2>
          <span className="handwritten" data-reveal data-reveal-delay="150">
            Đi cùng chúng mình nhé! ↴
          </span>
        </div>
        <div className="journey-stations">
          <svg
            className="journey-route"
            viewBox="0 0 1200 1900"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              className="route-base"
              d="M600 0C600 130 80 100 80 360S1120 380 1120 700S80 1000 80 1290S600 1520 600 1900"
            />
            <path
              className="route-dashes"
              d="M600 0C600 130 80 100 80 360S1120 380 1120 700S80 1000 80 1290S600 1520 600 1900"
            />
          </svg>
          {programs.map((program, index) => (
            <section
              className={`station station-${index + 1} section-pad`}
              id={program.id}
              key={program.id}
              aria-labelledby={`title-${program.id}`}
            >
              <div className="station-art" data-reveal>
                {index === 0 ? (
                  <MarketArt />
                ) : index === 1 ? (
                  <DebateArt />
                ) : (
                  <WorkshopArt />
                )}
                <span className="art-footnote">
                  TRẠM {program.number} / {program.short}
                </span>
              </div>
              <div className="station-copy">
                <div className="station-kicker" data-reveal>
                  <span className="station-number">{program.number}</span>
                  <span className="eyebrow">{program.type}</span>
                </div>
                <h2
                  id={`title-${program.id}`}
                  data-reveal
                  data-reveal-delay="70"
                >
                  {program.title.split("\n")[0]}
                  <br />
                  <em>{program.title.split("\n")[1]}</em>
                </h2>
                <p data-reveal data-reveal-delay="130">
                  {program.description}
                </p>
                <div className="tags" data-reveal data-reveal-delay="190">
                  {program.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <button
                  className="text-link"
                  data-reveal
                  data-reveal-delay="240"
                  onClick={() => setModal(index)}
                >
                  Khám phá điểm dừng <Arrow />
                </button>
                {index === 0 && <Link href="/booths" className="text-link" style={{ display: "flex", width: "fit-content", marginTop: 18 }} data-reveal data-reveal-delay="280">Đề xuất vị trí gian hàng <Arrow /></Link>}
              </div>
            </section>
          ))}
        </div>
        <section
          className="heritage-section section-pad"
          id="khong-gian"
          aria-labelledby="heritage-title"
        >
          <div className="heritage-copy">
            <span className="eyebrow" data-reveal>
              <span className="live-dot" /> KHÔNG GIAN DI SẢN 3D
            </span>
            <h2 id="heritage-title" data-reveal data-reveal-delay="80">
              Một góc nhìn mới.
              <br />
              <em>
                Một niềm tự hào
                <br /> rất cũ.
              </em>
            </h2>
            <p data-reveal data-reveal-delay="150">
              Đi vòng quanh một mái đình.
              <br />
              Ngắm di sản từ một góc khác.
              <br />
              Để những điều quen thuộc lại khiến bạn ngỡ ngàng.
            </p>
            <div className="heritage-note" data-reveal data-reveal-delay="220">
              <Sun />
              <span>
                Chạm, kéo và khám phá.
                <br />
                <small>
                  Mô hình nghệ thuật lấy cảm hứng từ kiến trúc Việt.
                </small>
              </span>
            </div>
          </div>
          <div
            className="heritage-stage"
            ref={sceneRef}
            data-reveal
            data-reveal-delay="120"
          >
            {sceneVisible ? (
              <HeritageViewer reducedMotion={reducedMotion} />
            ) : (
              <div className="scene-loading">
                <Sun />
                <span>Một góc Việt Nam đang chờ bạn.</span>
              </div>
            )}
          </div>
        </section>
        <SponsorsSection />
        <section className="invitation section-pad" id="loi-hen">
          <Lantern className="invite-lantern left" />
          <Lantern className="invite-lantern right" />
          <div>
            <span className="eyebrow" data-reveal>
              TƯƠNG LAI BẮT ĐẦU TỪ BƯỚC ĐI CỦA BẠN
            </span>
            <h2 data-reveal data-reveal-delay="70">
              Mang theo bản sắc.
              <br />
              <em>Bước tới một thế giới rộng hơn.</em>
            </h2>
            <p data-reveal data-reveal-delay="130">
              Một góc nhìn mới, một kết nối mới, một việc bạn muốn bắt đầu — bạn sẽ mang điều gì từ hôm nay vào tương lai?
            </p>
            <button
              className="button button-red"
              data-reveal
              data-reveal-delay="200"
              onClick={() => setModal("passport")}
            >
              Bắt đầu hành trình của bạn <Arrow />
            </button>
            <div className="event-status" data-reveal data-reveal-delay="260">
              <span className="live-dot" /> Ngày & địa điểm tổ chức sẽ sớm được
              công bố
            </div>
          </div>
          <div className="invitation-bottom" data-reveal>
            <span>GỐC RỄ VIỆT NAM.</span>
            <Lotus />
            <span>TƯ DUY TOÀN CẦU.</span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-event" data-reveal>
          <div className="footer-event-copy">
            <span className="eyebrow">GLOBAL CITIZENS DAY 2026</span>
            <p>Vietnam Roots, Global Mind</p>
          </div>
          <div className="footer-logos" aria-label="Các đơn vị chương trình">
            <Image src="/images/logo_VN.png" alt="Logo Việt Nam" width={180} height={110} />
            <Image src="/images/logo_danhnhan.png" alt="Logo Danh Nhân" width={180} height={110} />
            <Image src="/images/logo_ThangLong.png" alt="Logo Thăng Long" width={180} height={110} />
          </div>
        </div>
        <a href="#khoi-hanh" className="footer-brand" data-reveal>
          Một dải <em>di sản.</em>
        </a>
        <span data-reveal data-reveal-delay="80">
          Hiểu mình đến từ đâu.
          <br />
          Biết mình có thể đi xa đến đâu.
        </span>
        <a
          href="#khoi-hanh"
          className="back-top"
          data-reveal
          data-reveal-delay="150"
        >
          Về đầu hành trình ↑
        </a>
        <div className="footer-bottom" data-reveal data-reveal-delay="200">
          <span>VIETNAM ROOTS, GLOBAL MIND</span>
          <span>Một hành trình kết nối văn hoá & thế hệ.</span>
          <span>ĐƯỢC KỂ BẰNG NIỀM TỰ HÀO VIỆT</span>
        </div>
      </footer>
      <nav className="journey-dots" aria-label="Các điểm dừng">
        {[
          ["khoi-hanh", "Khởi hành"],
          ["hoi-cho", "Hội chợ"],
          ["tranh-bien", "Tranh biện"],
          ["doi-thoai", "Workshop"],
          ["khong-gian", "Di sản 3D"],
          ["nha-tai-tro", "Nhà tài trợ"],
          ["loi-hen", "Đăng ký"],
        ].map(([id, label]) => (
          <a
            href={`#${id}`}
            key={id}
            aria-label={label}
            aria-current={active === id ? "location" : undefined}
            className={active === id ? "current" : ""}
            onClick={() => setActive(id)}
          >
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <dialog
        ref={dialogRef}
        className="experience-dialog"
        onCancel={closeModal}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-inner">
          <button
            className="dialog-close"
            onClick={closeModal}
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
          {modal === "passport" ? (
            <>
              <span className="eyebrow">HÀNH TRÌNH CÔNG DÂN TOÀN CẦU CỦA BẠN</span>
              <h2 id="dialog-title">
                Hẹn một <em>chuyến đi.</em>
              </h2>
              <p>
                Chọn những điểm dừng bạn yêu thích để lưu hành trình của riêng
                mình.
              </p>
              <div className="passport-options">
                {programs.map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => {
                        setSelected((prev) =>
                          prev.includes(p.id)
                            ? prev.filter((id) => id !== p.id)
                            : [...prev, p.id],
                        );
                        setSaved(false);
                        setSaveError(false);
                      }}
                    />
                    <span className="passport-number">{p.number}</span>
                    <span>
                      <strong>{p.type}</strong>
                      <small>{p.short}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="dialog-notice">
                Sự kiện đang được chuẩn bị. Lưu hành trình là một lời hẹn cá
                nhân, chưa phải đăng ký tham dự. Ngày, địa điểm và hình thức
                đăng ký sẽ được công bố sau.
              </div>
              <div className="dialog-actions">
                <button
                  className="button button-red"
                  disabled={!selected.length}
                  onClick={savePassport}
                >
                  {saved ? "Đã lưu trên thiết bị ✓" : "Lưu hành trình"}
                  <Arrow />
                </button>
                <button
                  className="text-link"
                  disabled={!selected.length}
                  onClick={downloadPassport}
                >
                  Tải bản lưu ↓
                </button>
              </div>
              <p className="save-status" role="status">
                {saveError
                  ? "Trình duyệt chưa cho phép lưu. Bạn có thể tải bản lưu về thiết bị."
                  : saved
                    ? "Hành trình đã được lưu trong trình duyệt này."
                    : !selected.length
                      ? "Hãy chọn ít nhất một điểm dừng."
                      : ""}
              </p>
            </>
          ) : typeof modal === "number" ? (
            <>
              <span className="eyebrow">
                TRẠM {programs[modal].number} / {programs[modal].type}
              </span>
              <h2 id="dialog-title">{programs[modal].short}</h2>
              <p>{programs[modal].detail}</p>
              <ul className="activity-list">
                {programs[modal].activities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
              <div className="dialog-notice">
                Nội dung dự kiến. Lịch chi tiết và thông tin tham gia sẽ được
                ban tổ chức cập nhật.
              </div>
              <button
                className="button button-red"
                onClick={() => setModal("passport")}
              >
                Lên lịch trình của bạn <Arrow />
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

function MarketArt() {
  return <div className="market-art"><div className="art-disc" /><span className="collage-label">PHIÊN CHỢ<br /><strong>VĂN HOÁ</strong></span><Lantern className="market-lantern one" /><Lantern className="market-lantern two" /><div className="market-house"><div className="house-roof" /><div className="house-sign">chuyện làng nghề</div><div className="house-windows"><i /><i /><i /></div><div className="house-awning" /></div><div className="pot pot-one" /><div className="pot pot-two" /><Lotus className="market-lotus" /><span className="art-sticker">Made of<br /><em>Vietnam.</em></span></div>;
}

function DebateArt() {
  return <div className="debate-art"><div className="debate-circle" /><span className="debate-word word-one">GIỮ GÌN?</span><span className="debate-word word-two">LÀM MỚI!</span><div className="speech-bubble">Di sản sẽ đi về đâu?<span>HÃY ĐỂ THẾ HỆ MÌNH LÊN TIẾNG.</span></div><div className="debate-podium"><Sun /><span>TIẾNG NÓI<br />THẾ HỆ MỚI</span></div><div className="microphone"><i /><span /></div><span className="debate-star">✳</span><span className="debate-small-star">✦</span></div>;
}

function WorkshopArt() {
  return <div className="workshop-art"><div className="workshop-disc" /><div className="workshop-ticket"><span>MỘT CUỘC HẸN VỚI</span><strong>người<br /><em>kể chuyện.</em></strong><div className="ticket-rule" /><small>LẮNG NGHE · SÁNG TẠO · TIẾP NỐI</small><span className="ticket-barcode" /></div><div className="workshop-fan">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 17 - 68}deg)` }} />)}</div><Lotus className="workshop-lotus" /><div className="workshop-seal">CHUYỆN XƯA<br /><span>✳</span><br />KỂ TIẾP</div></div>;
}
