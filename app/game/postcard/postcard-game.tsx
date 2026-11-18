"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { places } from "../place/engine";
import { useGameFullscreen } from "../hooks/use-game-fullscreen";
import { frames, initialDraft, MAX_WORDS, restoreDraft, validMessage, wordCount, type Draft } from "./model";
import { renderCard } from "./render-card";
import PostcardRecorder from "./postcard-recorder";
import { postcardArtworkUrl } from "./postcard-art";

const storageKey = "gcd-postcard-draft-v1";
export default function PostcardGame() {
  const event = useSearchParams().get("mode") === "event";
  const [phase, setPhase] = useState<"intro" | "edit" | "done">("intro");
  const [draft, setDraft] = useState<Draft>(initialDraft), [notice, setNotice] = useState("");
  const [rendered, setRendered] = useState({ key: "", url: "", error: "" });
  const fullscreen = useGameFullscreen();
  const key = useMemo(() => JSON.stringify(draft), [draft]);
  const count = wordCount(draft.message), valid = validMessage(draft.message);
  const ready = rendered.key === key && Boolean(rendered.url);
  const place = places[draft.place];
  const frame = frames.find(f => f.id === draft.frame) || frames[0];
  const artwork = useMemo(() => postcardArtworkUrl(frame), [frame]);
  async function download() {
    if (!valid) return;
    try {
      const url = await renderCard(draft);
      setRendered({ key, url, error: "" });
      const link = document.createElement("a");
      link.href = url; link.download = "heritage-postcard.png"; link.click();
      setPhase("done");
    } catch { setNotice("Could not export postcard. Please try again."); }
  }
  useEffect(() => {
    if (phase !== "edit") return;
    const timer = setTimeout(() => { try { localStorage.setItem(storageKey, key); } catch { /* Draft storage is optional. */ } }, 300);
    return () => clearTimeout(timer);
  }, [phase, key]);
  function start() {
    try { setDraft(restoreDraft(localStorage.getItem(storageKey), places.length)); } catch { setDraft({ ...initialDraft }); }
    fullscreen.enter(); setPhase("edit");
  }
  async function share() {
    if (!ready || !valid) return;
    try {
      const blob = await (await fetch(rendered.url)).blob();
      const file = new File([blob], "heritage-postcard.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "From Vietnam, with heritage" }); setNotice("Đã chia sẻ postcard."); }
      else setNotice("Thiết bị chưa hỗ trợ chia sẻ ảnh trực tiếp. Bạn có thể tải postcard rồi gửi cho bạn bè.");
    } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setNotice("Chưa chia sẻ được ảnh. Bạn có thể tải postcard để gửi sau."); }
  }
  return <main className="post-app" data-phase={phase}><div className="post-wrap">
    <nav className="post-nav"><Link href="/game">← Hộ chiếu Di sản</Link><span>{fullscreen.supported && <button onClick={fullscreen.toggle}>{fullscreen.fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>}</span></nav>
    {phase === "intro" ? <section className="post-intro"><p className="post-kicker">CHẶNG 05 · DẤU TIẾNG NÓI · {event ? "SỰ KIỆN" : "ONLINE"}</p><div className="post-envelope" aria-hidden="true">✉<span>FROM VIETNAM</span></div><h1>Đại sứ <em>di sản</em></h1><p>Một tấm thiệp nhỏ.<br />Mang câu chuyện Việt đi xa.</p><ol><li>Chọn một điểm đến và khung postcard bạn yêu thích.</li><li>Viết lời giới thiệu tiếng Anh, tối đa 20 từ, bằng góc nhìn của riêng bạn.</li><li>Tải postcard để gửi bạn bè. Bạn có thể quay thêm clip 15 giây đọc lời nhắn.</li></ol><button className="post-primary" onClick={start}>Viết câu chuyện của tôi →</button><small>Bản chơi thử · Tạo và tải trên thiết bị. Chưa gửi ban tổ chức, chưa đăng lên tường postcard hay lưu vào hộ chiếu.</small></section> : <>
      <header className="post-heading"><div><p className="post-kicker">CHẶNG 05 · KỂ CHUYỆN VIỆT RA THẾ GIỚI</p><h1>{phase === "done" ? "Câu chuyện đã sẵn sàng" : "Postcard của bạn"}</h1></div><span className="post-step">{phase === "done" ? "✦ SẴN SÀNG GỬI ĐI" : "ẢNH · KHUNG · LỜI NHẮN"}</span></header>
      <div className="post-layout">
        <section className="post-preview" aria-label="Xem trước postcard"><div className="post-preview-paper post-live" data-frame={frame.id} style={{ backgroundColor: frame.paper, backgroundImage: `url("${artwork}")`, color: frame.ink, borderColor: frame.accent }}><div className="post-live-top">FROM VIETNAM, WITH HERITAGE <span>GCD 2026</span></div><div className="post-live-photo"><Image src={place.image} alt={place.name} width={1080} height={690} /></div><p className="post-live-slogan" style={{ color: frame.accent }}>VIETNAM ROOTS - GLOBAL MINDS</p><h2>{place.name}</h2><p className="post-live-message">{draft.message || "Your story starts here..."}</p><p className="post-live-sender">{draft.sender ? "From " + draft.sender : "A friend from Vietnam"}</p><small>Photo: {place.author} - {place.license}</small></div><p>FROM VIETNAM, WITH HERITAGE</p></section>
        {phase === "edit" ? <section className="post-editor" aria-label="Thiết kế postcard">
          <label className="post-field"><span><b>01</b> Một miền di sản<select value={draft.place} onChange={e => setDraft(d => ({ ...d, place: Number(e.target.value) }))}>{places.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}</select></span></label>
          <fieldset className="post-frames"><legend><b>02</b> Một sắc màu của bạn</legend>{frames.map(f => <button key={f.id} type="button" aria-pressed={draft.frame === f.id} onClick={() => setDraft(d => ({ ...d, frame: f.id }))}><i style={{ background: f.paper, borderColor: f.ink, color: f.accent }}>✦</i>{f.name}</button>)}</fieldset>
          <label className="post-field"><span><b>03</b> Một lời giới thiệu</span><textarea lang="en" maxLength={240} rows={4} value={draft.message} onChange={e => setDraft(d => ({ ...d, message: e.target.value }))} placeholder="What makes this place special to you?" aria-describedby="post-word-count post-writing-tip" aria-invalid={count > MAX_WORDS} /></label>
          <div className="post-word-count" id="post-word-count" data-invalid={count > MAX_WORDS} aria-live="polite">{count}/{MAX_WORDS} từ {count > MAX_WORDS && "· Hãy rút gọn lời nhắn trước khi tải."}</div>
          <p id="post-writing-tip" className="post-tip">Viết bằng tiếng Anh: một điều bạn yêu thích, một nét riêng hoặc một lời mời khám phá. Hãy dùng câu chuyện của chính bạn.</p>
          <label className="post-field">Người gửi <small>Không bắt buộc</small><input maxLength={40} value={draft.sender} onChange={e => setDraft(d => ({ ...d, sender: e.target.value }))} placeholder="Tên hoặc biệt danh của bạn" autoComplete="off" /></label>
          <button className="post-primary" disabled={!valid} onClick={() => void download()}>Tải postcard của tôi ↓</button>
          {notice && <p role="status">{notice}</p>}
          <small className="post-local-note">Bản nháp tự lưu trên trình duyệt này. Postcard chưa được gửi hoặc đăng công khai.</small>
        </section> : <section className="post-done"><h2>Mang một nét Việt đến bạn bè.</h2><p>{draft.message}</p><div className="post-done-actions"><a className="post-primary" href={rendered.url} download="heritage-postcard.png">Tải lại postcard ↓</a><button onClick={() => void share()}>Chia sẻ ảnh ↗</button><button onClick={() => { setPhase("edit"); setNotice(""); }}>Chỉnh sửa postcard</button></div><p className="post-notice" role="status">{notice}</p><PostcardRecorder /><p className="post-local-note">Postcard này chưa gửi BTC hay đăng lên tường công khai. Chức năng duyệt và bình chọn sẽ được bổ sung khi mở tường postcard.</p><Link className="post-back" href="/game">Về hành trình 5 chặng →</Link></section>}
      </div>
    </>}
  </div></main>;
}
