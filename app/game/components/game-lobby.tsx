"use client";
import { GameAccountPanel } from "./game-account";
import EventPassport from "./event-passport";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PassportArt, StageArt, StageIcon } from "./game-art";
import { stages, type GameMode, type StageId } from "./stages";

function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>; }

const playablePaths: Partial<Record<StageId, string>> = { craft: "/game/craft-shop", print: "/game/dong-ho", rhythm: "/game/rhythm", place: "/game/place", postcard: "/game/postcard" };

export default function GameLobby() {
  const params = useSearchParams(), router = useRouter();
  const mode: GameMode = params.get("tab") === "event" ? "event" : "online";
  const setMode = (value: GameMode) => router.replace(`/game?tab=${value}#chon-chang`, { scroll: false });
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
            <p className="game-heroDescription">{mode === "online" ? "Cùng Chú Tễu bước qua 5 chặng chơi, xua tan Sương Quên và tìm lại những dấu ấn làm nên chính mình." : "Ghé những gian hàng, gặp những câu chuyện mới. Quét QR để gom con dấu vào hộ chiếu và mang về món quà của hành trình."}</p>
            <a className="game-heroCta" href="#chon-chang">{mode === "online" ? "Khám phá 5 chặng chơi" : "Mở passport của tôi"} <Arrow /></a>
            <div className="game-heroMeta"><span>{mode === "online" ? "05 mini-game" : "Hộ chiếu QR"}</span><i /> <span>Chơi trên điện thoại</span><i /><span>Không cần cài app</span></div>
          </div>
          <PassportArt />
        </div>
        <div className="game-heroFoot"><span>VIETNAM ROOTS <b>✦</b> GLOBAL MINDS</span><span>Mỗi chặng chơi, một mảnh ghép bản sắc.</span></div>
      </section>

      <div className="game-content">{mode === "online" && <GameAccountPanel />}
        <section className="game-journey" id="chon-chang" aria-labelledby="stages-title">
          <div className="game-sectionHeading"><div><p className="game-kicker">HÀNH TRÌNH CỦA BẠN</p><h2 id="stages-title">{mode === "online" ? <>Năm chặng chơi. <em>Một cội nguồn.</em></> : <>Đi qua từng gian. <em>Gom từng dấu hẹn.</em></>}</h2></div><span className="game-previewBadge">{mode === "online" ? "5 game · 3 lượt/game" : "PASSPORT TẠI SỰ KIỆN"}</span></div>
          <p className="game-sectionIntro">{mode === "online" ? "Mỗi trò chơi mở ra một góc nhìn về di sản Việt. Bạn muốn khám phá điều gì trước?" : "Mỗi con dấu ghi lại một gian hàng bạn đã ghé. Hộ chiếu được lưu cùng tài khoản để bạn tiếp tục trên điện thoại của mình."}</p>

          <div className="game-modeSwitcher" role="group" aria-label="Chế độ trải nghiệm">
            <button type="button" aria-pressed={mode === "online"} onClick={() => setMode("online")}><span>Trước sự kiện <small>Online</small></span><span>05 mini-game</span></button>
            <button type="button" aria-pressed={mode === "event"} onClick={() => setMode("event")}><span>Tại sự kiện <small>Trực tiếp</small></span><span>Gom dấu · Đổi quà</span></button>
          </div>
          <p className="game-modeNote" aria-live="polite">{mode === "online" ? "Hành trình online dự kiến bắt đầu từ 24/11. Các chặng lần lượt được mở theo lịch." : "Quét QR tại gian để nhận dấu vào hộ chiếu. Xuất trình passport tại quầy đổi quà khi đủ dấu."}</p>

          {mode === "online" ? <div className="game-stageGrid">
            {stages.map((stage, index) => <button type="button" key={stage.id} className="game-stageCard" data-stage={stage.id} onClick={() => showStage(stage)} aria-label={`Khám phá chặng ${index + 1}: ${stage.name}`} aria-haspopup="dialog">
              <div className="game-cardArt"><span className="game-stageNumber">CHẶNG <b>0{index + 1}</b></span><StageArt id={stage.id} /><span className="game-artCaption">{stage.category}</span></div>
              <div className="game-cardContent"><div className="game-cardTopline"><span className="game-stampLabel"><StageIcon id={stage.id} />Dấu {stage.stamp}</span><span className="game-comingSoon">{playablePaths[stage.id] ? "Có thể chơi thử" : "Sắp ra mắt"}</span></div><h3>{stage.name}</h3><p>{stage.description}</p><span className="game-gameSummary">{stage[mode].summary}</span><span className="game-cardAction">Khám phá chặng <Arrow /></span></div>
            </button>)}
            <aside className="game-storyCard">
              <span className="game-storyMark" aria-hidden="true">✦</span><p className="game-kicker">MỘT HÀNH TRÌNH, NĂM DẤU ẤN</p><h3>Muốn đi xa,<br />phải biết mình<br /><em>từ đâu đến.</em></h3><p>Thu thập đủ 5 con dấu, tìm lại bản sắc và trở thành Đại sứ di sản.</p><div className="game-storyStamps" aria-label="Năm dấu ấn: Đôi tay, Đôi mắt, Đôi tai, Đôi chân, Tiếng nói">{stages.map(stage => <span key={stage.id} title={stage.stamp}><StageIcon id={stage.id} /></span>)}</div>
            </aside>
          </div> : <EventPassport />}
        </section>

        {mode === "online" && <section className="game-guide" aria-labelledby="guide-title"><div><p className="game-kicker">TỪ MÀN HÌNH ĐẾN ĐỜI THỰC</p><h2 id="guide-title">Hành trình diễn ra thế nào?</h2></div><ol><li><span>01</span><div><h3>Khám phá di sản</h3><p>Trải nghiệm 5 mini-game với những cách chơi khác nhau.</p></div></li><li><span>02</span><div><h3>Gom từng dấu hẹn</h3><p>Ghi điểm khi chơi online, nhận dấu QR khi ghé gian tại sự kiện.</p></div></li><li><span>03</span><div><h3>Hẹn gặp tại sự kiện</h3><p>Ghé các gian hàng, gom dấu và đổi quà theo mốc ban tổ chức công bố.</p></div></li></ol></section>}
      </div>
    </main>
    <footer className="game-footer"><div><b>HỘ CHIẾU DI SẢN</b><span>Một trải nghiệm của Global Citizens Day 2026</span></div><Link href="/">Về trang sự kiện <Arrow /></Link></footer>

    <dialog className="game-dialog" ref={dialogRef} aria-labelledby="stage-dialog-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      {selected && <><div className="game-dialogArt" data-stage={selected.id}><StageArt id={selected.id} /><button type="button" className="game-closeDialog" aria-label="Đóng giới thiệu chặng" onClick={() => dialogRef.current?.close()}>×</button></div><div className="game-dialogBody"><p className="game-kicker">CHẶNG 0{stages.indexOf(selected) + 1} · {mode === "online" ? "ONLINE" : "TẠI SỰ KIỆN"}</p><h2 id="stage-dialog-title">{selected.name}</h2><p className="game-dialogStory">{selected.story}</p><h3>Cách chơi</h3><ul>{selected[mode].rules.map(rule => <li key={rule}>{rule}</li>)}</ul>{mode === "event" && <div className="game-challenge"><b>Thử thách thực tế · Tùy chọn</b><p>{selected.challenge}</p></div>}<div className="game-dialogStamp"><StageIcon id={selected.id} /><span>Dấu ấn của chặng: <b>{selected.stamp}</b></span></div>{playablePaths[selected.id] ? <><Link className="game-craftPlay" href={`${playablePaths[selected.id]}?mode=${mode}`} onClick={() => dialogRef.current?.close()}>Chơi thử {selected.name} →</Link><p className="game-dialogNote">Mỗi game có 3 lượt. Điểm cao nhất được ghi nhận vào tài khoản.</p></> : <><button type="button" className="game-playButton" disabled>Trò chơi sắp ra mắt</button><p className="game-dialogNote">Bạn có thể xem trước các chặng. Hành trình chơi sẽ được mở sau.</p></>}</div></>}
    </dialog>
  </div>;
}
