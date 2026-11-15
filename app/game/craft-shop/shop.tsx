"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import ProductArt from "./product-art";
import { initialState, MAX_TRAY, products, reducer, rules, shuffledOrders, type Mode } from "./engine";

export default function CraftShop() {
  const params = useSearchParams();
  const mode = params.get("mode") === "event" ? "event" : "online";
  const reduceMotion = useReducedMotion();
  return <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 28 }}><Shop key={mode} mode={mode} /></MotionConfig>;
}

function Face({ angry, variant }: { angry: boolean; variant: number }) {
  return <svg className="craft-person" viewBox="0 0 100 108" fill="none" aria-hidden="true">
    <path d="M12 108V92c0-25 76-25 76 0v16" fill={["#386889", "#4d8061", "#b34839"][variant]} />
    <circle cx="50" cy="40" r="27" fill={["#dcaa8d", "#d4b88f", "#e7bd9f"][variant]} />
    <path d="M24 33C18 2 80 1 77 34L65 23 48 26 37 21Z" fill={["#35445b", "#554636", "#342d38"][variant]} />
    <circle cx="40" cy="41" r="2" fill="#40372e" /><circle cx="60" cy="41" r="2" fill="#40372e" />
    <path d={angry ? "m34 32 12 5m20-5-12 5M40 57q10-10 20 0" : "M35 32h10m10 0h10M40 53q10 12 20 0"} stroke="#40372e" strokeWidth="2.5" strokeLinecap="round" />
    {angry && <path d="M84 28v-8h8m-8-4v-8m4 12h8" stroke="#ba3c30" strokeWidth="3" strokeLinecap="round" />}
  </svg>;
}

function Shop({ mode }: { mode: Mode }) {
  const [state, dispatch] = useReducer(reducer, mode, initialState);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const playRef = useRef<HTMLElement>(null);
  const active = state.phase === "playing";
  const correct = state.answers.filter(a => a.correct).length;
  const leftCustomers = state.answers.filter(a => a.points === -10).length;
  const remaining = Math.max(0, Math.ceil((state.end - state.now) / 1000));

  useEffect(() => {
    if (!active) return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [active]);
  useEffect(() => {
    if (state.phase === "playing") playRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    else { window.scrollTo({ top: 0, behavior: "instant" }); titleRef.current?.focus({ preventScroll: true }); }
  }, [state.phase]);

  return <main className="craft-app" data-active={active}>
    <div className="craft-wrap">
      <nav className="craft-nav" aria-label="Điều hướng trò chơi"><Link href="/game">← Hộ chiếu Di sản</Link><span>CHẶNG 01 / 05</span></nav>
      <header className="craft-heading"><p>LÀNG NGHỀ HÀ NỘI · DẤU ĐÔI TAY</p><h1>Tiệm Bách nghệ</h1><span className="craft-badge">Bản chơi thử · {mode === "online" ? "Online" : "Tại sự kiện"}</span></header>

      {state.phase === "ready" && <section className="craft-intro">
        <div className="craft-sign">TINH HOA TỪ ĐÔI TAY VIỆT</div>
        <div className="craft-display" aria-hidden="true"><ProductArt id="basket" /><ProductArt id="pot" /><ProductArt id="fan" /></div>
        <div className="craft-intro-copy"><p className="craft-eyebrow">CHÚ TỄU NHẮN BẠN</p><h2 ref={titleRef} tabIndex={-1}>Hôm nay, bạn làm chủ tiệm!</h2><p>Ba vị khách cùng ghé quầy. Nhìn đơn trên đầu mỗi khách, xếp đúng các món từ trái sang phải và giao hàng trước khi khách hết kiên nhẫn.</p>
          <div className="craft-rules"><span><b>Liên tục</b>khách ghé tiệm</span><span><b>60 giây</b>mỗi lượt</span><span><b>10 điểm</b>mỗi đơn đúng</span></div>
          <ol><li>Mỗi khách gọi <b>2–3 món</b>. Số trên đơn là thứ tự cần xếp.</li><li>Chạm món trên kệ để thêm vào khay; có thể chọn cùng món nhiều lần. Chạm món trên khay để bỏ.</li><li>Nhấn <b>Giao hàng</b>: khay khớp trọn đơn của khách nào thì khách đó nhận hàng. Mỗi đơn đúng được 10 điểm, hãy giao thật nhiều trong 60 giây!</li></ol>
          <p className="craft-note">Khách chờ khoảng {rules[mode].patience / 1000} giây, mỗi 10 giây khách mới chờ ít hơn 3 giây (tối thiểu 8 giây). Mỗi khách bỏ đi trừ 10 điểm, điểm có thể âm. Khi còn dưới 30%, khách sẽ tức giận. Giao sai không mất đơn nhưng ngắt chuỗi đúng; hết giờ chờ thì khách rời tiệm. Đồng hồ vẫn chạy khi bạn rời tab.</p>
          <button className="craft-primary" onClick={() => dispatch({ type: "start", orders: shuffledOrders(), now: Date.now() })}>Mở cửa tiệm →</button>
          <Link className="craft-mode-link" href={`/game/craft-shop?mode=${mode === "online" ? "event" : "online"}`}>Chuyển sang {mode === "online" ? "bản sự kiện" : "bản online"}</Link>
        </div>
      </section>}

      {active && <>
        <section ref={playRef} className="craft-stats" aria-label="Tiến trình lượt chơi"><div><span>ĐÃ GIAO</span><b>{correct}</b></div><div><span>ĐIỂM</span><motion.b key={state.score} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{state.score}</motion.b></div><div><span>KHÁCH BỎ ĐI</span><b>{leftCustomers}</b></div><div className={remaining <= 10 ? "craft-urgent" : ""}><span>CÒN LẠI</span><b role="timer" aria-label="Thời gian lượt chơi còn lại">{remaining}s</b></div></section>
        <section className="craft-counter" aria-label="Khách chờ nhận hàng">
          <div className="craft-awning" aria-hidden="true" />
          <div className="craft-queue">
            {[0, 1, 2].map(slot => {
              const customer = state.customers.find(c => c.slot === slot);
              const left = customer ? Math.max(0, customer.expiresAt - state.now) : 0;
              const angry = left <= rules[mode].patience * .3;
              return <div className="craft-customer-slot" key={slot}>
                <AnimatePresence mode="wait" initial={false}>
                  {customer ? <motion.article className={`craft-waiting-customer ${angry ? "is-angry" : ""}`} key={customer.id} data-customer-id={customer.id} initial={{ opacity: 0, y: 30, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: state.notice?.kind === "correct" && state.notice.slot === slot ? 35 : -35, y: 10 }}>
                    <div className="craft-order-bubble"><div className="craft-order-meta"><b>Khách #{customer.id}</b><span className="craft-customer-time" aria-label={`Khách ${customer.id} còn ${Math.ceil(left / 1000)} giây`}>{Math.ceil(left / 1000)}s</span></div>
                      <ol className="craft-order-items" aria-label={`Đơn của khách ${customer.id}, từ trái sang phải`}>{customer.items.map((id, index) => <li key={index} data-product={id}><span className="craft-order-number">{index + 1}</span><ProductArt id={id} /><span className="craft-order-name">{products.find(p => p.id === id)!.name}</span></li>)}</ol>
                      <progress className="craft-customer-progress" aria-label={`Thời gian chờ khách ${customer.id}`} max={rules[mode].patience + (customer.id <= 3 ? slot * 3000 : 0)} value={left} />
                    </div>
                    <div className="craft-person-wrap"><Face angry={angry} variant={slot} /></div>
                    <span className="craft-mood">{angry ? "Nhanh lên nhé!" : "Đang chờ…"}</span>
                  </motion.article> : <motion.div className="craft-empty-slot" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Hẹn khách tiếp theo <span>✦</span></motion.div>}
                </AnimatePresence>
              </div>;
            })}
          </div>
          <div className="craft-counter-edge" aria-hidden="true"><span>TIỆM BÁCH NGHỆ</span></div>
        </section>
        <div className="craft-notice-space" role="status" aria-live="polite" aria-atomic="true"><AnimatePresence mode="wait"><motion.p key={state.notice?.id ?? "hint"} className={`craft-notice ${state.notice?.kind ?? "hint"}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><b>{state.notice?.kind === "correct" ? "✓ " : state.notice?.kind === "wrong" ? "! " : ""}</b>{state.notice?.text ?? "Xếp món đúng thứ tự trên đơn rồi giao cho khách bất kỳ."}</motion.p></AnimatePresence></div>
        <section className="craft-shelf" aria-label="Kệ sản phẩm"><div className="craft-shelf-heading"><h2>Chọn món trên kệ</h2><span>CÓ THỂ CHỌN LẶP LẠI</span></div><div className="craft-products">{products.map(p => <motion.button whileTap={{ scale: .92 }} key={p.id} disabled={state.tray.length >= MAX_TRAY} aria-label={`Thêm ${p.name}`} onClick={() => dispatch({ type: "select", id: p.id, now: Date.now() })} className="craft-product" style={{ "--product-color": p.color } as React.CSSProperties}><ProductArt id={p.id} /><span>{p.name}</span><small>{p.village}</small><span className="craft-check" aria-hidden="true">+</span></motion.button>)}</div></section>
        <section className="craft-delivery" aria-label="Khay giao hàng"><div className="craft-tray-heading"><b>Khay của bạn <span>{state.tray.length}/{MAX_TRAY}</span></b><button disabled={!state.tray.length} onClick={() => dispatch({ type: "clear", now: Date.now() })}>Bỏ hết</button></div>
          <motion.div className="craft-tray" key={state.notice?.kind === "wrong" ? state.notice.id : "tray"} animate={state.notice?.kind === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }} transition={{ duration: .35 }}>
            {[0, 1, 2].map(index => <div className="craft-tray-slot" key={index}><span className="craft-order-number">{index + 1}</span><AnimatePresence mode="wait">{state.tray[index] ? <motion.button key={`${index}-${state.tray[index]}`} initial={{ opacity: 0, y: -20, scale: .7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15, scale: .5 }} aria-label={`Bỏ món ${index + 1}: ${products.find(p => p.id === state.tray[index])!.name}`} onClick={() => dispatch({ type: "remove", index, now: Date.now() })}><ProductArt id={state.tray[index]} /><span aria-hidden="true">×</span></motion.button> : <span className="craft-tray-placeholder">+</span>}</AnimatePresence></div>)}
          </motion.div><p>Chạm món trên khay để bỏ · Xếp từ trái sang phải</p><motion.button whileTap={{ scale: .98 }} className="craft-primary" disabled={!state.tray.length} onClick={() => dispatch({ type: "deliver", now: Date.now() })}>Giao hàng →</motion.button>
        </section>
      </>}

      {state.phase === "result" && <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="craft-result"><div className="craft-result-seal" aria-hidden="true">✧</div><p className="craft-eyebrow">HẾT 60 GIÂY · TỔNG KẾT LƯỢT CHƠI</p><h2 ref={titleRef} tabIndex={-1}>Một phút làm chủ tiệm</h2><p>Bạn đã giao đúng {correct} đơn hàng. Mỗi đơn đúng được 10 điểm; thử lại để phục vụ thêm nhiều khách nhé!</p><div className="craft-result-stats"><span><b>{state.score}</b>điểm</span><span><b>{correct}</b>đơn đúng</span><span><b>{leftCustomers}</b>khách bỏ đi</span></div><ul className="craft-review">{state.orders.map(order => { const a = state.answers.find(answer => answer.id === order.id); return <li key={order.id}><span aria-label={a?.correct ? "Đúng" : "Chưa hoàn thành"}>{a?.correct ? "✓" : "−"}</span><div><b>Khách #{order.id}</b><small>{order.items.map(id => products.find(p => p.id === id)!.name).join(" → ")}</small><small>{a?.correct ? "Đã giao đúng thứ tự" : "Chưa giao kịp"}</small></div><strong>{(a?.points ?? 0) > 0 ? "+" : ""}{a?.points ?? 0}</strong></li>; })}</ul><p className="craft-note">Kết quả chơi thử trên thiết bị này, chưa lưu vào hộ chiếu và chưa dùng để nhận sticker hoặc đổi quà.</p><button className="craft-primary" onClick={() => dispatch({ type: "reset" })}>Chơi lại</button><Link className="craft-mode-link" href="/game">Về hành trình 5 chặng →</Link></motion.section>}
      <details className="craft-info"><summary>Về bản chơi thử</summary><p>Khách đến liên tục trong 60 giây, không giới hạn số đơn. Mỗi đơn đúng được 10 điểm, chuỗi đúng chỉ để theo dõi và không nhân điểm. Giao sai hoặc khách bỏ đi ngắt chuỗi, mỗi khách bỏ đi bị trừ 10 điểm. Chưa kết nối tài khoản hay bảng xếp hạng.</p></details>
    </div>
  </main>;
}
