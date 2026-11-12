"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import ProductArt from "./product-art";
import { initialState, products, reducer, rules, shuffledOrders, type Mode } from "./engine";

export default function CraftShop() {
  const params = useSearchParams();
  const mode = params.get("mode") === "event" ? "event" : "online";
  return <Shop key={mode} mode={mode} />;
}

function Shop({ mode }: { mode: Mode }) {
  const [state, dispatch] = useReducer(reducer, mode, initialState);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const playRef = useRef<HTMLElement>(null);
  const active = state.phase === "playing" || state.phase === "feedback";
  const product = products.find(p => p.id === state.orders[state.index]);
  const selected = products.find(p => p.id === state.selected);
  const last = state.answers.at(-1);
  const correct = state.answers.filter(a => a.correct).length;
  const passed = correct >= rules[mode].target;
  const remaining = Math.max(0, Math.ceil((state.end - state.now) / 1000));

  useEffect(() => {
    if (!active || mode !== "online") return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    tick();
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [active, mode]);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    if (state.phase === "playing") playRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    if (state.phase === "result" || state.phase === "ready") window.scrollTo({ top: 0, behavior: "instant" });
  }, [state.phase]);

  return <main className="craft-app" data-active={active}>
    <div className="craft-wrap">
      <nav className="craft-nav" aria-label="Điều hướng trò chơi"><Link href="/game">← Hộ chiếu Di sản</Link><span>CHẶNG 01 / 05</span></nav>
      <header className="craft-heading"><p>LÀNG NGHỀ HÀ NỘI · DẤU ĐÔI TAY</p><h1>Tiệm Bách nghệ</h1><span className="craft-badge">Bản chơi thử · {mode === "online" ? "Online" : "Tại sự kiện"}</span></header>

      {state.phase === "ready" && <section className="craft-intro">
        <div className="craft-sign">TINH HOA TỪ ĐÔI TAY VIỆT</div>
        <div className="craft-display" aria-hidden="true"><ProductArt id="basket" /><ProductArt id="pot" /><ProductArt id="fan" /></div>
        <div className="craft-intro-copy"><p className="craft-eyebrow">CHÚ TỄU NHẮN BẠN</p><h2 ref={titleRef} tabIndex={-1}>Hôm nay, bạn làm chủ tiệm!</h2><p>Sương Quên đã làm nhòe ký ức làng nghề. Hãy tìm đúng món đồ khách cần để đánh thức dấu ấn Đôi tay.</p>
          <div className="craft-rules"><span><b>{rules[mode].count}</b> đơn hàng</span><span><b>{mode === "online" ? "60 giây" : "Thong thả"}</b>{mode === "online" ? "mỗi lượt" : "không đồng hồ"}</span><span><b>{rules[mode].target} đơn đúng</b>để vượt chặng</span></div>
          <ol><li>Đọc tên làng nghề khách muốn tìm.</li><li>Chạm vào sản phẩm trên kệ, rồi bấm <b>Giao hàng</b>.</li><li>Giao đúng liên tiếp để tăng combo và điểm.</li></ol>
          <p className="craft-note">{mode === "online" ? "Khách chờ 12 giây. Giao sai hoặc hết thời gian chờ sẽ mất đơn và ngắt combo. Đồng hồ vẫn chạy khi bạn rời tab." : "Bản sự kiện chơi thử: giao đúng cả 3 đơn để hoàn thành, chưa áp dụng giới hạn thời gian."}</p>
          <button className="craft-primary" onClick={() => dispatch({ type: "start", orders: shuffledOrders(mode), now: Date.now() })}>Mở cửa tiệm →</button>
          <Link className="craft-mode-link" href={`/game/craft-shop?mode=${mode === "online" ? "event" : "online"}`}>Chuyển sang {mode === "online" ? "bản sự kiện" : "bản online"}</Link>
        </div>
      </section>}

      {active && <>
        <section ref={playRef} className="craft-stats" aria-label="Tiến trình lượt chơi"><div><span>ĐƠN HÀNG</span><b>{state.index + 1}<small> / {rules[mode].count}</small></b></div><div><span>ĐIỂM</span><b>{state.score}</b></div><div><span>COMBO</span><b>×{state.combo ? 1 + (state.combo - 1) * .5 : 1}</b></div><div className={remaining <= 10 && mode === "online" ? "craft-urgent" : ""}><span>THỜI GIAN</span><b role="timer" aria-label="Thời gian còn lại">{mode === "online" ? `${remaining}s` : "∞"}</b></div></section>
        <section className="craft-counter">
          <div className="craft-awning" aria-hidden="true" />
          <div className="craft-customer"><div className="craft-avatar" aria-hidden="true">{["👩🏻", "👨🏻", "👩🏻‍🦱", "👨🏻‍🦳", "👩🏻‍🦳"][state.index]}</div><div><p>KHÁCH HÀNG {state.index + 1}</p><h2 ref={titleRef} tabIndex={-1}>“Cho tôi một món đồ của <strong>{product?.village}</strong> nhé!”</h2></div></div>
          {mode === "online" && <div className="craft-patience"><div><span>Thời gian khách chờ</span><span>{Math.max(0, Math.ceil((state.customerEnd - state.now) / 1000))}s</span></div><progress aria-label="Sự kiên nhẫn của khách" max={12000} value={Math.max(0, state.customerEnd - state.now)} /></div>}
          {state.phase === "feedback" && <div className={`craft-feedback ${last?.correct ? "craft-correct" : "craft-wrong"}`} role="status"><b>{last?.correct ? `Giao đúng rồi! +${last.points} điểm` : last?.selected ? "Chưa đúng món khách cần." : "Khách đã hết thời gian chờ."}</b><p>{product?.village} gắn với {product?.name.toLowerCase()}. {product?.hint}</p><button className="craft-primary" onClick={() => dispatch({ type: "next", now: Date.now() })}>Đón khách tiếp theo →</button></div>}
        </section>
        <section className="craft-shelf" aria-label="Kệ sản phẩm"><div className="craft-shelf-heading"><h2>Chọn món trên kệ</h2><span>CHẠM ĐỂ CHỌN</span></div><div className="craft-products">{products.map(p => <button key={p.id} disabled={state.phase !== "playing"} aria-pressed={state.selected === p.id} onClick={() => dispatch({ type: "select", id: p.id })} className="craft-product" style={{ "--product-color": p.color } as React.CSSProperties}><ProductArt id={p.id} /><span>{p.name}</span><span className="craft-check" aria-hidden="true">{state.selected === p.id ? "✓" : "+"}</span></button>)}</div></section>
        {state.phase === "playing" && <div className="craft-delivery"><p aria-live="polite">{selected ? <>Đã chọn: <b>{selected.name}</b></> : "Chọn một món đồ để giao cho khách."}</p><button className="craft-primary" disabled={!state.selected} onClick={() => dispatch({ type: "deliver", now: Date.now() })}>Giao hàng →</button></div>}
      </>}

      {state.phase === "result" && <section className="craft-result"><div className="craft-result-seal" aria-hidden="true">{passed ? "✧" : "↻"}</div><p className="craft-eyebrow">{passed ? "DẤU ĐÔI TAY · ĐÃ KHÁM PHÁ" : "THÊM MỘT LẦN THỬ NHÉ"}</p><h2 ref={titleRef} tabIndex={-1}>{passed ? "Đôi tay giữ hồn di sản" : "Tiệm vẫn chờ bạn trở lại"}</h2><p>{passed ? "Bạn đã tìm lại một mảnh ghép bản sắc. Những làng nghề tiếp tục sống qua từng món đồ được trao đi." : `Cần ${rules[mode].target} đơn đúng để vượt chặng. Ghi nhớ các làng nghề rồi cùng Chú Tễu thử lại nhé!`}</p><div className="craft-result-stats"><span><b>{state.score}</b>điểm</span><span><b>{correct}/{rules[mode].count}</b>đơn đúng</span></div><ul className="craft-review">{state.orders.map((id, i) => { const p = products.find(item => item.id === id)!; const a = state.answers[i]; return <li key={i}><span aria-label={a?.correct ? "Đúng" : "Chưa đúng"}>{a?.correct ? "✓" : "−"}</span><div><b>{p.village}</b><small>{p.name}{!a ? " · Chưa giao" : !a.selected ? " · Hết giờ chờ" : !a.correct ? " · Giao sai" : ""}</small></div><strong>+{a?.points ?? 0}</strong></li>; })}</ul><p className="craft-note">Kết quả chơi thử trên thiết bị này, chưa lưu vào hộ chiếu và chưa dùng để nhận sticker hoặc đổi quà.</p><button className="craft-primary" onClick={() => dispatch({ type: "reset" })}>Chơi lại</button><Link className="craft-mode-link" href="/game">Về hành trình 5 chặng →</Link></section>}
      <details className="craft-info"><summary>Về bản chơi thử</summary><p>Bộ sản phẩm, thời gian chờ và thang điểm đang dùng để thử nghiệm. Đơn đúng đầu tiên được 20 điểm; mỗi đơn đúng liên tiếp thêm 10 điểm, tối đa 60 điểm/đơn. Giao sai mất combo. Lượt online hoàn hảo đạt 200 điểm. Chưa kết nối tài khoản hay bảng xếp hạng.</p><a href="https://vietnamtourism.gov.vn/en/printer/20688?type=1" target="_blank" rel="noreferrer">Tìm hiểu làng nghề Hà Nội ↗</a></details>
    </div>
  </main>;
}
