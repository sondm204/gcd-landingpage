"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoothPosition } from "@/lib/booths/types";
import BoothMap from "./booth-map";
import Image from "next/image";
import Link from "next/link";
import BoothAdminPanel from "./booth-admin-panel";

const categories = ["Thủ công & làng nghề", "Ẩm thực", "Văn hoá & sáng tạo", "Thương hiệu & cộng đồng", "Khác"];

export default function BoothBooking() {
  const [positions, setPositions] = useState<BoothPosition[]>([]);
  const [selected, setSelected] = useState(1);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; code: string } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [formVersion, setFormVersion] = useState(0);
  const [admin, setAdmin] = useState<{ email: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const requestKey = useRef<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/booths", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPositions(data.positions); setConfigured(data.configured); setError("");
      try {
        const session = await fetch("/api/booths/admin/session", { cache: "no-store", signal });
        const account = await session.json();
        if (!session.ok) throw new Error(account.error || "Chưa thể kiểm tra phiên quản trị.");
        setAdmin(account.admin); setAuthError("");
      } catch (err) { if (!signal?.aborted) { setAdmin(null); setAuthError(err instanceof Error ? err.message : "Không kiểm tra được phiên đăng nhập."); } }
      finally { if (!signal?.aborted) setAuthReady(true); }
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : "Chưa tải được sơ đồ."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    // Remote fetch completions update state asynchronously, after the effect returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(controller.signal);
    const authChanged = () => { void refresh(controller.signal); };
    window.addEventListener("booth-auth-changed", authChanged);
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 30000);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("booth-auth-changed", authChanged); };
  }, [refresh]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const position = positions.find((item) => item.id === selected);
  const booked = positions.filter((item) => item.is_booked).length;
  const unauthorized = useCallback(() => { setAdmin(null); setError("Phiên đăng nhập hoặc quyền quản trị đã thay đổi. Vui lòng đăng nhập lại."); }, []);
  async function logout() {
    setLogoutBusy(true);
    try {
      const response = await fetch("/api/booths/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Chưa thể đăng xuất.");
      setAdmin(null); setAuthError(""); window.dispatchEvent(new Event("booth-auth-changed")); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Mất kết nối."); }
    finally { setLogoutBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !position || position.is_booked || imageError || busy) return;
    const form = new FormData(event.currentTarget);
    form.set("position_id", String(position.id));
    form.set("consent", form.get("consent") === "on" ? "true" : "false");
    requestKey.current ||= crypto.randomUUID();
    setBusy(true); setSubmitError("");
    try {
      const response = await fetch("/api/booths/proposals", { method: "POST", headers: { "Idempotency-Key": requestKey.current }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa gửi được đề xuất.");
      setSuccess({ reference: data.reference, code: position.code });
      await refresh();
    } catch (err) { setSubmitError(err instanceof Error ? err.message : "Mất kết nối. Bạn có thể thử gửi lại."); }
    finally { setBusy(false); requestAnimationFrame(() => messageRef.current?.focus()); }
  }

  return <main className="booths-main">
    <section className="booths-intro"><div><span className="booth-kicker">DÀNH CHO THƯƠNG HIỆU & ĐƠN VỊ ĐỒNG HÀNH</span><h1>Chọn một góc nhỏ.<br /><em>Mở ngàn kết nối.</em></h1><p>Mang câu chuyện của thương hiệu đến Global Citizens Day 2026. Chọn vị trí phù hợp và gửi đề xuất để cùng tạo nên một phiên chợ nhiều bản sắc.</p></div><div className="booths-intro-aside"><span className="booths-big-number">40<span>VỊ TRÍ DỰ KIẾN</span></span><p>Gửi đề xuất tự do.<br />Ban tổ chức xét duyệt.<br /><strong>Chỉ xác nhận khi được chốt.</strong></p></div></section>
    <div className="booth-process"><span><b>01</b> Chọn vị trí</span><span><b>02</b> Gửi câu chuyện gian hàng</span><span><b>03</b> Chờ ban tổ chức xét duyệt</span></div>
    {admin && <div className="booth-admin-mode"><div><span className="booth-kicker">CHẾ ĐỘ QUẢN TRỊ</span><p>{admin.email} · Chọn ô để xem đề xuất, xét duyệt hoặc sửa gian hàng đã chốt.</p></div><button type="button" className="booth-button secondary compact" disabled={logoutBusy} onClick={logout}>{logoutBusy ? "Đang đăng xuất…" : "Đăng xuất ↗"}</button></div>}
    {error && <div className="booth-alert error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Tải lại sơ đồ</button></div>}
    {!loading && !configured && !error && <div className="booth-alert">Đây là bản xem trước sơ đồ. Cổng nhận đề xuất chưa mở; chức năng gửi sẽ hoạt động khi ban tổ chức hoàn tất cấu hình.</div>}
    {loading ? <div className="booth-loading" role="status">Đang mở sơ đồ gian hàng…</div> : positions.length > 0 && <>
      <div className="booth-availability"><span><strong>{positions.length - booked}</strong> vị trí đang nhận đề xuất</span><span><strong>{booked}</strong> vị trí đã xác nhận</span><small>Cập nhật mỗi 30 giây</small></div>
      <div className={`booth-booking-grid ${admin ? "is-admin" : ""}`}>
        <div className="booth-map-column"><BoothMap positions={positions} selected={selected} onSelect={setSelected} />
          {admin && <section className="booth-group-overview" aria-label="Nhóm đề xuất theo vị trí"><span className="booth-kicker">TỔNG QUAN THEO VỊ TRÍ</span><h2>Những ô đang có hồ sơ.</h2><p>Bấm một nhóm để xem hồ sơ tương ứng bên cạnh.</p><div>{positions.filter((entry) => entry.pending_count>0 || entry.is_booked).map((entry) => <button type="button" key={entry.id} className={selected===entry.id ? "selected" : ""} aria-pressed={selected===entry.id} onClick={()=>setSelected(entry.id)}><strong>{entry.code}</strong><span>{entry.pending_count} chờ{entry.is_booked ? " · Đã chốt" : ""}</span>{entry.confirmed_brand && <small>{entry.confirmed_brand}</small>}</button>)}</div>{!positions.some((entry)=>entry.pending_count>0||entry.is_booked) && <p>Chưa có đề xuất đang chờ hoặc gian hàng đã chốt.</p>}</section>}
        </div>
        {!authReady || authError ? <aside className="booth-form-card"><p role="status">{authError || "Đang kiểm tra phiên đăng nhập…"}</p><Link href="/booths/admin/login">Đăng nhập quản trị ↗</Link></aside> : admin && position ? <BoothAdminPanel key={position.id} position={position} positions={positions} onSelect={setSelected} onChanged={refresh} onUnauthorized={unauthorized} /> :
        <aside className="booth-form-card" aria-label="Gửi đề xuất gian hàng">
          <div className="booth-form-heading"><span className="booth-kicker">VỊ TRÍ BẠN QUAN TÂM</span><div><h2>{position?.code}</h2><span>Khu {position?.zone}<br />{position?.is_booked ? "Đã xác nhận" : "Đang nhận đề xuất"}</span></div></div>
          <label className="booth-field">Chọn nhanh vị trí<select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>{positions.map((item) => <option value={item.id} key={item.id}>{item.code} · Khu {item.zone}{item.is_booked ? " · Đã xác nhận" : item.pending_count ? ` · ${item.pending_count} đề xuất` : " · Đang mở"}</option>)}</select></label>
          {position?.is_booked ? <div className="booth-reserved"><span>ĐÃ XÁC NHẬN</span><h3>{position.confirmed_booth}</h3><p>{position.confirmed_brand}</p><p>Vị trí này đã được ban tổ chức chốt. Mời bạn chọn một vị trí khác trên sơ đồ.</p></div> : success ? <div className="booth-success" role="status" tabIndex={-1} ref={messageRef}><span className="booth-kicker">ĐÃ NHẬN ĐỀ XUẤT</span><h3>Cảm ơn bạn đã đồng hành.</h3><p>Đề xuất cho vị trí <strong>{success.code}</strong> đang chờ xét duyệt.</p><div className="booth-reference">{success.reference}</div><p>Lưu mã này để trao đổi với ban tổ chức. Đây chưa phải xác nhận giữ chỗ; ban tổ chức sẽ liên hệ qua email hoặc số điện thoại bạn cung cấp.</p><button className="booth-button secondary" type="button" onClick={() => { setSuccess(null); requestKey.current = null; setPreviews([]); setFormVersion((value) => value + 1); }}>Gửi một đề xuất khác</button></div> : <>
            <p className="booth-form-hint">{position?.pending_count ? `Vị trí này có ${position.pending_count} đề xuất đang chờ. Bạn vẫn có thể gửi đề xuất của mình.` : "Vị trí này chưa có đề xuất đang chờ."} Gửi đề xuất không đồng nghĩa với giữ chỗ.</p>
            <form key={formVersion} onSubmit={submit}>
              <fieldset disabled={busy || !configured || Boolean(error)}>
                <label className="booth-field">Thương hiệu / đơn vị *<input name="brand" required minLength={2} maxLength={120} autoComplete="organization" placeholder="Tên thương hiệu của bạn" /></label>
                <label className="booth-field">Tên gian hàng *<input name="booth_name" required minLength={2} maxLength={120} placeholder="Một cái tên kể câu chuyện riêng" /></label>
                <label className="booth-field">Nhóm sản phẩm / hoạt động *<select name="category" required defaultValue=""><option value="" disabled>Chọn lĩnh vực</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="booth-field">Người liên hệ *<input name="contact_name" required minLength={2} maxLength={100} autoComplete="name" /></label>
                <div className="booth-field-pair"><label className="booth-field">Điện thoại *<input name="phone" required type="tel" minLength={8} maxLength={24} autoComplete="tel" /></label><label className="booth-field">Email *<input name="email" required type="email" maxLength={254} autoComplete="email" /></label></div>
                <label className="booth-field">Website / trang thương hiệu<input name="website" type="url" maxLength={300} placeholder="https://…" /></label>
                <label className="booth-field">Câu chuyện & nội dung gian hàng<textarea name="description" maxLength={2000} rows={4} placeholder="Bạn sẽ mang sản phẩm, trải nghiệm hay hoạt động gì đến sự kiện?" /></label>
                <label className="booth-field">Ảnh giới thiệu (không bắt buộc)<input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  const invalid = files.length > 3 || files.some((file) => file.size > 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type));
                  setImageError(invalid ? "Tối đa 3 ảnh JPEG, PNG hoặc WebP; mỗi ảnh tối đa 1 MB." : ""); setPreviews(invalid ? [] : files.map((file) => URL.createObjectURL(file)));
                }} /><small>Tối đa 3 ảnh JPEG, PNG hoặc WebP. Mỗi ảnh tối đa 1 MB.</small></label>
                {previews.length > 0 && <div className="booth-image-previews">{previews.map((url, index) => <span key={url}><Image src={url} width={70} height={70} unoptimized alt={`Ảnh đính kèm ${index + 1}`} /></span>)}</div>}
                {imageError && <p className="booth-inline-error" role="alert">{imageError}</p>}
                <div className="booth-honeypot" aria-hidden="true"><label>Không nhập trường này<input name="website_confirm" tabIndex={-1} autoComplete="off" /></label></div>
                <label className="booth-consent"><input type="checkbox" name="consent" required /><span>Tôi đồng ý để ban tổ chức lưu thông tin và liên hệ xét duyệt. Tên thương hiệu/gian hàng có thể hiển thị công khai sau khi được duyệt; thông tin liên hệ và ảnh chỉ dành cho quản trị.</span></label>
                {submitError && <div className="booth-alert error" role="alert" ref={messageRef} tabIndex={-1}>{submitError}</div>}
                <button type="submit" className="booth-button" disabled={Boolean(imageError)}>{busy ? "Đang gửi đề xuất…" : `Gửi đề xuất cho ${position?.code}`}<span aria-hidden="true">↗</span></button>
              </fieldset>
            </form>
          </>}
        </aside>}
      </div>
    </>}
    <section className="booth-faq"><span className="booth-kicker">TRƯỚC KHI GỬI ĐỀ XUẤT</span><h2>Một vài điều cần biết.</h2><details><summary>Gửi đề xuất có giữ chỗ cho tôi không?</summary><p>Chưa. Một vị trí có thể nhận nhiều đề xuất cùng lúc. Chỉ đề xuất được admin duyệt mới xác nhận vị trí; các đề xuất khác của cùng vị trí sẽ được đóng.</p></details><details><summary>Tôi có cần tạo tài khoản không?</summary><p>Không. Bạn chỉ cần điền thông tin liên hệ chính xác để ban tổ chức có thể trao đổi và phản hồi.</p></details><details><summary>Chi phí, diện tích và tiện ích gian hàng thế nào?</summary><p>Đây là sơ đồ ý tưởng. Chi phí, mặt bằng thực tế, lịch tổ chức và tiện ích sẽ được ban tổ chức trao đổi trước khi chốt tham gia. Website chưa thực hiện thu phí hoặc thanh toán.</p></details></section>
  </main>;
}
