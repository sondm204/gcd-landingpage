"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GameInstructions from "../components/game-instructions";
import { GameStartStatus, GameResultStatus } from "../components/game-run-status";
import { useGameAccount } from "../components/game-account";
import { useRankedGame } from "../hooks/use-ranked-game";
import { places } from "../place/engine";
import { useGameFullscreen } from "../hooks/use-game-fullscreen";
import { frames, initialDraft, MAX_WORDS, restoreDraft, validMessage, wordCount, type Draft } from "./model";
import { postcardArtworkUrl } from "./postcard-art";

const storageKey = "gcd-postcard-draft-v1";
const idleReducer = (state: { phase: string }) => state;
export default function PostcardGame() {
  const event = useSearchParams().get("mode") === "event";
  const account = useGameAccount();
  const run = useRankedGame("postcard", event ? "event" : "online", idleReducer, () => ({ phase: "intro" }));
  const [phase, setPhase] = useState<"intro" | "edit" | "done">("intro");
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const fullscreen = useGameFullscreen();
  const key = useMemo(() => JSON.stringify(draft), [draft]);
  const count = wordCount(draft.message), valid = validMessage(draft.message);
  const place = places[draft.place];
  const frame = frames.find(f => f.id === draft.frame) || frames[0];
  const artwork = useMemo(() => postcardArtworkUrl(frame), [frame]);
  const locked = run.busy || run.saveStatus === "error";
  useEffect(() => {
    if (phase !== "edit") return;
    const timer = setTimeout(() => { try { localStorage.setItem(storageKey, key); } catch { /* Draft storage is optional. */ } }, 300);
    return () => clearTimeout(timer);
  }, [phase, key]);
  async function start() {
    fullscreen.enter();
    if (!await run.begin()) return;
    let restored = { ...initialDraft };
    try { restored = restoreDraft(localStorage.getItem(storageKey), places.length); } catch { /* Use a fresh draft. */ }
    setDraft({ ...restored, sender: restored.sender || account.player?.display_name || "" }); setPhase("edit");
  }
  async function send() {
    if (!valid || run.busy) return;
    try { localStorage.setItem(storageKey, key); } catch { /* Keep the draft in memory too. */ }
    const saved = run.saveStatus === "error" ? await run.retry() : await run.complete({ ...draft, sender: draft.sender.trim() || account.player!.display_name });
    if (saved) { setPhase("done"); try { localStorage.removeItem(storageKey); } catch { /* Saved on the server. */ } }
  }
  return <main className="post-app" data-phase={phase}><div className="post-wrap">
    <nav className="post-nav"><Link href="/game">← Hộ chiếu Di sản</Link><span>{fullscreen.supported && <button onClick={fullscreen.toggle}>{fullscreen.fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>}</span></nav>
    {phase === "intro" ? <section className="post-intro"><p className="post-kicker">CHẶNG 05 · DẤU TIẾNG NÓI · {event ? "SỰ KIỆN" : "ONLINE"}</p><div className="post-envelope" aria-hidden="true">✉<span>FROM VIETNAM</span></div><h1>Đại sứ <em>di sản</em></h1><p>Một lá thư nhỏ.<br />Mang câu chuyện Việt đi xa.</p><GameInstructions><ol><li>Chọn một điểm đến và khung thiệp bạn yêu thích.</li><li>Viết lời giới thiệu tiếng Anh, từ 1 đến 20 từ, bằng góc nhìn của riêng bạn.</li><li>Gửi thư đến ban tổ chức. Mỗi thư hợp lệ được 100 điểm; điểm cao nhất của game chỉ tính 100 vào tổng.</li></ol></GameInstructions><GameStartStatus run={run} /><button className="post-primary" disabled={run.busy || !run.remaining} onClick={() => void start()}>Viết câu chuyện của tôi →</button><small>Mỗi tài khoản có 3 lượt. Thư được lưu riêng, không đăng công khai.</small></section> : <>
      <header className="post-heading"><div><p className="post-kicker">CHẶNG 05 · KỂ CHUYỆN VIỆT RA THẾ GIỚI</p><h1>{phase === "done" ? "Thư đã được gửi!" : "Lá thư của bạn"}</h1></div><span className="post-step">{phase === "done" ? "✦ ĐÃ GHI NHẬN" : "ẢNH · KHUNG · LỜI NHẮN"}</span></header>
      <div className="post-layout">
        <section className="post-preview" aria-label="Xem trước thư"><div className="post-preview-paper post-live" data-frame={frame.id} style={{ backgroundColor: frame.paper, backgroundImage: `url("${artwork}")`, color: frame.ink, borderColor: frame.accent }}><div className="post-live-top">FROM VIETNAM, WITH HERITAGE <span>GCD 2026</span></div><div className="post-live-photo"><Image src={place.image} alt={place.name} width={1080} height={690} /></div><p className="post-live-slogan" style={{ color: frame.accent }}>VIETNAM ROOTS - GLOBAL MINDS</p><h2>{place.name}</h2><p className="post-live-message">{draft.message || "Your story starts here..."}</p><p className="post-live-sender">{draft.sender ? "From " + draft.sender : "A friend from Vietnam"}</p><small>Photo: {place.author} - {place.license}</small></div><p>FROM VIETNAM, WITH HERITAGE</p></section>
        {phase === "edit" ? <section className="post-editor" aria-label="Viết thư">
          <label className="post-field"><span><b>01</b> Một miền di sản<select disabled={locked} value={draft.place} onChange={e => setDraft(d => ({ ...d, place: Number(e.target.value) }))}>{places.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}</select></span></label>
          <fieldset className="post-frames" disabled={locked}><legend><b>02</b> Một sắc màu của bạn</legend>{frames.map(f => <button key={f.id} type="button" aria-pressed={draft.frame === f.id} onClick={() => setDraft(d => ({ ...d, frame: f.id }))}><i style={{ background: f.paper, borderColor: f.ink, color: f.accent }}>✦</i>{f.name}</button>)}</fieldset>
          <label className="post-field"><span><b>03</b> Một lời giới thiệu</span><textarea disabled={locked} lang="en" maxLength={240} rows={4} value={draft.message} onChange={e => setDraft(d => ({ ...d, message: e.target.value }))} placeholder="What makes this place special to you?" aria-describedby="post-word-count post-writing-tip" aria-invalid={count > MAX_WORDS} /></label>
          <div className="post-word-count" id="post-word-count" data-invalid={count > MAX_WORDS} aria-live="polite">{count}/{MAX_WORDS} từ {count > MAX_WORDS && "· Hãy rút gọn lời thư trước khi gửi."}</div>
          <p id="post-writing-tip" className="post-tip">Viết bằng tiếng Anh: một điều bạn yêu thích, một nét riêng hoặc một lời mời khám phá.</p>
          <label className="post-field">Người gửi<input disabled={locked} maxLength={40} value={draft.sender} onChange={e => setDraft(d => ({ ...d, sender: e.target.value }))} placeholder="Tên hoặc biệt danh của bạn" autoComplete="off" /></label>
          <button className="post-primary" disabled={!valid || run.busy || (run.saveStatus === "error" && !run.canRetry)} onClick={() => void send()}>{run.busy ? "Đang gửi thư…" : run.saveStatus === "error" ? "Thử gửi lại · không tốn thêm lượt" : "Gửi thư →"}</button>
          {run.saveStatus === "error" && !run.canRetry && <button onClick={() => setPhase("intro")}>Mở lượt khác</button>}
          {run.error && <p role="alert">{run.error}</p>}<small className="post-local-note">Thư được gửi riêng đến ban tổ chức. Gửi thành công nhận 100 điểm.</small>
        </section> : <section className="post-done"><h2>Một nét Việt đã được gửi đi.</h2><p>{draft.message}</p><GameResultStatus run={run} /><p>Ban tổ chức đã nhận lá thư của bạn.</p><div className="post-done-actions"><button onClick={() => setPhase("intro")}>Viết một lá thư khác</button><Link className="post-primary" href="/game/leaderboard">Xem bảng xếp hạng ↗</Link></div><Link className="post-back" href="/game">Về hành trình 5 chặng →</Link></section>}
      </div>
    </>}
  </div></main>;
}
