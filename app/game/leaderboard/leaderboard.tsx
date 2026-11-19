"use client";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { gameIds, gameNames, type GameId, type Leader } from "@/lib/games/types";
import { GameAccountPanel, gameRequest, useGameAccount } from "../components/game-account";
export default function Leaderboard() {
  const { player } = useGameAccount();
  const [game, setGame] = useState<GameId | "total">("total"), [page, setPage] = useState(0);
  const [entries, setEntries] = useState<Leader[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    gameRequest<{ entries: Leader[]; total: number }>(`/api/game/leaderboard?game=${game}&page=${page}`).then(data => { if (active) { setEntries(data.entries); setTotal(data.total); setError(""); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [game, page, retry]);
  function select(value: GameId | "total") { setLoading(true); setError(""); setGame(value); setPage(0); setRetry(n => n + 1); }
  return <main className="game-leaderboard-page"><nav><Link href="/game">← Hộ chiếu Di sản</Link></nav><section className="game-leaderboard"><p>GLOBAL CITIZENS DAY 2026</p><h1>Những dấu ấn dẫn đầu</h1><p>Tổng điểm bằng điểm cao nhất của từng game cộng lại. Mỗi tài khoản có 3 lượt/game; thư hợp lệ được 100 điểm. Các tài khoản cùng điểm có cùng hạng.</p><div className="game-leader-tabs" aria-label="Chọn bảng xếp hạng">{(["total", ...gameIds] as const).map(value => <button key={value} aria-pressed={game === value} onClick={() => select(value)}>{value === "total" ? "Tổng điểm" : gameNames[value]}</button>)}</div>
    {loading ? <p role="status">Đang tải bảng xếp hạng…</p> : error ? <div role="alert"><p>{error}</p><button onClick={() => { setLoading(true); setRetry(n => n + 1); }}>Thử lại</button></div> : entries.length ? <><div className="game-leader-scroll"><table className="game-leader-table"><caption className="sr-only">{game === "total" ? "Bảng xếp hạng tổng điểm" : gameNames[game]}</caption><thead><tr><th>HẠNG</th><th>NGƯỜI CHƠI</th><th>ĐIỂM {game === "total" ? "TỔNG" : "CAO NHẤT"}</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.player_id} data-self={entry.player_id === player?.id}><td>{entry.rank}</td><td>{entry.display_name}{entry.player_id === player?.id && " · Bạn"}{game === "total" && <small>{gameIds.map(id => `${gameNames[id]}: ${entry.best_scores[id] ?? 0}`).join(" · ")}</small>}</td><td>{entry.score}</td></tr>)}</tbody></table></div><div className="game-leader-pages"><button disabled={page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>← Trước</button><span>{page + 1} / {Math.ceil(total / 50)}</span><button disabled={(page + 1) * 50 >= total} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Tiếp →</button></div></> : <p>Chưa có kết quả. Hãy trở thành người ghi dấu đầu tiên!</p>}
    </section><GameAccountPanel /></main>;
}
