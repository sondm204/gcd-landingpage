"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ATTEMPT_LIMIT, gameIds, gameNames, type GameSession } from "@/lib/games/types";

export class GameRequestError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function gameRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new GameRequestError(response.status, data.error || "Chưa kết nối được hệ thống game. Vui lòng thử lại.");
  return data as T;
}
type AccountContext = GameSession & { loading: boolean; error: string; refresh: () => Promise<void>; login: (phone: string, name?: string) => Promise<boolean>; logout: () => Promise<void> };
const Context = createContext<AccountContext | null>(null);
export function useGameAccount() { const context = useContext(Context); if (!context) throw new Error("Game account provider missing"); return context; }
export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession>({ player: null, usage: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const pathname = usePathname();
  const refresh = useCallback(async () => {
    try { const data = await gameRequest<GameSession>("/api/game/session"); setSession(data); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Chưa thể tải tài khoản."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); const update = () => { if (!document.hidden) void refresh(); }; window.addEventListener("focus", update); return () => { clearTimeout(timer); window.removeEventListener("focus", update); }; }, [refresh]);
  async function login(phone: string, name?: string) {
    const data = await gameRequest<{ needs_name?: boolean }>("/api/game/session", { method: "POST", body: JSON.stringify({ phone, ...(name ? { display_name: name } : {}) }) });
    if (data.needs_name) return false;
    await refresh(); return true;
  }
  async function logout() { await gameRequest("/api/game/session", { method: "DELETE" }); setSession({ player: null, usage: [] }); }
  const gated = pathname !== "/game/leaderboard" && !pathname.startsWith("/game/admin");
  return <Context value={{ ...session, loading, error, refresh, login, logout }}>{gated && (loading || !session.player) ? <main className="game-account-gate"><Link href="/game">← Hộ chiếu Di sản</Link>{loading ? <p role="status">Đang kiểm tra tài khoản…</p> : <GameAccountPanel />}</main> : children}</Context>;
}
export function GameAccountPanel() {
  const account = useGameAccount();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [step, setStep] = useState<"phone" | "name">("phone");
  const [phone, setPhone] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { if (!await account.login(phone, step === "name" ? String(form.get("display_name")) : undefined)) setStep("name"); }
    catch (e) { setError(e instanceof Error ? e.message : "Chưa thể đăng nhập."); }
    finally { setBusy(false); }
  }
  if (account.loading) return <section className="game-account" aria-busy="true"><p>Đang tải hộ chiếu của bạn…</p></section>;
  return <section className="game-account" aria-label="Tài khoản game">
    {account.player ? <><div className="game-account-heading"><div><p className="game-account-kicker">HỘ CHIẾU CỦA BẠN</p><h2>Xin chào, {account.player.display_name}</h2><p>Tổng điểm: <strong>{account.usage.reduce((sum, g) => sum + (g.best ?? 0), 0)}</strong> · Cộng điểm cao nhất của từng game</p></div><button disabled={busy} onClick={async () => { setBusy(true); try { await account.logout(); setStep("phone"); setPhone(""); } catch (e) { setError(e instanceof Error ? e.message : "Chưa thể đăng xuất."); } finally { setBusy(false); } }}>Đăng xuất</button></div><div className="game-account-games">{gameIds.map(game => { const usage = account.usage.find(u => u.game === game); return <div key={game}><b>{gameNames[game]}</b><span>{Math.max(0, ATTEMPT_LIMIT - (usage?.used ?? 0))}/3 lượt còn lại</span><strong>{usage?.best === null || usage?.best === undefined ? "Chưa có điểm" : `${usage.best} điểm`}</strong></div>; })}</div></> : <><p className="game-account-kicker">MỘT SỐ ĐIỆN THOẠI · MỘT HÀNH TRÌNH</p><h2>Nhập tài khoản để bắt đầu</h2><p>{step === "phone" ? "Nhập số điện thoại để mở hoặc tiếp tục hộ chiếu của bạn." : "Số điện thoại này chưa đăng ký. Chọn một tên hiển thị duy nhất cho hành trình."}</p><form onSubmit={submit} data-step={step}><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} placeholder="0912 345 678" value={phone} onChange={e => setPhone(e.target.value)} readOnly={step === "name"} disabled={busy} required /></label>{step === "name" && <label>Tên hiển thị<input name="display_name" autoComplete="nickname" minLength={2} maxLength={40} placeholder="Tên trên bảng xếp hạng" disabled={busy} autoFocus required /></label>}<button type="submit" disabled={busy}>{busy ? "Đang mở hộ chiếu…" : step === "phone" ? "Tiếp tục →" : "Tạo hộ chiếu →"}</button>{step === "name" && <button type="button" disabled={busy} onClick={() => { setStep("phone"); setError(""); }}>Đổi số điện thoại</button>}</form><small>Số điện thoại không hiển thị công khai. Cùng một tài khoản cho game online và passport tại sự kiện.</small></>}
    {(error || account.error) && <p className="game-account-error" role="alert">{error || account.error}</p>}
    <div className="game-account-links"><Link href="/game/leaderboard">Xem bảng xếp hạng ↗</Link>{account.error && <button onClick={() => void account.refresh()}>Thử kết nối lại</button>}</div>
  </section>;
}
