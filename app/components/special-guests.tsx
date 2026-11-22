"use client";
import { useCopy, useLocalizedData } from "@/i18n/copy";


import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const guestsSource = [
  {
    name: "Đinh Huy Tú",
    image: "/images/KM_DinhHuyTu.png",
    photoPosition: "35% bottom",
    alt: "Khách mời Đinh Huy Tú cùng máy tính trong không gian sáng tạo số",
    role: "SÁNG TẠO SỐ · KHÁCH MỜI ĐẶC BIỆT",
    caption: "Từ ý tưởng Việt đến sân chơi sáng tạo toàn cầu.",
    description: "Là thành viên đội Minecraft Việt Nam giành chiến thắng tại MrBeast World Wide Building Challenge, Đinh Huy Tú mang đến câu chuyện về sức sáng tạo và tinh thần đồng đội của người trẻ Việt trên sân chơi quốc tế. Từ những khối vuông trong thế giới số, cuộc gặp gỡ gợi mở cách biến ý tưởng thành dấu ấn riêng và tự tin kết nối với cộng đồng toàn cầu.",
  },
  {
    name: "Nguyễn Thơ Thơ",
    image: "/images/KM_NguyenThoTho.png",
    photoPosition: "22% bottom",
    alt: "Nhà thiết kế Nguyễn Thơ Thơ trong trang phục thêu tay",
    role: "NHÀ THIẾT KẾ · SÁNG LẬP TIỆM THƠ",
    caption: "Từ đường kim truyền thống đến những kết nối đương đại.",
    description: "Nhà thiết kế, nhà sáng lập và điều hành Tiệm Thơ (Thơ Heritage House), Nguyễn Thơ Thơ đưa họa tiết Đông Hồ, Hàng Trống vào thời trang nhung, lụa và thêu tay truyền thống. Chị trực tiếp thêu tay biểu trưng APEC Việt Nam 2027 và xuất hiện trong thước phim quảng bá sự kiện do Thông tấn xã Việt Nam giới thiệu ngày 21/11/2026 — một dấu ấn đưa tinh hoa thủ công Việt đến với bạn bè quốc tế.",
  },
];
const INTERVAL = 10000;

export default function SpecialGuests() {
  const t = useCopy();
  const guests = useLocalizedData(guestsSource);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const guest = guests[active];
  const running = visible && pageVisible;

  useEffect(() => {
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    if (stage.current) observer.observe(stage.current);
    return () => { document.removeEventListener("visibilitychange", visibility); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % guests.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [running, active, guests.length]);

  function move(direction: number) {
    setActive((value) => (value + direction + guests.length) % guests.length);
  }

  return <section className="special-guests section-pad" id="khach-moi" aria-labelledby="guests-title">
    <div className="guests-heading" data-reveal><div><span className="eyebrow">{t("KHÁCH MỜI ĐẶC BIỆT / SPECIAL GUESTS")}</span><h2 id="guests-title">{t("Những người kể chuyện.")}<br /><em>{t("Những góc nhìn mở.")}</em></h2></div><p>{t("Gặp gỡ những tiếng nói truyền cảm hứng, để nhìn bản sắc Việt bằng một tâm thế mới: tự tin, cởi mở và sẵn sàng kết nối với thế giới.")}</p></div>
    <div ref={stage} className="guest-showcase guest-sliding-showcase" role="region" aria-roledescription="carousel" aria-label={t("Giới thiệu khách mời, tự chuyển mỗi 10 giây")} data-reveal>
      <div className="guest-carousel-layout">
        <div className="guest-visual">
          <div className="guest-portrait-wrapper">
          <div className="guest-shared-backdrop" aria-hidden="true"><span className="guest-orbit" /><span className="guest-orbit guest-orbit-outer" /><span className="guest-art-label">{t("BẢN SẮC")}<br />{t("& CẢM HỨNG")}</span><span className="guest-portrait-footer">VIETNAM ROOTS · GLOBAL MINDS</span></div>
          <div className="guest-portrait-stage" aria-hidden="true">
          <AnimatePresence initial={false} mode="wait">
          <motion.div key={active} className="guest-portrait-frame"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            transition={{ duration: reducedMotion ? 0 : .3, ease: "easeOut" }}>
            <span className="guest-portrait"><Image src={guest.image} alt={guest.alt} fill sizes="(max-width: 800px) 70vw, 35vw" className="guest-photo" style={{ objectPosition: guest.photoPosition }} /></span>
          </motion.div>
          </AnimatePresence>
          </div>
          </div>
        </div>
        <div className="guest-description-panel">
        <div className="guest-stories" aria-live="off">{guests.map((guest, index) => <article key={guest.name} className={`guest-story ${index === active ? "is-active" : ""}`} aria-hidden={index !== active} inert={index !== active}><div className="guest-copy"><span className="guest-scene-label" aria-hidden="true">THE PEOPLE. THE PERSPECTIVES.</span><span className="eyebrow">{guest.role}</span><h3>{guest.name}</h3><p>{guest.description}</p><span className="guest-caption">{guest.caption}</span></div></article>)}</div>
          <div className="guest-navigation" aria-label={t("Chuyển khách mời")}><button type="button" onClick={() => move(-1)} aria-label={t("Khách mời trước")}><span aria-hidden="true">←</span> {t("Trước")}</button><button type="button" onClick={() => move(1)} aria-label={t("Khách mời tiếp theo")}>{t("Tiếp")} <span aria-hidden="true">→</span></button></div>
        </div>
      </div>
    </div>
  </section>;
}
