"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoothLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/booths/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể đăng nhập.");
      router.replace("/booths"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Mất kết nối. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  return <main className="booths-main"><section className="booth-login"><span className="booth-kicker">KHÔNG GIAN BAN TỔ CHỨC</span><h1>Chào bạn trở lại.</h1><p>Đăng nhập bằng tài khoản quản trị đã được cấp để xét duyệt đề xuất và chốt vị trí gian hàng.</p><form onSubmit={login}><fieldset disabled={busy}><label className="booth-field">Email quản trị<input name="email" type="email" autoComplete="username" required maxLength={254} /></label><label className="booth-field">Mật khẩu<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>{error && <div className="booth-alert error" role="alert">{error}</div>}<button className="booth-button" type="submit">{busy ? "Đang đăng nhập…" : "Đăng nhập quản trị"}<span aria-hidden="true">↗</span></button></fieldset></form></section></main>;
}
