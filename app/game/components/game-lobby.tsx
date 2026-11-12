"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PassportArt, StageArt, StageIcon } from "./game-art";
import { stages, type GameMode } from "./stages";

function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>; }

export default function GameLobby() {
  const [mode, setMode] = useState<GameMode>("online");
  const [selected, setSelected] = useState<(typeof stages)[number] | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => dialog?.close();
  }, []);

  function showStage(stage: (typeof stages)[number]) {
    setSelected(stage);
    dialogRef.current?.showModal();
  }

  return <div className="game-lobby">
    <main id="game-main">
      <section className="game-hero" aria-labelledby="game-title">
        <Image className="game-heroBackdrop" src="/keyvisual/1.png" alt="" fill sizes="100vw" />
        <div className="game-heroInner">
          <div className="game-heroCopy">
            <div className="game-eyebrow"><span /> THE HERITAGE ODYSSEY <span className="game-edition">GAME 2026</span></div>
            <h1 id="game-title">Hộ chiếu <em>Di sản</em></h1>
            <p className="game-heroLead">Chạm vào di sản.<br />Đánh thức bản sắc Việt.</p>
            <p className="game-heroDescription">Cùng Chú Tễu bước qua 5 chặng chơi, xua tan Sương Quên và tìm lại những dấu ấn làm nên chính mình.</p>
            <a className="game-heroCta" href="#chon-chang">Khám phá 5 chặng chơi <Arrow /></a>
            <div className="game-heroMeta"><span>05 mini-game</span><i /> <span>Chơi trên điện thoại</span><i /><span>Không cần cài app</span></div>
          </div>
          <PassportArt />
        </div>
        <div className="game-heroFoot"><span>VIETNAM ROOTS <b>✦</b> GLOBAL MINDS</span><span>Mỗi chặng chơi, một mảnh ghép bản sắc.</span></div>
      </section>

      <div className="game-content">
        <section className="game-journey" id="chon-chang" aria-labelledby="stages-title">
          <div className="game-sectionHeading"><div><p className="game-kicker">HÀNH TRÌNH CỦA BẠN</p><h2 id="stages-title">Năm chặng chơi. <em>Một cội nguồn.</em></h2></div><span className="game-previewBadge">Chặng 1 · Chơi thử</span></div>
          <p className="game-sectionIntro">Mỗi trò chơi mở ra một góc nhìn về di sản Việt. Bạn muốn khám phá điều gì trước?</p>

          <div className="game-modeSwitcher" role="group" aria-label="Chế độ trải nghiệm">
            <button type="button" aria-pressed={mode === "online"} onClick={() => setMode("online")}><span>Trước sự kiện <small>Online</small></span><span>24/11 – 04/12</span></button>
            <button type="button" aria-pressed={mode === "event"} onClick={() => setMode("event")}><span>Tại sự kiện <small>Trực tiếp</small></span><span>05/12/2026</span></button>
          </div>
          <p className="game-modeNote" aria-live="polite">{mode === "online" ? "Hành trình online dự kiến bắt đầu từ 24/11. Các chặng lần lượt được mở theo lịch." : "Ngày 05/12, quét QR riêng tại mỗi gian để trải nghiệm phiên bản rút gọn và nhận sticker giấy."}</p>

          <div className="game-stageGrid">
            {stages.map((stage, index) => <button type="button" key={stage.id} className="game-stageCard" data-stage={stage.id} onClick={() => showStage(stage)} aria-label={`Khám phá chặng ${index + 1}: ${stage.name}`} aria-haspopup="dialog">
              <div className="game-cardArt"><span className="game-stageNumber">CHẶNG <b>0{index + 1}</b></span><StageArt id={stage.id} /><span className="game-artCaption">{stage.category}</span></div>
              <div className="game-cardContent"><div className="game-cardTopline"><span className="game-stampLabel"><StageIcon id={stage.id} />Dấu {stage.stamp}</span><span className="game-comingSoon">{stage.id === "craft" ? "Có thể chơi thử" : "Sắp ra mắt"}</span></div><h3>{stage.name}</h3><p>{stage.description}</p><span className="game-gameSummary">{stage[mode].summary}</span><span className="game-cardAction">Khám phá chặng <Arrow /></span></div>
            </button>)}
            <aside className="game-storyCard">
              <span className="game-storyMark" aria-hidden="true">✦</span><p className="game-kicker">MỘT HÀNH TRÌNH, NĂM DẤU ẤN</p><h3>Muốn đi xa,<br />phải biết mình<br /><em>từ đâu đến.</em></h3><p>Thu thập đủ 5 con dấu, tìm lại bản sắc và trở thành Đại sứ di sản.</p><div className="game-storyStamps" aria-label="Năm dấu ấn: Đôi tay, Đôi mắt, Đôi tai, Đôi chân, Tiếng nói">{stages.map(stage => <span key={stage.id} title={stage.stamp}><StageIcon id={stage.id} /></span>)}</div>
            </aside>
          </div>
        </section>

        <section className="game-guide" aria-labelledby="guide-title"><div><p className="game-kicker">TỪ MÀN HÌNH ĐẾN ĐỜI THỰC</p><h2 id="guide-title">Hành trình diễn ra thế nào?</h2></div><ol><li><span>01</span><div><h3>Khám phá di sản</h3><p>Trải nghiệm 5 mini-game với những cách chơi khác nhau.</p></div></li><li><span>02</span><div><h3>Gom từng dấu ấn</h3><p>Vượt chặng để nhận con dấu và sticker cho hành trình của bạn.</p></div></li><li><span>03</span><div><h3>Hẹn gặp tại sự kiện</h3><p>Ghé các gian di sản, chơi bản rút gọn và sưu tầm sticker giấy.</p></div></li></ol></section>
      </div>
    </main>
    <footer className="game-footer"><div><b>HỘ CHIẾU DI SẢN</b><span>Một trải nghiệm của Global Citizens Day 2026</span></div><Link href="/">Về trang sự kiện <Arrow /></Link></footer>

    <dialog className="game-dialog" ref={dialogRef} aria-labelledby="stage-dialog-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      {selected && <><div className="game-dialogArt" data-stage={selected.id}><StageArt id={selected.id} /><button type="button" className="game-closeDialog" aria-label="Đóng giới thiệu chặng" onClick={() => dialogRef.current?.close()}>×</button></div><div className="game-dialogBody"><p className="game-kicker">CHẶNG 0{stages.indexOf(selected) + 1} · {mode === "online" ? "ONLINE" : "TẠI SỰ KIỆN"}</p><h2 id="stage-dialog-title">{selected.name}</h2><p className="game-dialogStory">{selected.story}</p><h3>Cách chơi</h3><ul>{selected[mode].rules.map(rule => <li key={rule}>{rule}</li>)}</ul>{mode === "event" && <div className="game-challenge"><b>Thử thách thực tế · Tùy chọn</b><p>{selected.challenge}</p></div>}<div className="game-dialogStamp"><StageIcon id={selected.id} /><span>Dấu ấn của chặng: <b>{selected.stamp}</b></span></div>{selected.id === "craft" ? <><Link className="game-craftPlay" href={`/game/craft-shop?mode=${mode}`} onClick={() => dialogRef.current?.close()}>Chơi thử Tiệm Bách nghệ →</Link><p className="game-dialogNote">Khám phá bản chơi thử. Kết quả chưa lưu vào hộ chiếu.</p></> : <><button type="button" className="game-playButton" disabled>Trò chơi sắp ra mắt</button><p className="game-dialogNote">Bạn có thể xem trước các chặng. Hành trình chơi sẽ được mở sau.</p></>}</div></>}
    </dialog>
  </div>;
}
