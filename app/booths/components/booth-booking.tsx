"use client";
import { useCopy } from "@/i18n/copy";


import { useCallback, useEffect, useRef, useState } from "react";
import { isCommercialPosition, BOOTH_COUNT, POSITION_COUNT, BOOTH_ZONES, zoneForPosition, type BoothPosition } from "@/lib/booths/types";
import BoothZoneGuide from "./booth-zone-guide";
import BoothPayment from "./booth-payment";
import BoothVouchers from "./booth-vouchers";
import BoothZoneIcon from "./booth-zone-icon";
import BoothMap from "./booth-map";
import BoothLogo from "./booth-logo";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import BoothAdminPanel from "./booth-admin-panel";
import { captureBookingDraft, takeBookingDraft, restoreBookingFields } from "@/i18n/booking-draft";

const categories = ["Thủ công & làng nghề", "Ẩm thực", "Văn hoá & sáng tạo", "Thương hiệu & cộng đồng", "Khác"];

export default function BoothBooking() {
  const t = useCopy();
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
  const [paymentKey, setPaymentKey] = useState("");
  const [brand, setBrand] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);
  const registrationForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const save = (event: Event) => {
      if (busy) { event.preventDefault(); return; }
      if (registrationForm.current) captureBookingDraft(registrationForm.current, { selected, brand, discountCode, requestKey: requestKey.current });
    };
    window.addEventListener("i18n-before-switch", save);
    return () => window.removeEventListener("i18n-before-switch", save);
  }, [selected, brand, discountCode, busy]);
  useEffect(() => {
    if (loading || !authReady || admin) return;
    const saved = takeBookingDraft();
    if (!saved) return;
    const timer = setTimeout(() => {
      setSelected(saved.selected); setBrand(saved.brand); setDiscountCode(saved.discountCode);
      requestKey.current = saved.requestKey; setPaymentKey(saved.requestKey || "");
      requestAnimationFrame(() => {
        if (registrationForm.current) restoreBookingFields(registrationForm.current, saved);
        const files = saved.fields.find(field => field.name === "images")?.files;
        if (files) setPreviews(Array.from(files).map(file => URL.createObjectURL(file)));
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [loading, authReady, admin, t]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/booths", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_code || data.error);
      setPositions(data.positions); setConfigured(data.configured); setError("");
      requestKey.current ||= crypto.randomUUID(); setPaymentKey(requestKey.current);
      try {
        const session = await fetch("/api/booths/admin/session", { cache: "no-store", signal });
        const account = await session.json();
        if (!session.ok) throw new Error(account.error_code || account.error || t("Chưa thể kiểm tra phiên quản trị."));
        setAdmin(account.admin); setAuthError("");
      } catch (err) { if (!signal?.aborted) { setAdmin(null); setAuthError(err instanceof Error ? err.message : t("Không kiểm tra được phiên đăng nhập.")); } }
      finally { if (!signal?.aborted) setAuthReady(true); }
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : t("Chưa tải được sơ đồ.")); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [t]);
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
  const bookablePositions = positions.filter((item) => item.is_bookable);
  const selectedZone = zoneForPosition(selected);
  const booked = bookablePositions.filter((item) => item.is_booked).length;
  function selectPosition(id: number) {
    if (busy || !zoneForPosition(id)?.bookable) return;
    setSelected(id);
    setSubmitError("");
  }
  const unauthorized = useCallback(() => { setAdmin(null); setError(t("Phiên đăng nhập hoặc quyền quản trị đã thay đổi. Vui lòng đăng nhập lại.")); }, [t]);
  async function logout() {
    setLogoutBusy(true);
    try {
      const response = await fetch("/api/booths/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error(t("Chưa thể đăng xuất."));
      setAdmin(null); setAuthError(""); window.dispatchEvent(new Event("booth-auth-changed")); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : t("Mất kết nối.")); }
    finally { setLogoutBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !position?.is_bookable || position.is_booked || imageError || busy) return;
    const form = new FormData(event.currentTarget);
    form.set("position_id", String(position.id));
    form.set("consent", form.get("consent") === "on" ? "true" : "false");
    requestKey.current ||= crypto.randomUUID();
    setBusy(true); setSubmitError("");
    try {
      const response = await fetch("/api/booths/proposals", { method: "POST", headers: { "Idempotency-Key": requestKey.current }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_code || data.error || t("Chưa gửi được đề xuất."));
      setSuccess({ reference: data.reference, code: position.code });
      await refresh();
    } catch (err) { setSubmitError(err instanceof Error ? err.message : t("Mất kết nối. Bạn có thể thử gửi lại.")); }
    finally { setBusy(false); requestAnimationFrame(() => messageRef.current?.focus()); }
  }

  return <main className="booths-main">
    <section className="booths-intro"><div><span className="booth-kicker">{t("DÀNH CHO THƯƠNG HIỆU & ĐƠN VỊ ĐỒNG HÀNH")}</span><h1>{t("Chọn một góc nhỏ.")}<br /><em>{t("Mở ngàn kết nối.")}</em></h1><p>{t("Sơ đồ gồm 5 gian văn hoá, 5 gian tài trợ, 21 gian thương mại và 3 gian BTC. Chọn gian thương mại hoặc tài trợ phù hợp để gửi đề xuất tham gia.")}</p></div><div className="booths-intro-aside"><span className="booths-big-number">{POSITION_COUNT}<span>{t("VỊ TRÍ DỰ KIẾN")}</span></span><p><strong>{BOOTH_COUNT} {t("gian nhận đề xuất")}</strong><br />{t("5 gian văn hoá và 3 gian BTC đã bố trí.")}<br />{t("Chỉ xác nhận sau khi xét duyệt.")}</p></div></section>
    <BoothZoneGuide positions={positions} selected={selected} onSelect={(id) => { selectPosition(id); document.getElementById("booth-plan")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }} />
    <div className="booth-process"><span><b>01</b> {t("Chọn chủ đề & vị trí")}</span><span><b>02</b> {t("Gửi câu chuyện gian hàng")}</span><span><b>03</b> {t("Chờ ban tổ chức xét duyệt")}</span></div>
    {admin && <div className="booth-admin-mode"><div><span className="booth-kicker">{t("CHẾ ĐỘ QUẢN TRỊ")}</span><p>{admin.email} {t("· Chọn ô để xem đề xuất, xét duyệt hoặc sửa gian hàng đã chốt.")}</p></div><div className="booth-admin-toolbar"><BoothVouchers /><button type="button" className="booth-button secondary compact" disabled={logoutBusy} onClick={logout}>{logoutBusy ? t("Đang đăng xuất…") : t("Đăng xuất ↗")}</button></div></div>}
    {error && <div className="booth-alert error" role="alert">{t(error)} <button type="button" onClick={() => void refresh()}>{t("Tải lại sơ đồ")}</button></div>}
    {!loading && !configured && !error && <div className="booth-alert">{t("Đây là bản xem trước sơ đồ. Cổng nhận đề xuất chưa mở; chức năng gửi sẽ hoạt động khi ban tổ chức hoàn tất cấu hình.")}</div>}
    {loading ? <div className="booth-loading" role="status">{t("Đang mở sơ đồ gian hàng…")}</div> : positions.length > 0 && <>
      <div className="booth-availability"><span><strong>{bookablePositions.length - booked}</strong> {t("gian đang nhận đề xuất")}</span><span><strong>{booked}</strong> {t("gian đã xác nhận /")} {BOOTH_COUNT}</span><small>{t("Không tính gian văn hoá và BTC · Cập nhật mỗi 30 giây")}</small></div>
      <div id="booth-plan" className={`booth-booking-grid ${admin ? "is-admin" : ""}`}>
        <div className="booth-map-column"><BoothMap positions={positions} selected={selected} onSelect={selectPosition} />
          {admin && <section className="booth-group-overview" aria-label={t("Nhóm đề xuất theo vị trí")}><span className="booth-kicker">{t("TỔNG QUAN THEO VỊ TRÍ")}</span><h2>{t("Những ô đang có hồ sơ.")}</h2><p>{t("Bấm một nhóm để xem hồ sơ tương ứng bên cạnh.")}</p><div>{positions.filter((entry) => entry.pending_count>0 || entry.is_booked).map((entry) => <button type="button" key={entry.id} className={selected===entry.id ? "selected" : ""} aria-pressed={selected===entry.id} onClick={()=>setSelected(entry.id)}><strong>{entry.code}</strong><span>{entry.pending_count} {t("chờ")}{entry.is_booked ? t(" · Đã chốt") : ""}</span>{entry.confirmed_brand && <small>{entry.confirmed_brand}</small>}</button>)}</div>{!positions.some((entry)=>entry.pending_count>0||entry.is_booked) && <p>{t("Chưa có đề xuất đang chờ hoặc gian hàng đã chốt.")}</p>}</section>}
        </div>
        {!authReady || authError ? <aside className="booth-form-card"><p role="status">{t(authError) || t("Đang kiểm tra phiên đăng nhập…")}</p><Link href="/booths/admin/login">{t("Đăng nhập quản trị ↗")}</Link></aside> : admin && position ? <BoothAdminPanel key={position.id} position={position} positions={positions} onSelect={setSelected} onChanged={refresh} onUnauthorized={unauthorized} /> :
        <aside className="booth-form-card" aria-label={t("Gửi đề xuất gian hàng")}>
          <div className="booth-form-heading"><span className="booth-kicker">{t("VỊ TRÍ BẠN QUAN TÂM")}</span><div><h2>{position?.code}</h2><span>{t("Khu") } {t(position?.zone || "")}<br />{position?.is_booked ? t("Đã xác nhận") : t("Đang nhận đề xuất")}</span></div></div>
          <label className="booth-field">{t("Chọn nhanh vị trí")}<select value={selected} onChange={(event) => selectPosition(Number(event.target.value))}>{BOOTH_ZONES.map((zone) => <optgroup key={t(zone.name)} label={`${t(zone.name)} · ${t(zone.theme)}`}>{bookablePositions.filter((item) => item.zone === zone.name).map((item) => <option value={item.id} key={item.id}>{item.code} · Khu {t(item.zone)}{item.is_booked ? t(" · Đã xác nhận") : item.pending_count ? t(" · {v0} đề xuất", { v0: item.pending_count }) : t(" · Đang mở")}</option>)}</optgroup>)}</select></label>
          {selectedZone && <div className="booth-selected-zone" style={{ borderLeftColor: selectedZone.color, background: selectedZone.background }}><div className="booth-selected-zone-title"><BoothZoneIcon kind={selectedZone.icon} color={selectedZone.color} /><strong>{t(selectedZone.name)} · {t(selectedZone.theme)}</strong></div><p>{t(selectedZone.description)}</p><small>{t("Gợi ý:")} {selectedZone.examples.map(value => t(value)).join("; ")}.</small></div>}
          {position?.is_booked ? <div className="booth-reserved"><BoothLogo src={position.confirmed_logo_url} name={position.confirmed_brand || position.confirmed_booth || position.code} /><span>{t("ĐÃ XÁC NHẬN")}</span><h3>{position.confirmed_booth}</h3><p>{position.confirmed_brand}</p><p>{t("Vị trí này đã được ban tổ chức chốt. Mời bạn chọn một vị trí khác trên sơ đồ.")}</p></div> : success ? <div className="booth-success" role="status" tabIndex={-1} ref={messageRef}><span className="booth-kicker">{t("ĐÃ NHẬN ĐỀ XUẤT")}</span><h3>{t("Cảm ơn bạn đã đồng hành.")}</h3><p>{t("Đề xuất cho vị trí")} <strong>{success.code}</strong> {t("đang chờ xét duyệt.")}</p><div className="booth-reference">{success.reference}</div><p>{t("Lưu mã này để trao đổi với ban tổ chức. Đây chưa phải xác nhận giữ chỗ; ban tổ chức sẽ liên hệ qua email hoặc số điện thoại bạn cung cấp.")}</p><button className="booth-button secondary" type="button" onClick={() => { setSuccess(null); requestKey.current = crypto.randomUUID(); setPaymentKey(requestKey.current); setDiscountCode(""); setPreviews([]); setFormVersion((value) => value + 1); }}>{t("Gửi một đề xuất khác")}</button></div> : <>
            <p className="booth-form-hint">{position?.pending_count ? t("Vị trí này có {v0} đề xuất đang chờ. Bạn vẫn có thể gửi đề xuất của mình.", { v0: position.pending_count }) : t("Vị trí này chưa có đề xuất đang chờ.")} {t("Gửi đề xuất không đồng nghĩa với giữ chỗ.")}</p>
            <form id="booth-registration" ref={registrationForm} key={formVersion} onSubmit={submit}>
              <fieldset disabled={busy || !configured || Boolean(error)}>
                <div className="booth-form-hint"><strong>{t("Loại 9m²: Kích thước 3m x 3m x 2.5m")}</strong></div>
                {selectedZone?.prefix === "TM" && <div className="booth-form-hint"><strong>{t("Chi phí gian thương mại: 5.000.000đ / gian.")}</strong></div>}
                {selectedZone?.prefix === "TM" && <input type="hidden" name="discount_code" value={discountCode} />}
                <label className="booth-field">{t("Thương hiệu / đơn vị *")}<input name="brand" value={brand} onChange={e => setBrand(e.target.value)} required minLength={2} maxLength={120} autoComplete="organization" placeholder={t("Tên thương hiệu của bạn")} /></label>
                <label className="booth-field">{t("Tên gian hàng *")}<input name="booth_name" required minLength={2} maxLength={120} placeholder={t("Một cái tên kể câu chuyện riêng")} /></label>
                <label className="booth-field">{t("Nhóm sản phẩm / hoạt động *")}<select name="category" required defaultValue=""><option value="" disabled>{t("Chọn lĩnh vực")}</option>{categories.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label>
                <label className="booth-field">{t("Người liên hệ *")}<input name="contact_name" required minLength={2} maxLength={100} autoComplete="name" /></label>
                <div className="booth-field-pair"><label className="booth-field">{t("Điện thoại *")}<input name="phone" required type="tel" minLength={8} maxLength={24} autoComplete="tel" /></label><label className="booth-field">Email *<input name="email" required type="email" maxLength={254} autoComplete="email" /></label></div>
                <label className="booth-field">{t("Website / trang thương hiệu")}<input name="website" type="url" maxLength={300} placeholder="https://…" /></label>
                <label className="booth-field">{t("Câu chuyện & nội dung gian hàng")}<textarea name="description" maxLength={2000} rows={4} placeholder={t(selectedZone?.prompt || "") || t("Bạn sẽ mang sản phẩm, trải nghiệm hay hoạt động gì đến sự kiện?")} /><small>{t("Mô tả không bắt buộc. Chia sẻ ý tưởng sẽ giúp ban tổ chức đánh giá độ phù hợp với khu bạn chọn.")}</small></label>
                <label className="booth-field">{t("Logo & ảnh giới thiệu (ảnh đầu tiên làm logo sau khi duyệt)")}<input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  const invalid = files.length > 3 || files.some((file) => file.size > 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type));
                  setImageError(invalid ? t("Tối đa 3 ảnh JPEG, PNG hoặc WebP; mỗi ảnh tối đa 1 MB.") : ""); setPreviews(invalid ? [] : files.map((file) => URL.createObjectURL(file)));
                }} /><small>{t("Tối đa 3 ảnh JPEG, PNG hoặc WebP. Mỗi ảnh tối đa 1 MB.")}</small></label>
                {previews.length > 0 && <div className="booth-image-previews">{previews.map((url, index) => <span key={url}><Image src={url} width={70} height={70} unoptimized alt={t("Ảnh đính kèm {v0}", { v0: index + 1 })} /></span>)}</div>}
                {imageError && <p className="booth-inline-error" role="alert">{t(imageError)}</p>}
                <div className="booth-honeypot" aria-hidden="true"><label>{t("Không nhập trường này")}<input name="website_confirm" tabIndex={-1} autoComplete="off" /></label></div>
                <label className="booth-consent"><input type="checkbox" name="consent" required /><span>{t("Tôi đồng ý để ban tổ chức lưu thông tin và liên hệ xét duyệt. Tên thương hiệu/gian hàng có thể hiển thị công khai sau khi được duyệt; thông tin liên hệ và ảnh chỉ dành cho quản trị.")}</span></label>
                {submitError && <div className="booth-alert error" role="alert" ref={messageRef} tabIndex={-1}>{t(submitError)}</div>}
                {isCommercialPosition(selected) ? <BoothPayment key={selected + ":" + paymentKey + ":" + brand} position={selected} brand={brand} requestKey={paymentKey} code={discountCode} onApply={setDiscountCode} disabled={busy || !configured || Boolean(error)} submitError={t(submitError)} onPrepare={() => Boolean(registrationForm.current?.reportValidity()) && !imageError} onComplete={() => registrationForm.current?.requestSubmit()} /> : <button type="submit" className="booth-button" disabled={Boolean(imageError)}>{busy ? t("Đang gửi đề xuất…") : t("Gửi đề xuất cho {v0}", { v0: position?.code })}<span aria-hidden="true">↗</span></button>}
              </fieldset>
            </form>
          </>}
        </aside>}
      </div>
    </>}
    <section className="booth-faq"><span className="booth-kicker">{t("TRƯỚC KHI GỬI ĐỀ XUẤT")}</span><h2>{t("Một vài điều cần biết.")}</h2>
      <details><summary>{t("Tôi nên chọn loại gian nào?")}</summary><p>{t("Chọn gian thương mại để giới thiệu, bán sản phẩm hoặc dịch vụ. Chọn gian tài trợ để đề xuất đồng hành và quảng bá theo thỏa thuận với ban tổ chức. Gửi đề xuất chưa đồng nghĩa được xác nhận tham gia.")}</p></details>
      <details><summary>{t("Tôi có thể đăng ký gian văn hoá hoặc BTC không?")}</summary><p>{t("Không. VH01–VH05 đã có đơn vị phụ trách. BTC01–BTC02 hỗ trợ khách và BTC03 phục vụ đổi quà. Chỉ TM01–TM21 và TT01–TT05 nhận đề xuất mới.")}</p></details>
      <details><summary>{t("Gửi đề xuất có giữ chỗ cho tôi không?")}</summary><p>{t("Chưa. Một vị trí có thể nhận nhiều đề xuất cùng lúc. Chỉ đề xuất được admin duyệt mới xác nhận vị trí; các đề xuất khác của cùng vị trí sẽ được đóng.")}</p></details><details><summary>{t("Tôi có cần tạo tài khoản không?")}</summary><p>{t("Không. Bạn chỉ cần điền thông tin liên hệ chính xác để ban tổ chức có thể trao đổi và phản hồi.")}</p></details><details><summary>{t("Chi phí, diện tích và tiện ích gian hàng thế nào?")}</summary><p>{t("Đây là sơ đồ ý tưởng. Chi phí, mặt bằng thực tế, lịch tổ chức và tiện ích sẽ được ban tổ chức trao đổi trước khi chốt tham gia. Gian thương mại có giá 5.000.000đ/gian; mã giảm giá hợp lệ được tính trước khi tạo QR. Ban tổ chức đối soát chuyển khoản trước khi xác nhận.")}</p></details></section>
  </main>;
}
