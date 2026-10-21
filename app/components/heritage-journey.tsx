"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Arrow, Lantern, Lotus, Sun } from "./ornaments";
import HeroSection from "./hero-section";

const HeritageViewer = dynamic(() => import("./heritage-viewer"), {
  ssr: false,
  loading: () => <div className="scene-loading"><Sun /><span>Đang mở một miền di sản…</span></div>,
});

const programs = [
  {
    id: "hoi-cho", number: "01", type: "HỘI CHỢ VĂN HOÁ", title: "Chạm vào\nhồn Việt.", short: "Một phiên chợ, ngàn câu chuyện",
    description: "Đi qua những gian hàng đậm sắc ba miền. Chạm vào chất gốm, thử một nét in Đông Hồ, rồi tìm lại hương vị thân quen trong một món quà quê.",
    tags: ["Làng nghề", "Ẩm thực", "Trải nghiệm"],
    detail: "Một cuộc dạo chơi dành cho tất cả mọi người: khám phá các gian hàng thủ công, nghe câu chuyện phía sau những món đồ và tự tay thử làm một sản phẩm mang dấu ấn của riêng mình.",
    activities: ["Gặp gỡ những câu chuyện làng nghề qua gốm, tranh dân gian và sản phẩm thủ công.", "Khám phá hương vị vùng miền và câu chuyện văn hoá phía sau từng món ăn.", "Ghé góc trải nghiệm, lưu dấu hành trình bằng một món quà tự tay thực hiện."],
  },
  {
    id: "tranh-bien", number: "02", type: "CUỘC THI TRANH BIỆN", title: "Tiếng nói trẻ.\nGiá trị ngàn năm.", short: "Khi di sản bước vào cuộc đối thoại",
    description: "Giữ gìn hay làm mới? Địa phương hay toàn cầu? Sân khấu dành cho những góc nhìn sinh viên, nơi mỗi lập luận mở thêm một cách hiểu về di sản.",
    tags: ["Sinh viên", "Tư duy phản biện", "Đối thoại"],
    detail: "Một không gian tranh biện cho sinh viên cùng đặt câu hỏi về tương lai của văn hoá Việt. Các đội tìm hiểu dữ kiện, xây dựng lập luận và học cách lắng nghe những quan điểm khác biệt.",
    activities: ["Chủ đề gợi mở: bảo tồn di sản trong đời sống hiện đại và vai trò của người trẻ.", "Hình thức đội thi, thể lệ và tiêu chí chấm điểm sẽ được ban tổ chức công bố.", "Khán giả cùng lắng nghe, đặt câu hỏi và tiếp nối cuộc đối thoại."],
  },
  {
    id: "doi-thoai", number: "03", type: "WORKSHOP · TALKSHOW", title: "Gặp người kể.\nViết chuyện tiếp.", short: "Cảm hứng được trao, di sản được nối",
    description: "Ngồi lại bên những câu chuyện làm nghề, gặp gỡ người truyền cảm hứng và tự tay sáng tạo. Để di sản không chỉ được ngắm nhìn, mà được tiếp nối.",
    tags: ["Giao lưu", "Sáng tạo", "Kết nối"],
    detail: "Lắng nghe những người làm văn hoá chia sẻ hành trình của họ, rồi thử biến cảm hứng thành một sáng tạo nhỏ. Không cần kinh nghiệm trước đó, chỉ cần sự tò mò và một tâm thế cởi mở.",
    activities: ["Talkshow về cách kể câu chuyện văn hoá Việt bằng ngôn ngữ của hôm nay.", "Workshop sáng tạo lấy cảm hứng từ chất liệu và hoạ tiết truyền thống.", "Khách mời đề xuất: nghệ sĩ Xuân Bắc. Sự tham gia chưa được xác nhận."],
  },
];

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
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          if (!media.matches) {
            entry.target.animate(
              [{ opacity: 0, transform: "translateY(35px)" }, { opacity: 1, transform: "translateY(0)" }],
              { duration: 850, easing: "cubic-bezier(.2,.7,.2,1)" },
            );
          }
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-20% 0px -55% 0px" });
    document.querySelectorAll("section[id]").forEach((el) => sections.observe(el));
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
      reveal.disconnect(); sections.disconnect(); sceneObserver.disconnect();
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
    const text = `MỘT DẢI DI SẢN\nVietnam Roots, Global Minds\n\nHÀNH TRÌNH CỦA TÔI\n${programs.filter((p) => selected.includes(p.id)).map((p) => `\n${p.number}. ${p.type}\n${p.short}\n${p.description}\n`).join("")}\nNgày, địa điểm và lịch chi tiết: sẽ được công bố.\nĐây là bản lưu lịch trình cá nhân, không phải vé tham dự hay xác nhận đăng ký.`;
    const url = URL.createObjectURL(new Blob(["\ufeff", text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "hanh-trinh-di-san.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const closeModal = () => setModal(null);

  return (
    <>
      <a href="#hanh-trinh" className="skip-link">Bỏ qua phần mở đầu</a>
      <div className="reading-progress" aria-hidden="true" />
      <header ref={headerRef} className="site-header over-hero">
        <a href="#khoi-hanh" className="brand" aria-label="Một Dải Di Sản — Trang đầu">
          <span className="brand-seal">di<br />sản<span>✳</span></span>
          <span className="brand-wordmark">MỘT DẢI DI SẢN<small>VIETNAM ROOTS, GLOBAL MINDS</small></span>
        </a>
        <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Điều hướng chính">
          {[["hanh-trinh", "Câu chuyện"], ["hoi-cho", "Điểm hẹn"], ["khong-gian", "Di sản 3D"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? "active" : ""} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <button className="nav-cta" onClick={() => { setModal("passport"); setMenuOpen(false); }}>Hẹn một chuyến đi <Arrow /></button>
        </nav>
        <button className="menu-toggle" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
      </header>
      <main>
        <HeroSection reducedMotion={reducedMotion} />
        <div className="ticker" aria-hidden="true"><div>{Array.from({ length: 4 }, (_, i) => <span key={i}>TỪ CỘI NGUỒN <b>✳</b> ĐẾN THẾ GIỚI <b>✳</b> VIETNAM ROOTS, GLOBAL MINDS <b>✳</b></span>)}</div></div>
        <section className="introduction section-pad" id="hanh-trinh">
          <div className="intro-side" data-reveal><span className="eyebrow">LỜI MỜI TỪ DI SẢN</span><Sun /><span className="vertical-note">MỖI BƯỚC ĐI, MỘT KẾT NỐI</span></div>
          <div className="intro-copy" data-reveal><h2>Di sản không ở lại quá khứ.<br />Di sản <em>sống cùng chúng ta.</em></h2><div className="intro-columns"><p>Trong nếp nhà, trong câu hát, trong một món ăn thân quen — có một Việt Nam vẫn đang được kể mỗi ngày.</p><p>Chúng mình mời bạn bước lên con đường di sản: chạm vào văn hoá, cất lên góc nhìn của mình và cùng viết tiếp câu chuyện Việt Nam.</p></div></div>
          <a href="#hoi-cho" className="intro-next" aria-label="Đến trạm đầu tiên">↓</a>
        </section>
        <div className="journey-heading section-pad" data-reveal><span className="eyebrow">BẢN ĐỒ TRẢI NGHIỆM</span><h2>Ba điểm dừng.<br /><em>Một hành trình đáng nhớ.</em></h2><span className="handwritten">Đi cùng chúng mình nhé! ↴</span></div>
        <div className="journey-stations">
          <svg className="journey-route" viewBox="0 0 1200 1900" preserveAspectRatio="none" fill="none" aria-hidden="true"><path className="route-base" d="M600 0C600 130 80 100 80 360S1120 380 1120 700S80 1000 80 1290S600 1520 600 1900" /><path className="route-dashes" d="M600 0C600 130 80 100 80 360S1120 380 1120 700S80 1000 80 1290S600 1520 600 1900" /></svg>
          {programs.map((program, index) => (
            <section className={`station station-${index + 1} section-pad`} id={program.id} key={program.id} aria-labelledby={`title-${program.id}`}>
              <div className="station-art" data-reveal>
                {index === 0 ? <MarketArt /> : index === 1 ? <DebateArt /> : <WorkshopArt />}
                <span className="art-footnote">TRẠM {program.number} / {program.short}</span>
              </div>
              <div className="station-copy" data-reveal>
                <div className="station-kicker"><span className="station-number">{program.number}</span><span className="eyebrow">{program.type}</span></div>
                <h2 id={`title-${program.id}`}>{program.title.split("\n")[0]}<br /><em>{program.title.split("\n")[1]}</em></h2>
                <p>{program.description}</p>
                <div className="tags">{program.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <button className="text-link" onClick={() => setModal(index)}>Khám phá điểm dừng <Arrow /></button>
              </div>
            </section>
          ))}
        </div>
        <section className="heritage-section section-pad" id="khong-gian" aria-labelledby="heritage-title">
          <div className="heritage-copy" data-reveal><span className="eyebrow"><span className="live-dot" /> KHÔNG GIAN DI SẢN 3D</span><h2 id="heritage-title">Một góc nhìn mới.<br /><em>Một niềm tự hào<br />rất cũ.</em></h2><p>Đi vòng quanh một mái đình.<br />Ngắm di sản từ một góc khác.<br />Để những điều quen thuộc lại khiến bạn ngỡ ngàng.</p><div className="heritage-note"><Sun /><span>Chạm, kéo và khám phá.<br /><small>Mô hình nghệ thuật lấy cảm hứng từ kiến trúc Việt.</small></span></div></div>
          <div className="heritage-stage" ref={sceneRef}>{sceneVisible ? <HeritageViewer reducedMotion={reducedMotion} /> : <div className="scene-loading"><Sun /><span>Một góc Việt Nam đang chờ bạn.</span></div>}</div>
        </section>
        <section className="invitation section-pad" id="loi-hen">
          <Lantern className="invite-lantern left" /><Lantern className="invite-lantern right" />
          <div data-reveal><span className="eyebrow">HÀNH TRÌNH SẼ TRỌN VẸN HƠN KHI CÓ BẠN</span><h2>Mang theo sự tò mò.<br /><em>Mang về một niềm tự hào.</em></h2><p>Một cuộc hẹn với văn hoá Việt, theo cách của thế hệ mình.</p><button className="button button-red" onClick={() => setModal("passport")}>Hẹn mình ở con đường di sản <Arrow /></button><div className="event-status"><span className="live-dot" /> Ngày & địa điểm tổ chức sẽ sớm được công bố</div></div>
          <div className="invitation-bottom"><span>GỐC RỄ VIỆT NAM.</span><Lotus /><span>TƯ DUY TOÀN CẦU.</span></div>
        </section>
      </main>
      <footer className="site-footer"><a href="#khoi-hanh" className="footer-brand">Một dải <em>di sản.</em></a><span>Hiểu mình đến từ đâu.<br />Biết mình có thể đi xa đến đâu.</span><a href="#khoi-hanh" className="back-top">Về đầu hành trình ↑</a><div className="footer-bottom"><span>VIETNAM ROOTS, GLOBAL MINDS</span><span>Một hành trình kết nối văn hoá & thế hệ.</span><span>ĐƯỢC KỂ BẰNG NIỀM TỰ HÀO VIỆT</span></div></footer>
      <nav className="journey-dots" aria-label="Các điểm dừng">{[["khoi-hanh", "Khởi hành"], ["hoi-cho", "Hội chợ"], ["tranh-bien", "Tranh biện"], ["doi-thoai", "Workshop"], ["khong-gian", "Di sản 3D"]].map(([id, label]) => <a href={`#${id}`} key={id} aria-label={label} aria-current={active === id ? "location" : undefined} className={active === id ? "current" : ""}><span>{label}</span></a>)}</nav>
      <dialog ref={dialogRef} className="experience-dialog" onCancel={closeModal} onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }} aria-labelledby="dialog-title">
        <div className="dialog-inner">
          <button className="dialog-close" onClick={closeModal} aria-label="Đóng cửa sổ">✕</button>
          {modal === "passport" ? <>
            <span className="eyebrow">TẤM HỘ CHIẾU VĂN HOÁ CỦA BẠN</span><h2 id="dialog-title">Hẹn một <em>chuyến đi.</em></h2><p>Chọn những điểm dừng bạn yêu thích để lưu hành trình của riêng mình.</p>
            <div className="passport-options">{programs.map((p) => <label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={() => { setSelected((prev) => prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]); setSaved(false); setSaveError(false); }} /><span className="passport-number">{p.number}</span><span><strong>{p.type}</strong><small>{p.short}</small></span></label>)}</div>
            <div className="dialog-notice">Sự kiện đang được chuẩn bị. Lưu hành trình là một lời hẹn cá nhân, chưa phải đăng ký tham dự. Ngày, địa điểm và hình thức đăng ký sẽ được công bố sau.</div>
            <div className="dialog-actions"><button className="button button-red" disabled={!selected.length} onClick={savePassport}>{saved ? "Đã lưu trên thiết bị ✓" : "Lưu hành trình"}<Arrow /></button><button className="text-link" disabled={!selected.length} onClick={downloadPassport}>Tải bản lưu ↓</button></div>
            <p className="save-status" role="status">{saveError ? "Trình duyệt chưa cho phép lưu. Bạn có thể tải bản lưu về thiết bị." : saved ? "Hành trình đã được lưu trong trình duyệt này." : !selected.length ? "Hãy chọn ít nhất một điểm dừng." : ""}</p>
          </> : typeof modal === "number" ? <>
            <span className="eyebrow">TRẠM {programs[modal].number} / {programs[modal].type}</span><h2 id="dialog-title">{programs[modal].short}</h2><p>{programs[modal].detail}</p><ul className="activity-list">{programs[modal].activities.map((activity) => <li key={activity}>{activity}</li>)}</ul><div className="dialog-notice">Nội dung dự kiến. Lịch chi tiết và thông tin tham gia sẽ được ban tổ chức cập nhật.</div><button className="button button-red" onClick={() => setModal("passport")}>Lên lịch trình của bạn <Arrow /></button>
          </> : null}
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
