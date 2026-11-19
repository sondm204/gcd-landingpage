"use client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Passport } from "@/lib/games/passport-types";
import { extractPassportCode } from "@/lib/games/passport-types";
import { gameRequest, useGameAccount } from "./game-account";
const when = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export default function EventPassport() {
  const router = useRouter();
  const { player, logout } = useGameAccount();
  const [passport, setPassport] = useState<Passport | null>(null), [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "visited" | "unvisited">("all");
  const [inputError, setInputError] = useState("");
  const load = useCallback(async () => { try { setPassport(await gameRequest<Passport>("/api/game/passport")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Chưa thể tải passport."); } }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); const refresh = () => { if (!document.hidden) void load(); }; window.addEventListener("focus", refresh); return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); }; }, [load]);
  function openCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = extractPassportCode(String(new FormData(event.currentTarget).get("code") || ""), "station");
    if (!code) { setInputError("Dán đúng liên kết QR hoặc mã nhận dấu tại gian."); return; }
    router.push(`/game/check-in#code=${code}`);
  }
  if (!passport) return <section className="event-passport"><p role={error ? "alert" : "status"}>{error || "Đang mở các trang hộ chiếu…"}</p>{error && <button onClick={() => void load()}>Thử lại</button>}</section>;
  const minimum = passport.settings.minimum_stamps;
  const eligible = minimum !== null && passport.count >= minimum;
  const stations = passport.stations.filter(s => filter === "all" || (filter === "visited" ? Boolean(s.received_at) : !s.received_at));
  return <section className="event-passport" aria-label="Hộ chiếu tại sự kiện">
    <div className="event-passport-top"><div><p className="game-kicker">NHỮNG ĐIỂM HẸN ĐÃ ĐI QUA</p><h3>Xin chào, {player?.display_name}.</h3><p>Ghé gian hàng, dùng camera điện thoại quét QR đang đặt tại gian. Con dấu sẽ được lưu vào hộ chiếu của bạn.</p></div><div><button onClick={() => void load()} aria-label="Cập nhật hộ chiếu">↻ Cập nhật</button><button onClick={() => void logout().catch(e => setError(e.message))}>Đăng xuất</button></div></div>
    {error && <p className="passport-alert" role="alert">{error}</p>}
    <div className="passport-summary"><div className="passport-stamp-total"><span aria-hidden="true">✧</span><strong>{passport.count}</strong><span>CON DẤU ĐÃ NHẬN</span><small>{passport.stations.filter(s => s.active).length} điểm hẹn đang tham gia</small></div><div className="passport-progress-copy"><p className="game-kicker">MỖI ĐIỂM DỪNG, MỘT KÝ ỨC</p><h3>{passport.redemption ? "Món quà đã được trao." : eligible ? "Bạn đã đủ dấu cho món quà!" : "Đi thêm một gian. Gom thêm một dấu."}</h3><p>{minimum === null ? "Ban tổ chức sẽ công bố mốc đổi quà tại đây." : `Mốc đổi quà: ${minimum} dấu · ${passport.settings.reward_label}`}</p>{minimum !== null && <progress value={Math.min(passport.count, minimum)} max={minimum} aria-label="Tiến độ nhận dấu đổi quà" />}<p className="passport-status">{passport.redemption ? `Đã đổi ${passport.redemption.reward_label} · ${when(passport.redemption.redeemed_at)}` : !passport.settings.collecting_open ? "Nhận dấu hiện chưa mở hoặc đã kết thúc." : "Đang mở nhận dấu tại các gian."}</p><small>Mỗi gian một dấu. Số dấu tại sự kiện độc lập với điểm game online.</small></div></div>
    <div className="passport-reward-card"><div><p className="game-kicker">XUẤT TRÌNH TẠI QUẦY ĐỔI QUÀ</p><h3>Hộ chiếu của {player?.display_name}</h3><p><b>{passport.count} dấu đã nhận</b> · Mã hộ chiếu {player?.id.slice(0,8).toUpperCase()}</p><p>{passport.redemption ? "Hộ chiếu này đã được xác nhận trao quà." : passport.settings.redeeming_open && eligible ? "Đưa QR cá nhân này cho ban tổ chức để kiểm tra và nhận quà." : "Khi mở đổi quà và đủ dấu, đưa QR này cho ban tổ chức. Không cần chụp ảnh màn hình."}</p></div><Image src="/api/game/passport/card-qr" alt="QR hộ chiếu cá nhân để ban tổ chức kiểm tra đổi quà" width={176} height={176} unoptimized /></div>
    <div className="passport-list-heading"><h3>Những trang dấu của bạn</h3><div role="group" aria-label="Lọc gian đã ghé">{([["all","Tất cả"],["visited","Đã ghé"],["unvisited","Chưa ghé"]] as const).map(([value,label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
    <div className="passport-station-grid">{stations.map(station => <article className="passport-station" data-stamped={Boolean(station.received_at)} key={station.id}><span className="passport-station-code">{station.code}</span><div className="passport-seal" aria-hidden="true"><span>✦</span><i>{station.received_at ? "ĐÃ GHÉ" : "CHỜ BẠN"}</i></div><h4>{station.name}</h4><p>{station.zone}</p><small>{station.received_at ? when(station.received_at) : station.active ? "Quét QR tại gian để nhận dấu" : "Gian đã tạm dừng nhận dấu"}</small></article>)}</div>
    {!stations.length && <p className="passport-empty">{passport.stations.length ? "Chưa có điểm hẹn trong mục này. Hành trình vẫn đang chờ bạn." : "Các gian hàng đang được ban tổ chức chuẩn bị."}</p>}
    <details className="passport-manual"><summary>Cách quét QR và nhập liên kết nhận dấu</summary><p>Mở Camera hoặc ứng dụng quét QR trên điện thoại, hướng vào mã tại gian và mở liên kết. Nếu được yêu cầu đăng nhập, chỉ cần nhập SĐT của bạn; dấu đang quét sẽ được giữ để nhận sau khi vào tài khoản.</p><form onSubmit={openCode}><label>Liên kết hoặc mã tại gian<input name="code" placeholder="Dán liên kết QR nhận dấu" required maxLength={500} /></label><button type="submit">Mở mã nhận dấu →</button></form>{inputError && <p role="alert">{inputError}</p>}</details>
    <p className="passport-footnote">Ban tổ chức xác nhận trao quà một lần cho mỗi hộ chiếu. <Link href="/game/admin">Khu vực ban tổ chức ↗</Link></p>
  </section>;
}
