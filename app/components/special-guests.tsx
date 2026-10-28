"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const guests = [
  { name: "Xuân Bắc", image: "/images/ns_xuanbac.png", alt: "Nghệ sĩ Xuân Bắc cầm micro giao lưu", role: "NGHỆ SĨ · KHÁCH MỜI ĐẶC BIỆT", theme: "CỘI NGUỒN & CẢM HỨNG", caption: "Bản sắc là điểm tựa. Sáng tạo là nhịp cầu.", description: "Từ sân khấu đến những câu chuyện đời thường, nghệ thuật mở ra một cách gần gũi để chạm vào văn hoá. Cuộc gặp gỡ với nghệ sĩ Xuân Bắc là lời gợi mở để người trẻ suy ngẫm: làm sao kể câu chuyện Việt bằng tiếng nói của thế hệ mình, giữ cội nguồn và tự tin đối thoại với thế giới?" },
  { name: "Hoàng Thuỳ Linh", image: "/images/km_hoangthuylinh.png", alt: "Khách mời Hoàng Thuỳ Linh trong trang phục đỏ", role: "CA SĨ · KHÁCH MỜI ĐẶC BIỆT", theme: "BẢN SẮC & SÁNG TẠO", caption: "Mang chất Việt vào những cách biểu đạt mới.", description: "Âm nhạc là một điểm hẹn để bản sắc và tinh thần đương đại cùng cất tiếng. Cuộc gặp gỡ với Hoàng Thuỳ Linh gợi mở câu hỏi dành cho người trẻ: chúng ta có thể làm mới cách kể câu chuyện văn hoá như thế nào, để những giá trị thân thuộc tìm thấy sự đồng cảm vượt qua biên giới?" },
  { name: "Khách mời bí ẩn", image: null, alt: "", role: "KHÁCH MỜI BÍ ẨN", theme: "MỘT BẤT NGỜ ĐANG ĐẾN", caption: "Hẹn bạn ở lần hé lộ tiếp theo.", description: "Một người đồng hành mới, một câu chuyện chưa bật mí. Ai sẽ cùng bạn nối những giá trị Việt với tư duy toàn cầu? Danh tính khách mời đặc biệt tiếp theo sẽ sớm được công bố." },
];
const INTERVAL = 10000;

export default function SpecialGuests() {
  // Keep the angle continuous when wrapping in either direction.
  const [turn, setTurn] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const active = ((turn % guests.length) + guests.length) % guests.length;
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
    const timer = window.setTimeout(() => setTurn((value) => value + 1), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [running, turn]);

  function move(direction: number) {
    setTurn((value) => value + direction);
  }

  return <section className="special-guests section-pad" id="khach-moi" aria-labelledby="guests-title">
    <div className="guests-heading" data-reveal><div><span className="eyebrow">KHÁCH MỜI ĐẶC BIỆT / SPECIAL GUESTS</span><h2 id="guests-title">Những người kể chuyện.<br /><em>Những góc nhìn mở.</em></h2></div><p>Gặp gỡ những tiếng nói truyền cảm hứng, để nhìn bản sắc Việt bằng một tâm thế mới: tự tin, cởi mở và sẵn sàng kết nối với thế giới.</p></div>
    <div ref={stage} className="guest-showcase guest-rotating-showcase" role="region" aria-roledescription="carousel" aria-label="Giới thiệu khách mời, tự chuyển mỗi 10 giây" data-reveal>
      <div className="guest-carousel-layout">
        <div className="guest-visual">
          <div className="guest-orbit-wrapper">
          <div className="guest-shared-backdrop" aria-hidden="true"><span className="guest-orbit" /><span className="guest-orbit guest-orbit-outer" /><span className="guest-art-label">BẢN SẮC<br />& CẢM HỨNG</span><span className="guest-portrait-footer">VIETNAM ROOTS · GLOBAL MIND</span></div>
          <div className="guest-orbit-stage" aria-hidden="true">
          {guests.map((guest, index) => <div key={guest.name} className={`guest-orbit-card ${index === active ? "is-front" : "is-behind"}`} style={{ "--guest-angle": `${(index - turn) * 360 / guests.length}deg` } as CSSProperties}>
            <span className="guest-portrait">{guest.image ? <Image src={guest.image} alt={guest.alt} fill sizes="(max-width: 800px) 70vw, 35vw" className="guest-photo" /> : <><svg className="guest-silhouette" viewBox="0 0 400 480" aria-hidden="true"><path d="M147 152c-9-17-12-36-8-54 4-37 25-60 61-60s57 23 61 60c4 18 1 37-8 54-4 21-16 42-30 51v25c5 16 25 22 49 30 45 15 69 43 76 91l14 131H38l14-131c7-48 31-76 76-91 24-8 44-14 49-30v-25c-14-9-26-30-30-51Z" /></svg><span className="guest-question" aria-hidden="true">?</span></>}</span>
          </div>)}
          </div>
          </div>
        </div>
        <div className="guest-description-panel">
        <div className="guest-stories" aria-live="off">{guests.map((guest, index) => <article key={guest.name} className={`guest-story ${index === active ? "is-active" : ""}`} aria-hidden={index !== active} inert={index !== active}><div className="guest-copy"><span className="guest-scene-label" aria-hidden="true">THE PEOPLE. THE PERSPECTIVES.</span><span className="eyebrow">{guest.role}</span><h3>{guest.image ? guest.name : "Một góc nhìn bất ngờ."}</h3><p>{guest.description}</p><span className="guest-caption">{guest.caption}</span></div></article>)}</div>
          <div className="guest-navigation" aria-label="Chuyển khách mời"><button type="button" onClick={() => move(-1)} aria-label="Khách mời trước"><span aria-hidden="true">←</span> Trước</button><button type="button" onClick={() => move(1)} aria-label="Khách mời tiếp theo">Tiếp <span aria-hidden="true">→</span></button></div>
        </div>
      </div>
    </div>
  </section>;
}
