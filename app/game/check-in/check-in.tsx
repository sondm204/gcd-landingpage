"use client";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { extractPassportCode, type Passport } from "@/lib/games/passport-types";
import { gameRequest } from "../components/game-account";
export default function CheckIn() {
  const [result, setResult] = useState<{ name: string; code: string; reused: boolean; count: number } | null>(null);
  const [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => { const changed = () => { setResult(null); setError(""); setRetry(n => n + 1); }; window.addEventListener("hashchange", changed); return () => window.removeEventListener("hashchange", changed); }, []);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const code = extractPassportCode(window.location.href, "station");
        if (!code) throw new Error("Mã QR không hợp lệ. Hãy quét mã đang đặt tại gian hàng.");
        const claim = await gameRequest<{ station_id: number; reused: boolean }>("/api/game/passport/claim", { method: "POST", body: JSON.stringify({ code }) });
        const passport = await gameRequest<Passport>("/api/game/passport"), station = passport.stations.find(s => s.id === claim.station_id);
        if (alive) { setError(""); setResult({ name: station?.name || "Điểm hẹn di sản", code: station?.code || "", reused: claim.reused, count: passport.count }); }
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Chưa thể nhận dấu. Vui lòng thử lại."); }
    };
    void run(); return () => { alive = false; };
  }, [retry]);
  return <main className="passport-checkin"><section><p className="game-kicker">THE HERITAGE ODYSSEY · PASSPORT</p><div className="passport-seal" data-success={Boolean(result)} aria-hidden="true">✦</div>{result ? <><h1>{result.reused ? "Dấu hẹn đã có trong hộ chiếu!" : "Một dấu hẹn mới!"}</h1><p className="passport-checkin-name">{result.code} · {result.name}</p><p>{result.reused ? "Mỗi gian chỉ nhận một dấu. Hãy khám phá thêm những điểm hẹn khác nhé." : "Cảm ơn bạn đã ghé thăm. Con dấu đã được lưu vào hộ chiếu."}</p><strong>{result.count} con dấu đã nhận</strong></> : error ? <><h1>Chưa thể nhận dấu</h1><p role="alert">{error}</p><button onClick={() => { setError(""); setRetry(n => n + 1); }}>Thử nhận lại</button></> : <><h1>Đang đóng dấu hành trình…</h1><p role="status">Chờ một chút để lưu điểm hẹn của bạn.</p></>}<Link className="passport-primary" href="/game?tab=event#chon-chang">Mở hộ chiếu của tôi →</Link></section></main>;
}
