"use client";
import { useCopy } from "@/i18n/copy";


import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export default function BoothLogin({ redirectTo = "/booths" }: { redirectTo?: "/booths" | "/game/admin" | "/register/admin" }) {
  const t = useCopy();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/booths/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_code || data.error || t("Không thể đăng nhập."));
      router.replace(redirectTo + (redirectTo === "/game/admin" ? window.location.hash : "")); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : t("Mất kết nối. Vui lòng thử lại.")); }
    finally { setBusy(false); }
  }
  const introduction = redirectTo === "/register/admin" ? t("Đăng nhập bằng tài khoản ban tổ chức để xem danh sách và xuất dữ liệu.") : redirectTo === "/game/admin" ? t("Đăng nhập bằng tài khoản ban tổ chức để quản lý QR, con dấu và xác nhận trao quà.") : t("Đăng nhập bằng tài khoản quản trị đã được cấp để xét duyệt đề xuất và chốt vị trí gian hàng.");
  return <main className="booths-main"><section className="booth-login"><span className="booth-kicker">{t("KHÔNG GIAN BAN TỔ CHỨC")}</span><h1>{t("Chào bạn trở lại.")}</h1><p>{introduction}</p><form onSubmit={login}><fieldset disabled={busy}><label className="booth-field">{t("Email quản trị")}<input name="email" type="email" autoComplete="username" required maxLength={254} /></label><label className="booth-field">{t("Mật khẩu")}<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>{error && <div className="booth-alert error" role="alert">{t(error)}</div>}<button className="booth-button" type="submit">{busy ? t("Đang đăng nhập…") : t("Đăng nhập quản trị")}<span aria-hidden="true">↗</span></button></fieldset></form></section></main>;
}
