"use client";
import Link from "next/link";
import GameInstructions from "../components/game-instructions";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DURATION, GOOD, MAX_SCORE, pointsForNextNote, noteIsVisible, beatInterval, initialState, notes, reducer, travelTime } from "./engine";
import { useRhythmAudio } from "./use-rhythm-audio";
import { useGameFullscreen } from "../hooks/use-game-fullscreen";

const keys = ["D", "F", "J", "K"];
const names = ["Trống", "Phách", "Đàn", "Sáo"];
export default function RhythmGame() {
  const mode = useSearchParams().get("mode") === "event" ? "event" : "online";
  return <Game key={mode} event={mode === "event"} />;
}
function Game({ event }: { event: boolean }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const audio = useRhythmAudio(); const screen = useGameFullscreen(state.phase === "playing" || state.phase === "paused");
  const [error, setError] = useState(""); const [starting, setStarting] = useState(false);
  const latest = useRef({ audio, phase: state.phase });
  const inputs = useRef(keys.map(() => new Set<string>()));
  useEffect(() => { latest.current = { audio, phase: state.phase }; });
  const title = useRef<HTMLHeadingElement>(null);
  const hits = state.judgments.filter(v => v === "perfect" || v === "good").length;
  const playing = state.phase === "playing";
  const countdown = Math.ceil(-state.elapsed / 1000);
  const travel = travelTime(state.elapsed);
  const nextNote = notes.find(note => state.judgments[note.id] === null);
  const down = useCallback((lane: number, source: string) => {
    if (latest.current.phase !== "playing" || latest.current.audio.elapsed() < 0 || inputs.current[lane].has(source)) return;
    const first = inputs.current[lane].size === 0;
    inputs.current[lane].add(source);
    if (first) dispatch({ type: "hit", lane, elapsed: latest.current.audio.elapsed() });
  }, []);
  const up = useCallback((lane: number, source: string) => {
    if (!inputs.current[lane].delete(source) || inputs.current[lane].size > 0 || latest.current.phase !== "playing") return;
    dispatch({ type: "release", lane, elapsed: latest.current.audio.elapsed() });
  }, []);
  async function start() {
    setError(""); setStarting(true);
    try { screen.enter(); if (await audio.start()) dispatch({ type: "start" }); }
    catch { audio.stop(); setError("Chưa thể mở âm thanh. Hãy cho phép âm thanh trên trình duyệt rồi thử lại."); }
    finally { setStarting(false); }
  }
  async function pause() {
    if (state.phase !== "playing") return;
    dispatch({ type: "tick", elapsed: audio.elapsed() }); dispatch({ type: "pause" });
    await audio.pause().catch(() => {});
  }
  async function resume() {
    try { await audio.resume(); dispatch({ type: "resume" }); setError(""); }
    catch { setError("Chạm tiếp tục để bật lại âm thanh."); }
  }
  useEffect(() => {
    if (state.phase !== "playing") inputs.current.forEach(sources => sources.clear());
  }, [state.phase]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => { dispatch({ type: "tick", elapsed: latest.current.audio.elapsed() }); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    const hide = () => { if (document.hidden) { dispatch({ type: "tick", elapsed: latest.current.audio.elapsed() }); dispatch({ type: "pause" }); void latest.current.audio.pause().catch(() => {}); } };
    const blur = () => { dispatch({ type: "tick", elapsed: latest.current.audio.elapsed() }); dispatch({ type: "pause" }); void latest.current.audio.pause().catch(() => {}); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", blur);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", hide); window.removeEventListener("blur", blur); };
  }, [playing]);
  useEffect(() => {
    if (state.phase === "result") { latest.current.audio.stop(); title.current?.focus(); }
  }, [state.phase]);
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      const lane = keys.indexOf(e.key.toUpperCase());
      if (lane < 0 || e.repeat || e.ctrlKey || e.altKey || e.metaKey || latest.current.phase !== "playing" || (e.target as HTMLElement).closest("input,textarea,select,[contenteditable=true]")) return;
      e.preventDefault(); down(lane, `key:${lane}`);
    };
    const release = (e: KeyboardEvent) => {
      const lane = keys.indexOf(e.key.toUpperCase());
      if (lane >= 0) up(lane, `key:${lane}`);
    };
    document.addEventListener("keydown", press); document.addEventListener("keyup", release);
    return () => { document.removeEventListener("keydown", press); document.removeEventListener("keyup", release); };
  }, [down, up]);

  return <main className="rhythm-app" data-active={playing || state.phase === "paused"}><div className="rhythm-wrap">
    <nav className="rhythm-nav"><Link href="/game">← Hộ chiếu Di sản</Link><div>{screen.supported && <button onClick={screen.toggle}>{screen.fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>}<button onClick={audio.toggle} aria-label="Âm thanh" aria-pressed={!audio.muted}>{audio.muted ? "Âm: tắt" : "Âm: bật"}</button></div></nav>
    {state.phase === "ready" && <section className="rhythm-intro">
      <p className="rhythm-kicker">CHẶNG 03 · DẤU ĐÔI TAI · {event ? "SỰ KIỆN" : "ONLINE"}</p>
      <h1 ref={title} tabIndex={-1}>Bắt nhịp di sản</h1>
      <div className="rhythm-disc" aria-hidden="true"><span>♪</span></div>
      <h2>Lắng nghe. Chạm đúng. Giữ nhịp.</h2>
      <p>Những âm thanh đang tìm đường trở về. Để đôi tai dẫn lối, theo nhịp phách và thắp sáng từng làn âm sắc.</p>
      <div className="rhythm-rules"><span><b>60 giây</b>nhanh dần về cuối</span><span><b>4 làn</b>D · F · J · K</span><span><b>{MAX_SCORE}</b>điểm tối đa</span></div>
      <GameInstructions><ol>
        <li>Chờ đếm ngược 3 nhịp. Nốt vừa xuất hiện là có thể bấm nút cùng làn, hoặc dùng phím D–F–J–K. Không cần căn vạch.</li>
        <li>Bấm theo số thứ tự, bắt đầu từ nốt được viền sáng. Với nốt dài, thời gian giữ bắt đầu ngay khi bấm: giữ đến khi thanh tiến độ đầy rồi mới bấm nốt tiếp theo. Thả sớm hoặc bấm vượt thứ tự sẽ ngắt chuỗi.</li>
        <li>Tối đa {MAX_SCORE} điểm. Mỗi nốt đúng nối dài chuỗi và tăng điểm cho nốt tiếp theo. Hụt, thả sớm hoặc bấm sai sẽ ngắt chuỗi, trừ nửa giá trị nốt cơ bản. Điểm thấp nhất là 0.</li>
      </ol>
      <p className="rhythm-note">Nhạc nền ngũ cung nguyên bản với giai điệu, hợp âm và nhịp gõ tăng tốc cùng màn chơi; chưa phải bản thu Quan họ, Ca trù, Chèo hay Xẩm. Game tự tạm dừng khi rời tab.</p></GameInstructions>
      <button className="rhythm-primary" disabled={starting} onClick={() => void start()}>{starting ? "Đang mở âm thanh…" : "Lên sân khấu →"}</button>
      <p className="rhythm-error" role="alert">{error}</p>
      <Link className="rhythm-mode" href={`/game/rhythm?mode=${event ? "online" : "event"}`}>Chuyển sang bản {event ? "online" : "sự kiện"}</Link>
    </section>}
    {(playing || state.phase === "paused") && <>
      <header className="rhythm-heading"><h1>Bắt nhịp di sản</h1><button onClick={() => void pause()} disabled={!playing}>Tạm dừng</button></header>
      <div className="rhythm-stats"><span><small>ĐIỂM</small><b>{state.score}</b></span><span><small>CHUỖI ĐÚNG</small><b>×{state.combo}</b></span><span><small>NỐT ĐÚNG</small><b>{hits}/{notes.length}</b></span><span><small>CÒN LẠI</small><b role="timer">{Math.ceil((DURATION - Math.max(0, state.elapsed)) / 1000)}s</b></span></div>
      <div className="rhythm-feedback" aria-live="off"><b key={state.feedbackId} className={state.feedback.startsWith("Tuyệt") ? "perfect" : state.feedback.startsWith("Được") ? "good" : ""}>{state.elapsed < 0 ? "Theo nhịp đếm rồi bắt đầu nhé" : state.feedback}</b><small>Tối đa {MAX_SCORE} điểm · {Math.round(60000 / beatInterval(state.elapsed))} BPM · Nốt tiếp +{pointsForNextNote(state.combo).toFixed(2)}đ</small></div>
      <section className="rhythm-stage" aria-label="Sân khấu bốn làn" data-elapsed={Math.round(state.elapsed)}>
        <div className="rhythm-lanes" aria-hidden="true">{keys.map((key, lane) => <div key={key} className="rhythm-lane" data-lane={lane}>
          {notes.filter(n => n.lane === lane && state.judgments[n.id] === null && (state.holds[lane]?.noteId === n.id || noteIsVisible(n, state.elapsed))).map(n => {
            const hold = state.holds[lane]?.noteId === n.id ? state.holds[lane] : null;
            const holding = Boolean(hold);
            const progress = hold ? Math.min(1, Math.max(0, (state.elapsed - hold.startedAt) / n.duration)) : 0;
            const scale = (hold ? travelTime(hold.startedAt) : travel) + GOOD;
            const headTop = 100 - (n.at + GOOD - (hold?.startedAt ?? state.elapsed)) / scale * 100;
            const tailHeight = n.duration / scale * 100 * (1 - progress);
            return <div className="rhythm-falling-note" key={n.id} data-note-id={n.id} data-next={nextNote?.id === n.id} data-holding={holding}>
              {n.duration > 0 && <div className="rhythm-note-tail" style={{ top: `${headTop - tailHeight}%`, height: `${tailHeight}%` }} />}
              <div className="rhythm-note-block" data-long={n.duration > 0} style={{ top: `${headTop}%` }}><span>{hold ? `GIỮ ${Math.max(0, (hold.endAt - state.elapsed) / 1000).toFixed(1)}s` : `#${n.id + 1}${n.duration ? " · GIỮ" : ""}`}</span>{hold && <i className="rhythm-hold-progress" style={{ transform: `scaleX(${progress})` }} />}</div>
            </div>;
          })}
          {state.lastLane === lane && <span key={state.feedbackId} className="rhythm-hit-flash" />}
        </div>)}</div>
        {state.elapsed < 0 && <div className="rhythm-countdown" aria-live="polite"><b>{countdown}</b><span>Sẵn sàng vào nhịp</span></div>}
      </section>
      <div className="rhythm-pads" role="group" aria-label="Chạm nhịp theo làn">{keys.map((key, lane) => <button key={key} aria-label={`Làn ${lane + 1}: ${names[lane]}, phím ${key}`} aria-pressed={state.pressed[lane]} data-holding={Boolean(state.holds[lane]) && state.pressed[lane]} data-next={nextNote?.lane === lane && noteIsVisible(nextNote, state.elapsed)}
        onPointerDown={e => { if (e.button !== 0 || !playing) return; e.preventDefault(); e.currentTarget.blur(); e.currentTarget.setPointerCapture(e.pointerId); down(lane, `pointer:${e.pointerId}`); }}
        onPointerUp={e => up(lane, `pointer:${e.pointerId}`)} onPointerCancel={e => up(lane, `pointer:${e.pointerId}`)} onLostPointerCapture={e => up(lane, `pointer:${e.pointerId}`)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!e.repeat) down(lane, `pad:${e.key}`); } }}
        onKeyUp={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); up(lane, `pad:${e.key}`); } }}
        onBlur={() => { up(lane, "pad:Enter"); up(lane, "pad: "); }}
        onClick={e => { if (e.detail === 0) { down(lane, "assistive"); up(lane, "assistive"); } }}><b>{["◆", "●", "✦", "♪"][lane]}</b><span>{state.holds[lane] && state.pressed[lane] ? "ĐANG GIỮ" : names[lane]}</span><kbd>{key}</kbd></button>)}</div>
      <p className="rhythm-bottom-note">Bấm nốt sáng theo thứ tự · Xuất hiện là bấm được · Nốt có đuôi: giữ</p>
      {state.phase === "paused" && <div className="rhythm-pause" role="dialog" aria-modal="true" aria-label="Game đã tạm dừng"><div><h2>Giữ lại nhịp này</h2><p>Nhạc và nốt đã tạm dừng. Sẵn sàng rồi tiếp tục nhé!</p>{state.holds.some(Boolean) && <p>Nốt dài đang dở: nhấn giữ lại làn đó ngay sau khi tiếp tục (trong 0,75 giây).</p>}<button className="rhythm-primary" autoFocus onClick={() => void resume()}>Tiếp tục →</button><p role="alert">{error}</p><Link href="/game">Về hành trình</Link></div></div>}
    </>}
    {state.phase === "result" && <section className="rhythm-result"><p className="rhythm-kicker">KẾT THÚC LƯỢT CHƠI</p><h1 ref={title} tabIndex={-1}>Giai điệu của bạn</h1><div className="rhythm-result-score">{state.score}<small>/ {MAX_SCORE} điểm</small></div><p>{hits}/{notes.length} nốt đúng · {Math.round(hits / notes.length * 100)}%</p><div className="rhythm-results-grid"><span><b>{hits}</b>Đúng</span><span><b>{state.wrong}</b>Sai thứ tự</span><span><b>{notes.length - hits}</b>Trượt</span><span><b>{state.maxCombo}</b>Chuỗi dài nhất</span></div><p>Bấm sai thứ tự: {state.wrong} lần. Tiếp tục luyện tập để nối dài chuỗi đúng nhé!</p><button className="rhythm-primary" onClick={() => dispatch({ type: "reset" })}>Chơi lại</button><Link className="rhythm-mode" href="/game">Về hành trình 5 chặng →</Link><small className="rhythm-note">Kết quả bản chơi thử chưa lưu vào hộ chiếu, chưa dùng nhận sticker hay đổi quà.</small></section>}
  </div></main>;
}
