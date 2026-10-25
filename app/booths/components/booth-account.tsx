"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BoothAccount() {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<{ email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const popup = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/booths/admin/session", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) setAdmin(data.admin);
      } catch { /* Keep the last known account on temporary connection failures. */ }
      finally { if (!controller.signal.aborted) setReady(true); }
    }
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("booth-auth-changed", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); window.removeEventListener("booth-auth-changed", onFocus); };
  }, [pathname]);

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (popup.current && !popup.current.contains(event.target as Node)) popup.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && popup.current?.open) {
        popup.current.open = false;
        popup.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);

  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/booths/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Chưa thể đăng xuất. Vui lòng thử lại.");
      setAdmin(null); setBusy(false);
      window.dispatchEvent(new Event("booth-auth-changed"));
      router.replace("/booths"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Mất kết nối. Vui lòng thử lại."); setBusy(false); }
  }

  if (!ready) return <span className="booth-account-loading" aria-label="Đang kiểm tra tài khoản" />;
  if (!admin) return <Link href="/booths/admin/login">Đăng nhập quản trị</Link>;
  return <details className="booth-account" ref={popup}>
    <summary aria-label="Tài khoản quản trị" title="Tài khoản quản trị"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg></summary>
    <div className="booth-account-popup"><span className="booth-kicker">TÀI KHOẢN QUẢN TRỊ</span><p>{admin.email}</p>{error && <p role="alert">{error}</p>}<button className="booth-button secondary compact" type="button" disabled={busy} onClick={logout}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button></div>
  </details>;
}
