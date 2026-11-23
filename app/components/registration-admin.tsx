"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCopy } from "@/i18n/copy";
import AdminExportButton from "./admin-export-button";

type Attendee = { id: string; reference: string; full_name: string; birth_date: string; phone: string; email: string; facebook_url: string; is_jci: boolean; chapter: string; created_at: string };
const defaults = { q: "", jci: "all", from: "", to: "", sort: "newest", page_size: "20" };
type Filters = typeof defaults;
function params(filters: Filters, page?: number) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""));
  if (page) query.set("page", String(page));
  return query.toString();
}

export default function RegistrationAdmin() {
  const t = useCopy(), locale = useLocale();
  const [draft, setDraft] = useState(defaults), [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ registrations: Attendee[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [unauthorized, setUnauthorized] = useState(false);
  const query = params(filters, page), size = Number(filters.page_size), pages = Math.max(1, Math.ceil((result?.total || 0) / size));
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setResult(null); setUnauthorized(false);
      try {
        const response = await fetch(`/api/registrations/admin?${query}`, { cache: "no-store", signal: controller.signal }), data = await response.json();
        if (controller.signal.aborted) return;
        if ([401, 403].includes(response.status)) { setUnauthorized(true); return; }
        if (!response.ok) throw new Error(data.error_code || data.error || t("Chưa tải được danh sách người đăng ký."));
        const last = Math.max(1, Math.ceil(data.total / size));
        if (page > last) { setPage(last); return; }
        setResult(data);
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t("Mất kết nối. Vui lòng thử lại.")); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    // The API response synchronizes the selected filters and page.
    void load();
    return () => controller.abort();
  }, [query, revision, page, size, t]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("booth-auth-changed", refresh);
    return () => window.removeEventListener("booth-auth-changed", refresh);
  }, []);
  function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFilters({ ...draft }); setPage(1); setRevision(value => value + 1); }
  const change = (key: keyof Filters, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const date = (value: string) => new Date(value).toLocaleString(locale, { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });
  return <main className="registration-admin">
    <div className="registration-admin-heading"><div><span className="booth-kicker">{t("KHÔNG GIAN BAN TỔ CHỨC")}</span><h1>{t("Người tham dự")}</h1><p>{t("Tra cứu và quản lý danh sách đăng ký sự kiện.")}</p></div><Link className="booth-button secondary compact" href="/booths">{t("Quản trị gian hàng")} ↗</Link></div>
    {unauthorized ? <section className="registration-admin-login"><h2>{t("Cần quyền quản trị")}</h2><p>{t("Đăng nhập bằng tài khoản ban tổ chức để xem danh sách và xuất dữ liệu.")}</p><Link className="booth-button" href="/register/admin/login">{t("Đăng nhập quản trị")} ↗</Link></section> : <>
      <form className="registration-filters" onSubmit={apply} aria-label={t("Bộ lọc người tham dự")}>
        <label className="booth-field registration-search">{t("Tìm kiếm người đăng ký")}<input type="search" value={draft.q} maxLength={120} placeholder={t("Tên, SĐT, email, chapter hoặc mã đăng ký")} onChange={e => change("q", e.target.value)} /></label>
        <label className="booth-field">{t("Hoạt động JCI")}<select value={draft.jci} onChange={e => change("jci", e.target.value)}><option value="all">{t("Tất cả")}</option><option value="yes">{t("Có hoạt động JCI")}</option><option value="no">{t("Không hoạt động JCI")}</option></select></label>
        <label className="booth-field">{t("Đăng ký từ ngày")}<input type="date" value={draft.from} max={draft.to || undefined} onChange={e => change("from", e.target.value)} /></label>
        <label className="booth-field">{t("Đến ngày")}<input type="date" value={draft.to} min={draft.from || undefined} onChange={e => change("to", e.target.value)} /></label>
        <label className="booth-field">{t("Sắp xếp")}<select value={draft.sort} onChange={e => change("sort", e.target.value)}><option value="newest">{t("Mới nhất trước")}</option><option value="oldest">{t("Cũ nhất trước")}</option></select></label>
        <label className="booth-field">{t("Số hồ sơ mỗi trang")}<select value={draft.page_size} onChange={e => change("page_size", e.target.value)}>{[20, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <div className="registration-filter-actions"><button className="booth-button compact" type="submit">{t("Áp dụng bộ lọc")}</button><button className="booth-button secondary compact" type="button" onClick={() => { setDraft(defaults); setFilters(defaults); setPage(1); setRevision(value => value + 1); }}>{t("Xóa bộ lọc")}</button></div>
      </form>
      <div className="registration-results-toolbar"><div><strong aria-live="polite">{loading ? t("Đang tải…") : t("{v0} người đăng ký", { v0: result?.total ?? 0 })}</strong><p>{t("Xuất toàn bộ kết quả phù hợp, không chỉ trang hiện tại.")}</p></div><div className="registration-export-actions"><button className="booth-button secondary compact" type="button" disabled={loading} onClick={() => setRevision(value => value + 1)}>{t("Tải lại")}</button><AdminExportButton href={`/api/registrations/admin/export?${params(filters)}`} label={t("Xuất Excel theo bộ lọc")} disabled={loading || !result} /></div></div>
      {error && <div className="booth-alert error" role="alert">{t(error)}</div>}
      <div className="registration-table-scroll" role="region" aria-label={t("Danh sách người tham dự")} tabIndex={0} aria-busy={loading}>
        <table className="registration-table"><caption className="sr-only">{t("Danh sách người tham dự")}</caption><thead><tr>{["Mã đăng ký", "Họ và tên", "Ngày sinh", "Số điện thoại", "Email", "Facebook", "Hoạt động JCI", "Chapter", "Ngày đăng ký"].map(label => <th key={label} scope="col">{t(label)}</th>)}</tr></thead><tbody>
          {result?.registrations.map(item => <tr key={item.id}><td><code>{item.reference}</code></td><th scope="row">{item.full_name}</th><td>{item.birth_date.split("-").reverse().join("/")}</td><td><a href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}>{item.phone}</a></td><td><a href={`mailto:${item.email}`}>{item.email}</a></td><td><a href={item.facebook_url} target="_blank" rel="noopener noreferrer">{t("Trang cá nhân")} ↗</a></td><td><span className={`registration-jci ${item.is_jci ? "yes" : ""}`}>{item.is_jci ? t("Có") : t("Không")}</span></td><td>{item.chapter || "—"}</td><td>{date(item.created_at)}</td></tr>)}
          {!result?.registrations.length && <tr><td colSpan={9} className="registration-empty">{loading ? t("Đang tải danh sách…") : error ? t("Hãy tải lại để thử kết nối.") : t("Chưa có người đăng ký phù hợp với bộ lọc.")}</td></tr>}
        </tbody></table>
      </div>
      <nav className="registration-pagination" aria-label={t("Phân trang người tham dự")}><span>{t("Trang {v0} / {v1}", { v0: page, v1: pages })}{result && result.total > 0 && ` · ${(page - 1) * size + 1}–${Math.min(page * size, result.total)} / ${result.total}`}</span><div><button type="button" disabled={loading || page <= 1} onClick={() => setPage(1)}>{t("Đầu")}</button><button type="button" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>{t("← Trước")}</button><button type="button" disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)}>{t("Sau →")}</button><button type="button" disabled={loading || page >= pages} onClick={() => setPage(pages)}>{t("Cuối")}</button></div></nav>
    </>}
  </main>;
}
