"use client";
import Image from "next/image";
import Link from "next/link";
import GameInstructions from "../components/game-instructions";
import { useRankedGame } from "../hooks/use-ranked-game";
import { GameStartStatus, GameResultStatus } from "../components/game-run-status";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CLOSE_KM, MAX_SCORE, ROUND_COUNT, requiredClose, initialState, places, reducer, type Result } from "./engine";
import VietnamMap from "./vietnam-map";
import { useGameFullscreen } from "../hooks/use-game-fullscreen";
import { useBackgroundMusic } from "../hooks/use-background-music";

function distanceLabel(result: Result) { return result.distance === null ? "Chưa đặt ghim" : `${result.distance < 1 ? "<1" : Math.round(result.distance).toLocaleString("vi-VN")} km`; }
function Photo({ place, round, revealed, onLoad }: { place: (typeof places)[number]; round: number; revealed: boolean; onLoad: () => void }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <figure className="place-photo">
    <Image key={attempt} src={`${place.image}${attempt ? `?retry=${attempt}` : ""}`} alt={revealed ? place.name : `Ảnh di sản cần xác định, câu ${round + 1}`} fill unoptimized sizes="(max-width: 700px) 100vw, 45vw" loading="eager" onLoad={onLoad} onError={() => setFailed(true)} />
    <span className="place-photo-number">KHUNG HÌNH {String(round + 1).padStart(2, "0")}</span>
    <figcaption>© {place.author} · <a href={place.licenseUrl} target="_blank" rel="noreferrer">{place.license}</a></figcaption>
    {failed && <div className="place-photo-error" role="alert"><p>Chưa tải được ảnh. Đồng hồ chưa bắt đầu.</p><button onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Tải lại ảnh</button></div>}
  </figure>;
}
function Pause({ onResume }: { onResume: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const current = dialog.current; current?.showModal(); return () => current?.close(); }, []);
  return <dialog className="place-pause" ref={dialog} aria-labelledby="place-pause-title" onCancel={e => { e.preventDefault(); onResume(); }}><h2 id="place-pause-title">Nghỉ chân một chút</h2><p>Ghim và thời gian của bạn đã được giữ lại.</p><button className="place-primary" autoFocus onClick={onResume}>Tiếp tục khám phá →</button><Link href="/game">Về Hộ chiếu Di sản</Link></dialog>;
}
export default function PlaceGame() {
  const event = useSearchParams().get("mode") === "event";
  return <Game key={String(event)} event={event} />;
}
function Game({ event }: { event: boolean }) {
  const run = useRankedGame("place", event ? "event" : "online", reducer, () => initialState(event));
  const { state, dispatch } = run;
  const fullscreen = useGameFullscreen(["playing", "loading", "review", "paused"].includes(state.phase));
  const music = useBackgroundMusic(!["ready", "result", "paused"].includes(state.phase), "/game/audio/place-background.wav");
  const heading = useRef<HTMLHeadingElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const playing = state.phase === "playing";
  const board = ["playing", "loading", "paused", "review"].includes(state.phase);
  const review = state.phase === "review";
  const current = places[state.order[state.round] ?? 0];
  const result = state.results[state.round];
  const score = state.results.reduce((sum, r) => sum + r.score, 0);
  const close = state.results.filter(r => r.close).length;
  const target = requiredClose(event);
  const passed = close >= target;
  const seconds = state.phase === "paused" ? Math.ceil(state.remaining / 1000) : Math.max(0, Math.ceil((state.deadline - state.now) / 1000));
  useEffect(() => {
    if (!playing) return;
    const tick = () => dispatch({ type: "tick", now: performance.now() });
    const hide = () => { if (document.hidden) dispatch({ type: "pause", now: performance.now() }); };
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", hide);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", hide); };
  }, [playing, dispatch]);
  useEffect(() => {
    if (state.phase === "review") reviewHeading.current?.focus();
    if (state.phase === "ready" || state.phase === "result") heading.current?.focus();
  }, [state.phase]);
  async function start() {
    fullscreen.enter(); music.start();
    if (!await run.begin(seed => ({ type: "start", seed }))) music.stop();
  }
  return <main className="place-app" data-phase={state.phase} data-active={board}><div className="place-wrap">
    <nav className="place-nav"><Link href="/game">← Hộ chiếu Di sản</Link><div>{fullscreen.supported && <button onClick={fullscreen.toggle}>{fullscreen.fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>}<button aria-label="Nhạc nền" aria-pressed={music.enabled} onClick={music.toggle}>{music.enabled ? "Nhạc: bật" : "Nhạc: tắt"}</button></div></nav>
    {state.phase === "ready" && <section className="place-intro">
      <p className="place-kicker">CHẶNG 04 · DẤU ĐÔI CHÂN · {event ? "SỰ KIỆN" : "ONLINE"}</p>
      <div className="place-intro-compass" aria-hidden="true"><span>N</span><b>✧</b><i>VIỆT NAM</i></div>
      <h1 ref={heading} tabIndex={-1}>Đây là <em>đâu?</em></h1><p className="place-intro-lead">Một khung hình. Một điểm đến.<br />Bạn nhận ra bao nhiêu điều thân thuộc?</p>
      <div className="place-rule-cards"><span><b>{ROUND_COUNT}</b>khung hình</span><span><b>20s</b>cho mỗi ảnh</span><span><b>&lt;100 km</b>để ghim gần</span></div>
      <GameInstructions><ol><li>Mỗi lượt chọn ngẫu nhiên {ROUND_COUNT} trong {places.length} địa điểm, không trùng ảnh. Nhìn ảnh không kèm tên, tìm vị trí trên bản đồ Việt Nam.</li><li>Chạm để đặt ghim. Dùng + / − để phóng to, kéo bản đồ để dịch chuyển; có thể sửa ghim trước khi chốt.</li><li>Chọn “Chốt vị trí” khi đã sẵn sàng. Hết giờ sẽ tự chốt ghim hiện tại; chưa đặt ghim được 0 điểm.</li></ol></GameInstructions>
      <p className="place-goal">Ghim gần ít nhất <b>{target}/{ROUND_COUNT} ảnh</b> để đạt chặng. Mỗi ảnh tối đa {MAX_SCORE} điểm; càng gần, điểm càng cao.</p>
      <GameStartStatus run={run} /><button className="place-primary" disabled={run.busy || !run.remaining} onClick={start}>Lên đường khám phá →</button>
      <Link className="place-mode" href={`/game/place?mode=${event ? "online" : "event"}`}>Chuyển sang bản {event ? "online" : "sự kiện"}</Link>
      <small className="place-trial">Bản chơi thử · Điểm được ghi nhận vào tài khoản sau khi kết thúc.</small>
    </section>}
    {board && <>
      <header className="place-heading"><h1>Đây là đâu?</h1><span>CHẶNG 04 · {event ? "SỰ KIỆN" : "ONLINE"}</span>{playing && <button onClick={() => dispatch({ type: "pause", now: performance.now() })}>Tạm dừng</button>}</header>
      <div className="place-hud"><span>KHUNG HÌNH <b>{state.round + 1} / {state.order.length}</b></span><span>ĐIỂM <b>{score}</b></span><span data-urgent={seconds <= 5 && playing}>{review ? "GHIM GẦN" : "CÒN LẠI"}<b role={review ? undefined : "timer"}>{review ? `${close} / ${target}` : state.phase === "loading" ? "20s" : `${seconds}s`}</b></span></div>
      <div className="place-layout">
        <div className="place-photo-column">
          <Photo key={current.id} place={current} round={state.round} revealed={review} onLoad={() => dispatch({ type: "loaded", now: performance.now() })} />
          {review && result ? <article className="place-answer-info">
            <p className="place-kicker">{result.timedOut ? "HẾT GIỜ · " : ""}{result.close ? "BẠN ĐÃ TÌM RẤT GẦN" : "THÊM MỘT ĐIỂM ĐẾN ĐỂ NHỚ"}</p>
            <h2 ref={reviewHeading} tabIndex={-1}>{current.name}</h2><div className="place-distance"><b>{distanceLabel(result)}</b><span>+{result.score} điểm</span></div>
            <details><summary>Câu chuyện & nguồn ảnh</summary><p>{current.fact}</p><p>Ảnh: {current.author} · <a href={current.licenseUrl} target="_blank" rel="noreferrer">{current.license}</a> · Thu nhỏ, chuyển WebP.</p><p><a href={current.heritage} target="_blank" rel="noreferrer">Khám phá điểm đến ↗</a> · <a href={current.source} target="_blank" rel="noreferrer">Nguồn ảnh ↗</a></p></details>
          </article> : <p className="place-photo-hint">{state.phase === "loading" ? "Đang mở khung hình… Đồng hồ bắt đầu khi ảnh tải xong." : "Nhìn những chi tiết quen thuộc. Đây là miền di sản nào?"}</p>}
        </div>
        <div className="place-map-column"><VietnamMap key={state.round} pin={state.pin} answer={review ? current.point : undefined} disabled={!playing} onPick={point => dispatch({ type: "pin", point, now: performance.now() })} />
          <p className="place-map-help">{review ? "Ghim xanh: vị trí đúng · Ghim đỏ: bạn chọn · Vòng xanh: 100 km" : "Chạm để ghim · Kéo một ngón để di chuyển · Chụm/tách hai ngón để zoom"}</p>
        </div>
      </div>
      <div className="place-bottom"><p aria-live="polite">{review ? result?.guess ? "Khoảng cách tính theo đường chim bay." : "Bạn chưa đặt ghim ở khung hình này." : state.pin ? `${state.pin.lat.toFixed(2)}°B · ${state.pin.lon.toFixed(2)}°Đ · Có thể chọn lại` : "Chọn một điểm trên bản đồ để bắt đầu"}</p>
        {review ? <button className="place-primary" onClick={() => dispatch({ type: "next" })}>{state.round + 1 === state.order.length ? "Xem kết quả hành trình →" : "Khung hình tiếp theo →"}</button> : <button className="place-primary" disabled={!state.pin || !playing} onClick={() => dispatch({ type: "submit", now: performance.now() })}>Chốt vị trí →</button>}
      </div>
      {state.phase === "paused" && <Pause onResume={() => dispatch({ type: "resume", now: performance.now() })} />}
    </>}
    {state.phase === "result" && <section className="place-result">
      <p className="place-kicker">{passed ? "DẤU ĐÔI CHÂN · ĐÃ KHÁM PHÁ" : "MỖI CHUYẾN ĐI, THÊM MỘT ĐIỀU ĐỂ NHỚ"}</p>
      <h1 ref={heading} tabIndex={-1}>{passed ? "Bạn đã tìm về đúng nơi!" : "Việt Nam vẫn chờ bạn khám phá"}</h1>
      <div className="place-result-score">{score}<small>/ {state.order.length * MAX_SCORE} điểm</small></div><p>{close}/{state.order.length} ảnh ghim lệch dưới {CLOSE_KM} km · Mục tiêu {target} ảnh</p>
      <ol className="place-result-list">{state.results.map((r, i) => <li key={r.place}><Image src={places[r.place].image} alt="" width={88} height={64} unoptimized /><div><small>KHUNG HÌNH {String(i + 1).padStart(2, "0")} · {r.close ? "GHIM GẦN" : r.timedOut ? "HẾT GIỜ" : "CẦN GẦN HƠN"}</small><h2>{places[r.place].name}</h2><p>{distanceLabel(r)} · {r.score} điểm</p></div></li>)}</ol>
      <GameResultStatus run={run} /><button className="place-primary" onClick={() => dispatch({ type: "reset" })}>Khám phá lần nữa</button><Link className="place-mode" href="/game">Về hành trình 5 chặng →</Link><small className="place-trial">Điểm được ghi nhận vào tài khoản sau khi kết thúc.</small>
    </section>}
  </div></main>;
}
