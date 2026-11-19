"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { extractPassportCode, type PassportAdmin as AdminData, type PassportLookup, type AdminStation } from "@/lib/games/passport-types";
import { GameRequestError, gameRequest } from "../components/game-account";
const endpoint = "/api/game/passport/admin";
const time = (date: string) => new Date(date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
export default function PassportAdmin() {
  const [data, setData] = useState<AdminData | null>(null), [error, setError] = useState(""), [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const [card, setCard] = useState(""), [lookup, setLookup] = useState<PassportLookup | null>(null);
  const [cards, setCards] = useState<{ name: string; code: string; image: string }[]>([]);
  const printRef = useRef<HTMLDivElement>(null), confirmRef = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    const code = extractPassportCode(window.location.href, "card");
    if (code) setCard(code);
    try {
      setData(await gameRequest<AdminData>(endpoint)); setError(""); setUnauthorized(false);
      if (code) { setCard(code); setLookup(await gameRequest<PassportLookup>(endpoint, { method: "POST", body: JSON.stringify({ action: "lookup", card: code }) })); }
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa tải được quản trị."); if (e instanceof GameRequestError && [401,403].includes(e.status)) setUnauthorized(true); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); const changed = () => { setLookup(null); setCard(""); void load(); }; window.addEventListener("hashchange", changed); return () => { clearTimeout(timer); window.removeEventListener("hashchange", changed); }; }, [load]);
  useEffect(() => {
    if (!cards.length) return;
    let alive = true;
    const timer = setTimeout(async () => { try { await Promise.all(Array.from(printRef.current?.querySelectorAll("img") || []).map(img => img.decode())); if (alive) window.print(); } catch { if (alive) setError("Chưa chuẩn bị được bản in QR. Vui lòng thử lại."); } }, 0);
    return () => { alive = false; clearTimeout(timer); };
  }, [cards]);
  async function mutate(payload: unknown, message: string) {
    if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await gameRequest(endpoint, { method: "POST", body: JSON.stringify(payload) }); setNotice(message); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Chưa lưu được thay đổi."); }
    finally { setBusy(false); }
  }
  function settings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void mutate({ action: "settings", collecting_open: form.has("collecting"), redeeming_open: form.has("redeeming"), minimum_stamps: String(form.get("minimum")).trim() ? Number(form.get("minimum")) : null, reward_label: String(form.get("reward")) }, "Đã lưu cấu hình passport.");
  }
  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = extractPassportCode(card, "card"); setLookup(null); setNotice("");
    if (!code) { setError("Dán QR hộ chiếu cá nhân hoặc mã hộ chiếu hợp lệ."); return; }
    setBusy(true); try { setLookup(await gameRequest<PassportLookup>(endpoint, { method: "POST", body: JSON.stringify({ action: "lookup", card: code }) })); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Không tìm thấy hộ chiếu."); } finally { setBusy(false); }
  }
  async function redeem() {
    const code = extractPassportCode(card, "card"); if (!code || busy) return;
    setBusy(true); setError("");
    try { const result = await gameRequest<{ reused: boolean }>(endpoint, { method: "POST", body: JSON.stringify({ action: "redeem", card: code }) }); setNotice(result.reused ? "Hộ chiếu này đã đổi quà trước đó. Không trao thêm quà." : "Đã xác nhận trao quà. Hộ chiếu được đánh dấu đã đổi."); setLookup(await gameRequest<PassportLookup>(endpoint, { method: "POST", body: JSON.stringify({ action: "lookup", card: code }) })); await load(); confirmRef.current?.close(); } catch (e) { setError(e instanceof Error ? e.message : "Chưa xác nhận được đổi quà."); confirmRef.current?.close(); } finally { setBusy(false); }
  }
  async function print() {
    if (!data || busy) return; setBusy(true); setError("");
    try {
      const qr = await import("qrcode");
      const values = await Promise.all(data.stations.filter(s => s.enabled && s.active).map(async station => {
        const url = new URL("/game/check-in", data.qr_origin); url.hash = `code=${station.qr_token}`;
        return { name: station.name, code: station.code, image: await qr.toDataURL(url.href, { width: 420, margin: 4, errorCorrectionLevel: "M" }) };
      }));
      if (!values.length) throw new Error("Chưa có gian nào đang bật nhận dấu để in QR.");
      setCards(values);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa tạo được bản in."); } finally { setBusy(false); }
  }
  const minimum = lookup?.passport.settings.minimum_stamps;
  const canRedeem = Boolean(lookup && !lookup.passport.redemption && lookup.passport.settings.redeeming_open && minimum !== null && minimum !== undefined && lookup.passport.count >= minimum);
  if (unauthorized) return <main className="passport-admin"><Link href="/game?tab=event">← Hộ chiếu tại sự kiện</Link><section><h1>Không gian ban tổ chức</h1><p>{error}</p><Link className="passport-primary" href={`/game/admin/login${card ? `#card=${encodeURIComponent(card)}` : ""}`}>Đăng nhập quản trị →</Link></section></main>;
  return <main className="passport-admin"><nav><Link href="/game?tab=event">← Hộ chiếu tại sự kiện</Link><Link href="/booths">Quản trị gian hàng ↗</Link></nav><header><p className="game-kicker">GLOBAL CITIZENS DAY 2026 · BAN TỔ CHỨC</p><h1>Quản trị những dấu hẹn</h1><p>Mở nhận dấu, phát QR theo gian và xác nhận trao quà từ dữ liệu hộ chiếu.</p></header>{error && <p className="passport-alert" role="alert">{error}</p>}{notice && <p className="passport-notice" role="status">{notice}</p>}
    {!data ? <section><p role="status">Đang tải…</p><button onClick={() => void load()}>Tải lại</button></section> : <>
      <div className="passport-admin-stats"><span><b>{data.total_players}</b>người đã nhận dấu</span><span><b>{data.total_stamps}</b>con dấu đã trao</span><span><b>{data.total_redemptions}</b>hộ chiếu đã đổi quà</span></div>
      <section><h2>Điều phối sự kiện</h2><form onSubmit={settings} key={JSON.stringify(data.settings)}><div className="passport-form-grid"><label><input type="checkbox" name="collecting" defaultChecked={data.settings.collecting_open} /> Mở nhận dấu</label><label><input type="checkbox" name="redeeming" defaultChecked={data.settings.redeeming_open} /> Mở đổi quà</label><label>Số dấu tối thiểu<input type="number" name="minimum" min={1} max={1000} defaultValue={data.settings.minimum_stamps ?? ""} placeholder="Chưa chốt" /></label><label>Tên quà tặng<input name="reward" required maxLength={120} defaultValue={data.settings.reward_label} /></label></div><p>Để trống mốc dấu khi chưa chốt quy chế. Phải có mốc trước khi mở đổi quà.</p><button disabled={busy} className="passport-primary">Lưu cấu hình</button></form></section>
      <section id="doi-qua"><p className="game-kicker">QUẦY ĐỔI QUÀ</p><h2>Kiểm tra hộ chiếu</h2><p>Dùng camera điện thoại quét QR cá nhân mà người chơi xuất trình; hoặc dán liên kết/mã vào đây.</p><form onSubmit={inspect} className="passport-inspect"><label>QR hoặc mã hộ chiếu<input value={card} onChange={e => { setCard(e.target.value); setLookup(null); }} maxLength={500} required placeholder="Dán QR hộ chiếu cá nhân" /></label><button disabled={busy} className="passport-primary">Kiểm tra hộ chiếu</button></form>
        {lookup && <div className="passport-lookup"><h3>{lookup.player.display_name}</h3><p>Mã {lookup.player.id.slice(0,8).toUpperCase()} · <b>{lookup.passport.count} dấu</b> · Mốc {minimum ?? "chưa chốt"}</p>{lookup.passport.redemption ? <p className="passport-alert">Đã đổi {lookup.passport.redemption.reward_label} lúc {time(lookup.passport.redemption.redeemed_at)}.</p> : <p>{canRedeem ? "Đủ điều kiện nhận quà." : "Chưa đủ dấu hoặc chưa mở đổi quà."}</p>}<ul>{lookup.passport.stations.filter(s => s.received_at).map(s => <li key={s.id}>{s.code} · {s.name} <small>{time(s.received_at!)}</small></li>)}</ul><button disabled={busy || !canRedeem} className="passport-primary" onClick={() => confirmRef.current?.showModal()}>Xác nhận trao quà</button></div>}
      </section>
      <section><div className="passport-list-heading"><div><h2>QR theo gian hàng</h2><p>In hoặc tải QR để đặt đúng tại gian tương ứng.</p></div><div><button disabled={busy} onClick={() => void mutate({ action: "sync" }, "Đã đồng bộ các vị trí gian hàng mới.")}>Đồng bộ gian hàng</button><button disabled={busy} onClick={() => void print()}>In toàn bộ QR đang bật</button></div></div><div className="passport-admin-stations">{data.stations.map(station => <Station key={`${station.id}:${station.qr_token}:${station.enabled}:${station.title}`} station={station} busy={busy} onSave={mutate} />)}</div></section>
      <dialog ref={confirmRef} className="passport-confirm"><h2>Xác nhận trao quà?</h2><p>{lookup?.player.display_name} · {lookup?.passport.count} dấu</p><p>Quà: {lookup?.passport.settings.reward_label}. Chỉ xác nhận khi thực sự trao quà cho người chơi.</p><button disabled={busy} className="passport-primary" onClick={() => void redeem()}>Đã trao quà, xác nhận</button><button disabled={busy} onClick={() => confirmRef.current?.close()}>Quay lại kiểm tra</button></dialog>
      <div className="passport-print-sheet" ref={printRef}>{cards.map(item => <article key={item.code}><p>GLOBAL CITIZENS DAY 2026</p><h2>{item.code}</h2><h3>{item.name}</h3><Image src={item.image} width={220} height={220} alt={`QR nhận dấu ${item.code}`} unoptimized loading="eager" /><p>Quét QR để nhận dấu vào Hộ chiếu Di sản</p></article>)}</div>
    </>}
  </main>;
}
function Station({ station, busy, onSave }: { station: AdminStation; busy: boolean; onSave: (payload: unknown, message: string) => Promise<void> }) {
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); void onSave({ action: "station", id: station.id, title: String(form.get("title")), enabled: form.has("enabled"), rotate: form.has("rotate") }, `Đã cập nhật gian ${station.code}.`); }
  return <article className="passport-admin-station"><div><b>{station.code}</b><h3>{station.name}</h3><small>{station.zone} · {station.visits} lượt ghé</small></div><details><summary>Xem và tải QR</summary><Image src={`/api/game/passport/admin/qr/${station.id}`} alt={`QR nhận dấu ${station.code}`} width={180} height={180} unoptimized /><a href={`/api/game/passport/admin/qr/${station.id}?download`}>Tải QR SVG ↓</a></details><form onSubmit={save}><label>Tên riêng trên passport<input name="title" defaultValue={station.title || ""} maxLength={120} placeholder={station.name} /></label><label><input type="checkbox" name="enabled" defaultChecked={station.enabled} /> Bật nhận dấu</label><label><input type="checkbox" name="rotate" /> Thay mã QR</label><small>Thay mã sẽ vô hiệu QR cũ đã in, giữ nguyên dấu đã nhận.</small><button disabled={busy}>Lưu gian</button></form></article>;
}
