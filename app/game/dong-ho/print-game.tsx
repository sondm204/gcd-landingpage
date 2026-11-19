"use client";

import { Link } from "@/i18n/navigation";
import GameInstructions from "../components/game-instructions";
import { useRankedGame } from "../hooks/use-ranked-game";
import { GameStartStatus, GameResultStatus } from "../components/game-run-status";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { completedLines, fits, initialState, inkForLayers, MAX_LAYERS, previewCells, reducer, shapes, type Piece } from "./engine";
import FolkPrint from "./folk-print";
import { usePrintAudio } from "./use-print-audio";
import { useBackgroundMusic } from "../hooks/use-background-music";
import { useGameFullscreen } from "../hooks/use-game-fullscreen";

function Block({ piece, ink }: { piece: Piece; ink: string }) {
  const cells = shapes[piece.shape];
  const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
  return <svg viewBox={`0 0 ${w * 24} ${h * 24}`} aria-hidden="true">{cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x * 24 + 1} y={y * 24 + 1} width="22" height="22" rx="4" fill={ink} stroke="#fff8" />)}</svg>;
}
export default function PrintGame() {
  const mode = useSearchParams().get("mode") === "event" ? "event" : "online";
  return <Game key={mode} event={mode === "event"} />;
}
function Game({ event }: { event: boolean }) {
  const run = useRankedGame("print", event ? "event" : "online", reducer, initialState);
  const { state, dispatch } = run;
  const [hover, setHover] = useState<{ row: number; col: number; id: number } | null>(null);
  const [drag, setDrag] = useState<{ piece: Piece; x: number; y: number; pitch: number; cell: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ piece: Piece; x: number; y: number; moved: boolean; anchorX: number; anchorY: number } | null>(null);
  const suppressClick = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const audio = usePrintAudio();
  const music = useBackgroundMusic(state.phase === "playing", "/game/audio/dong-ho-background.wav");
  const screen = useGameFullscreen(state.phase === "playing");
  const target = event ? 1 : 2;
  const reached = state.layers >= target;
  const ink = inkForLayers(state.layers);
  const playing = state.phase === "playing";
  const seconds = Math.max(0, Math.ceil((state.end - state.now) / 1000));
  useEffect(() => {
    if (!playing) return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    const timer = window.setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [playing, dispatch]);
  useEffect(() => { if (state.phase !== "playing") titleRef.current?.focus(); }, [state.phase]);
  function spot(x: number, y: number, id: number) {
    const cells = boardRef.current?.querySelectorAll(".print-cell");
    if (!cells?.length) return null;
    const first = cells[0].getBoundingClientRect(), last = cells[63].getBoundingClientRect();
    if (x < first.left || y < first.top || x >= last.right || y >= last.bottom) return null;
    const pitch = cells[1].getBoundingClientRect().left - first.left;
    return { row: Math.floor((y - first.top) / pitch) - (dragRef.current?.anchorY ?? 0), col: Math.floor((x - first.left) / pitch) - (dragRef.current?.anchorX ?? 0), id };
  }
  function liftedPoint(x: number, y: number) {
    const d = dragRef.current;
    const cells = boardRef.current?.querySelectorAll(".print-cell");
    if (!d || !cells?.length) return { x, y };
    const pitch = cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().left;
    const height = Math.max(...shapes[d.piece.shape].map(c => c[1])) + 1;
    // Keep the entire block at least 22px above the finger, regardless of which cell was grabbed.
    return { x, y: y - ((height - d.anchorY) * pitch + 22) };
  }
  function moveDrag(x: number, y: number) {
    const d = dragRef.current;
    const cells = boardRef.current?.querySelectorAll(".print-cell");
    if (!d || !cells?.length) return;
    if (Math.hypot(x - d.x, y - d.y) > 6) d.moved = true;
    if (!d.moved) return;
    const first = cells[0].getBoundingClientRect();
    const pitch = cells[1].getBoundingClientRect().left - first.left;
    const point = liftedPoint(x, y);
    const pos = spot(point.x, point.y, d.piece.id);
    setHover(pos);
    setDrag({ piece: d.piece, pitch, cell: first.width,
      x: pos ? first.left + pos.col * pitch : x - (d.anchorX + .5) * pitch,
      y: pos ? first.top + pos.row * pitch : point.y - (d.anchorY + .5) * pitch });
  }
  function cancelDrag() { dragRef.current = null; setDrag(null); setHover(null); }
  function place(row: number, col: number, id: number, now: number) {
    const action = { type: "place" as const, row, col, id, now };
    const next = reducer(state, action);
    if (next.moves > state.moves) audio.play(next.layers > state.layers);
    dispatch(action);
  }
  const selected = state.pieces.find(p => p.id === (hover?.id ?? state.selected));
  const preview = selected && hover ? previewCells(selected.shape, hover.row, hover.col) : [];
  const valid = Boolean(selected && hover && fits(state.board, selected.shape, hover.row, hover.col));
  const projected = valid ? [...state.board] : null;
  if (projected) preview.forEach(i => { projected[i] = 1; });
  const willClear = projected ? completedLines(projected).cells : [];

  return <MotionConfig reducedMotion="user" transition={reduce ? { duration: 0 } : { duration: .25 }}><main className="print-app" data-phase={state.phase}>
    <div className="print-wrap"><nav className="print-nav"><Link href="/game">← Hộ chiếu Di sản</Link><span className="print-stage-label">CHẶNG 02 · {event ? "SỰ KIỆN" : "ONLINE"}</span>{screen.supported && <button className="print-sound-toggle" aria-label="Chế độ toàn màn hình" aria-pressed={screen.fullscreen} onClick={screen.toggle}>{screen.fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>}{state.phase === "playing" && <button className="print-sound-toggle" aria-label="Nhạc nền" aria-pressed={music.enabled} onClick={music.toggle}>{music.enabled ? "Nhạc: bật" : "Nhạc: tắt"}</button>}</nav>
      {state.phase === "ready" && <section className="print-intro"><p className="print-kicker">SẮC MÀU DÂN GIAN · DẤU ĐÔI MẮT</p><h1 ref={titleRef} tabIndex={-1}>Xếp ván Đông Hồ</h1><FolkPrint layers={MAX_LAYERS} /><h2>Góp một khối. In một lớp màu.</h2><p>Sương Quên đã làm nhạt bức tranh. Xếp những khối mực lên ván để từng lớp màu trở lại.</p><GameInstructions><ol><li>Kéo khối lên bảng 8×8, hoặc chạm chọn khối rồi chạm ô để đặt góc trên trái.</li><li>Lấp đầy một hàng hoặc cột để xóa hàng và in một lớp màu. Khối không xoay, không chồng lên nhau.</li><li>Dùng hết 3 khối để nhận khay mới. Không còn khối đặt được thì lượt chơi kết thúc.</li></ol></GameInstructions><p className="print-rule">{event ? "In 1 lớp để hoàn thành bản sự kiện." : "In 2 lớp để đạt chặng; chơi tiếp đến 20 lớp để mở trọn bức tranh."} Giới hạn 3 phút.</p><GameStartStatus run={run} /><button className="print-primary" disabled={run.busy || !run.remaining} onClick={async () => { music.start(); screen.enter(); if (!await run.begin(seed => ({ type: "start", seed, now: Date.now() }))) music.stop(); }}>Mở ván in →</button><Link className="print-mode" href={`/game/dong-ho?mode=${event ? "online" : "event"}`}>Chuyển sang bản {event ? "online" : "sự kiện"}</Link><small>Điểm được ghi nhận vào tài khoản sau khi kết thúc.</small></section>}
      {state.phase === "playing" && <>
        <header className="print-play-heading"><h1>Xếp ván Đông Hồ</h1><button className="print-sound-toggle" aria-label="Âm thanh trò chơi" aria-pressed={audio.enabled} onClick={() => audio.setEnabled(!audio.enabled)}>{audio.enabled ? "Âm thanh: bật" : "Âm thanh: tắt"}</button><span>{state.score} điểm</span></header>
        <div className="print-mini-art"><FolkPrint layers={state.layers} /><p>{reached ? "✦ Đã đạt chặng!" : `Mục tiêu: ${target} lớp màu`}<small>{state.layers}/20 lớp · giới hạn 3 phút</small></p></div>
        <div className="print-board-area"><div className="print-board" ref={boardRef} role="group" aria-label="Ván in 8 hàng 8 cột" onMouseLeave={() => { if (!dragRef.current) setHover(null); }}>
          {state.board.map((value, i) => <motion.button key={i} className={`print-cell ${willClear.includes(i) ? "preview-clear" : ""} ${preview.includes(i) ? valid ? "preview-ok" : "preview-bad" : ""}`} style={{ backgroundColor: value ? ink : undefined }} animate={state.cleared.includes(i) ? { opacity: [1, .4, 1] } : { opacity: 1 }} transition={{ duration: reduce ? 0 : .4 }} aria-label={`Hàng ${Math.floor(i / 8) + 1}, cột ${i % 8 + 1}${value ? ", đã có mực" : ", trống"}`} onMouseEnter={() => { if (state.selected !== null && !dragRef.current) setHover({ row: Math.floor(i / 8), col: i % 8, id: state.selected }); }} onFocus={() => { if (state.selected !== null) setHover({ row: Math.floor(i / 8), col: i % 8, id: state.selected }); }} onClick={() => { if (state.selected !== null) { place(Math.floor(i / 8), i % 8, state.selected, Date.now()); setHover(null); } }} />)}
        </div></div>
        <p className="print-status" role="status" aria-live="polite">{state.message}</p>
        <div className="print-tray" aria-label="Khay khối mực">{Array.from({ length: 3 }, (_, index) => { const piece = state.pieces.find(p => (p.id - 1) % 3 === index); return piece ? <motion.button key={piece.id} className={piece.id === state.selected ? "selected" : ""} aria-label={`Chọn khối ${index + 1}, ${shapes[piece.shape].length} ô`} aria-pressed={piece.id === state.selected} initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} onClick={e => { const suppress = suppressClick.current && e.detail > 0; suppressClick.current = false; if (!suppress) dispatch({ type: "select", id: piece.id, now: Date.now() }); }}
          onPointerDown={e => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); suppressClick.current = false;
            const svg = e.currentTarget.querySelector("svg")!; const box = svg.getBoundingClientRect();
            const cells = shapes[piece.shape]; const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
            const unit = Math.min(box.width / w, box.height / h);
            const gx = (e.clientX - box.left - (box.width - w * unit) / 2) / unit;
            const gy = (e.clientY - box.top - (box.height - h * unit) / 2) / unit;
            const anchor = [...cells].sort((a,b) => Math.hypot(a[0]+.5-gx,a[1]+.5-gy)-Math.hypot(b[0]+.5-gx,b[1]+.5-gy))[0];
            dragRef.current = { piece, x: e.clientX, y: e.clientY, moved: false, anchorX: anchor[0], anchorY: anchor[1] }; dispatch({ type: "select", id: piece.id, now: Date.now() }); }}
          onPointerMove={e => moveDrag(e.clientX, e.clientY)}
          onPointerUp={e => { const d = dragRef.current; if (d?.moved) { suppressClick.current = true; const point = liftedPoint(e.clientX, e.clientY); const pos = spot(point.x, point.y, d.piece.id); if (pos) place(pos.row, pos.col, pos.id, Date.now()); } cancelDrag(); }} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
          <Block piece={piece} ink={ink} /><small>Khối {index + 1}</small></motion.button> : <div key={`empty-${index}`} className="print-empty-piece" aria-hidden="true" />; })}</div>
        <div className="print-play-actions"><span>+10 điểm/hàng hoặc cột</span><strong className={seconds <= 30 ? "print-timer urgent" : "print-timer"} role="timer" aria-label="Thời gian còn lại">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong>{reached && <button onClick={() => dispatch({ type: "finish", now: Date.now() })}>Chốt kết quả ✓</button>}</div>
        {drag && <div className="print-drag-ghost" style={{ left: drag.x, top: drag.y, width: 4 * drag.pitch, height: 4 * drag.pitch }} aria-hidden="true">{shapes[drag.piece.shape].map(([x,y]) => <span key={x+":"+y} style={{ position: "absolute", left: x * drag.pitch, top: y * drag.pitch, width: drag.cell, height: drag.cell, background: hover && !valid ? "#d98c78" : ink, borderRadius: 3 }} />)}</div>}
      </>}
      {state.phase === "result" && <motion.section className="print-result" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}><p className="print-kicker">{reached ? "DẤU ĐÔI MẮT · ĐÃ KHÁM PHÁ" : "VÁN IN CHỜ BẠN THỬ LẠI"}</p><h1 ref={titleRef} tabIndex={-1}>{state.layers === MAX_LAYERS ? "Sắc màu đã trở về!" : reached ? "Bạn đã đánh thức sắc màu" : "Thêm một khối, thêm một cơ hội"}</h1><FolkPrint layers={state.layers} /><p>{state.message}</p><div className="print-result-stats"><span><b>{state.score}</b>điểm</span><span><b>{state.layers}/20</b>lớp màu</span><span><b>{state.moves}</b>khối đã xếp</span></div><p>{reached ? "Bạn đã đạt mục tiêu của bản chơi này." : `Cần in ${target} lớp để đạt mục tiêu. Thử chừa chỗ cho các khối lớn nhé!`}</p><GameResultStatus run={run} /><button className="print-primary" onClick={() => dispatch({ type: "reset" })}>Chơi lại</button><Link className="print-mode" href="/game">Về hành trình 5 chặng →</Link><small>Kết quả chơi thử, chưa dùng để nhận sticker hay đổi quà.</small></motion.section>}
    </div>
  </main></MotionConfig>;
}
