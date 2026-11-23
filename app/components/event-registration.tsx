"use client";
import { useRef, useState, type FormEvent } from "react";
import { useCopy } from "@/i18n/copy";
import { registrationSchema } from "@/lib/registrations/validation";
import "../event-registration.css";

export default function EventRegistration() {
  const t = useCopy();
  const formRef = useRef<HTMLFormElement>(null), resultRef = useRef<HTMLDivElement>(null);
  const requestKey = useRef<string | null>(null);
  const [jci, setJci] = useState("");
  const [busy, setBusy] = useState(false), [reference, setReference] = useState("");
  const [error, setError] = useState(""), [errors, setErrors] = useState<Record<string,string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const input = { full_name: String(form.get("full_name") || ""), birth_date: String(form.get("birth_date") || ""), phone: String(form.get("phone") || ""), email: String(form.get("email") || ""), facebook_url: String(form.get("facebook_url") || ""), is_jci: jci === "yes", chapter: String(form.get("chapter") || ""), consent: form.has("consent"), website_confirm: String(form.get("website_confirm") || "") };
    const parsed = registrationSchema.safeParse(input);
    setError("");
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); const field = String(parsed.error.issues[0].path[0]); requestAnimationFrame(() => { const control = formRef.current?.elements.namedItem(field); if (control instanceof HTMLElement) control.focus(); }); return; }
    setErrors({}); setBusy(true); requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/registrations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey.current }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) { setErrors(data.errors || {}); throw new Error(data.error_code || data.error || t("Chưa thể lưu đăng ký. Bạn có thể thử gửi lại mà không tạo đăng ký trùng.")); }
      setReference(data.reference);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (e) { setError(e instanceof Error ? e.message : t("Chưa thể lưu đăng ký. Bạn có thể thử gửi lại mà không tạo đăng ký trùng.")); }
    finally { setBusy(false); }
  }
  const hint = (field: string) => errors[field] ? <small id={`registration-${field}-error`} className="registration-error">{t(errors[field])}</small> : null;
  const invalid = (field: string) => ({ "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `registration-${field}-error` : undefined });
  return <div className="event-registration" id="event-registration" aria-labelledby="registration-title">
    <div className="registration-heading"><span className="eyebrow">GLOBAL CITIZENS DAY 2026</span><h1 id="registration-title">{t("Đăng ký tham gia sự kiện")}</h1><p>{t("Điền thông tin bên dưới để ban tổ chức ghi nhận đăng ký và liên hệ với bạn.")}</p></div>
    {reference ? <div className="registration-success" role="status" tabIndex={-1} ref={resultRef}><span aria-hidden="true">✓</span><h3>{t("Đã ghi nhận đăng ký của bạn!")}</h3><p>{t("Vui lòng giữ mã đăng ký để trao đổi với ban tổ chức. Thông tin chi tiết sẽ được gửi qua các kênh liên hệ bạn cung cấp.")}</p><strong>{reference}</strong></div> : <form onSubmit={submit} ref={formRef}>
      <fieldset disabled={busy}><div className="registration-grid">
        <label>{t("Họ và tên *")}<input name="full_name" autoComplete="name" required minLength={2} maxLength={120} {...invalid("full_name")} />{hint("full_name")}</label>
        <label>{t("Ngày sinh *")}<input name="birth_date" type="date" autoComplete="bday" required min="1900-01-01" {...invalid("birth_date")} />{hint("birth_date")}</label>
        <label>{t("Số điện thoại *")}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={40} placeholder="0912 345 678" {...invalid("phone")} />{hint("phone")}</label>
        <label>{t("Gmail / Email *")}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="example@gmail.com" {...invalid("email")} />{hint("email")}</label>
        <label className="registration-wide">{t("Link Facebook cá nhân *")}<input name="facebook_url" inputMode="url" autoComplete="url" required maxLength={500} placeholder="https://www.facebook.com/..." {...invalid("facebook_url")} />{hint("facebook_url")}</label>
        <label className="registration-wide">{t("Bạn có đang hoạt động trong JCI không? *")}<select name="is_jci" required value={jci} onChange={e => setJci(e.target.value)}><option value="" disabled>{t("Chọn câu trả lời")}</option><option value="yes">{t("Có, tôi đang hoạt động trong JCI")}</option><option value="no">{t("Không")}</option></select></label>
        {jci === "yes" && <label className="registration-wide">{t("Bạn đang hoạt động trong chapter nào? *")}<input name="chapter" required minLength={2} maxLength={120} placeholder={t("Tên chapter JCI của bạn")} {...invalid("chapter")} />{hint("chapter")}</label>}
      </div>
      <label className="registration-consent"><input name="consent" type="checkbox" required />{t("Tôi đồng ý để ban tổ chức sử dụng thông tin trên nhằm ghi nhận đăng ký và liên hệ về sự kiện.")}</label>{hint("consent")}
      <label className="registration-trap" aria-hidden="true">Website<input name="website_confirm" tabIndex={-1} autoComplete="off" /></label>
      {error && <p className="registration-alert" role="alert">{t(error)}</p>}
      <button className="button button-red" type="submit" disabled={busy}>{busy ? t("Đang gửi đăng ký…") : t("Gửi đăng ký tham gia")}</button>
      </fieldset>
    </form>}
  </div>;
}
