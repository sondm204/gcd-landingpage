"use client";
import { useLocale } from "next-intl";
import { useCopy, useLocalizedData } from "@/i18n/copy";

import BoothPaymentReview from "./booth-payment-review";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { BoothPosition, BoothProposal, ProposalStatus } from "@/lib/booths/types";
import BoothEditor from "./booth-editor";

const labelsSource: Record<ProposalStatus,string> = { pending: "Chờ duyệt", approved: "Đã xác nhận", rejected: "Đã từ chối" };
const date = (value: string, locale: string) => new Date(value).toLocaleString(locale, { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });

export default function BoothAdminPanel({ position, positions, onSelect, onChanged, onUnauthorized }: { position: BoothPosition; positions: BoothPosition[]; onSelect: (id: number) => void; onChanged: () => Promise<void>; onUnauthorized: () => void }) {
  const t = useCopy();
  const locale = useLocale();
  const labels = useLocalizedData(labelsSource);
  const [items,setItems] = useState<BoothProposal[]>([]);
  const [status,setStatus] = useState(position.is_booked ? "approved" : "pending");
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [revision,setRevision] = useState(0);
  const [selected,setSelected] = useState<string | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [actionError,setActionError] = useState("");
  const [notice,setNotice] = useState("");
  const [decision,setDecision] = useState<"approved" | "rejected" | null>(null);
  const [note,setNote] = useState("");
  const [busy,setBusy] = useState(false);
  const [editing,setEditing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const item = items.find((entry) => entry.id === selected) || items[0];
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/booths/admin/proposals?status=${status}&position=${position.id}&page=${page}`, { cache: "no-store", signal });
      const data = await response.json();
      if ([401,403].includes(response.status)) { onUnauthorized(); return; }
      if (!response.ok) throw new Error(data.error_code || data.error || t("Không tải được đề xuất."));
      setItems(data.proposals); setTotal(data.total); setError("");
      if (!data.proposals.length && page>1) setPage(Math.max(1,Math.ceil(data.total/20)));
    } catch (err) { if (!signal?.aborted) { setError(err instanceof Error ? err.message : t("Mất kết nối.")); setItems([]); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [position.id,status,page,onUnauthorized,t]);
  useEffect(() => {
    const controller = new AbortController();
    // Async network completion synchronizes the selected position's proposals.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal); return () => controller.abort();
  }, [load,revision]);
  useEffect(() => { const node=dialog.current; if (decision) node?.showModal(); else node?.close(); return () => node?.close(); }, [decision]);
  async function review(event: React.FormEvent) {
    event.preventDefault(); if (!item || !decision || busy) return;
    setBusy(true); setNotice(""); setError(""); setActionError("");
    try {
      const response=await fetch(`/api/booths/admin/proposals/${item.id}`, { method: "PATCH", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ decision,note }) });
      const data=await response.json();
      if ([401,403].includes(response.status)) { onUnauthorized(); return; }
      if (!response.ok) throw new Error(data.error_code || data.error || t("Không thể xét duyệt."));
      setNotice(decision==="approved" ? t("Đã chốt {v0} tại {v1}. Những đề xuất đang chờ khác tại ô này đã được đóng.", { v0: item.brand, v1: position.code }) : t("Đã từ chối {v0}. Các đề xuất khác không bị ảnh hưởng.", { v0: item.brand }));
      setStatus(decision==="approved" ? "approved" : status); setSelected(null); await onChanged();
    } catch (err) { setActionError(err instanceof Error ? err.message : t("Mất kết nối. Vui lòng tải lại để kiểm tra.")); }
    finally { setDecision(null); setBusy(false); setRevision((value)=>value+1); }
  }
  async function saved(destination: number) {
    setEditing(false); setNotice(t("Đã cập nhật gian hàng.")); await onChanged();
    if (destination!==position.id) onSelect(destination);
    else setRevision((value)=>value+1);
  }
  return <aside className="booth-admin-panel" aria-label={t("Quản trị vị trí {v0}", { v0: position.code })}>
    <div className="booth-form-heading"><span className="booth-kicker">{t("QUẢN TRỊ THEO VỊ TRÍ")}</span><div><h2>{position.code}</h2><span>{t("Khu") } {t(position.zone)}<br />{position.pending_count} {t("đề xuất chờ")}{position.is_booked ? t(" · Đã chốt") : ""}</span></div></div>
    <label className="booth-field">{t("Chọn nhanh vị trí")}<select value={position.id} disabled={editing || busy} onChange={(event)=>onSelect(Number(event.target.value))}>{positions.map((entry)=><option key={entry.id} value={entry.id}>{entry.code} · {entry.pending_count} {t("chờ")}{entry.is_booked ? t(" · Đã chốt") : ""}</option>)}</select></label>
    {!editing && <div className="booth-position-filters"><label className="booth-field">{t("Hồ sơ tại ô này")}<select value={status} disabled={busy} onChange={(event)=>{setStatus(event.target.value);setPage(1);setSelected(null);}}><option value="pending">{t("Chờ duyệt")}</option><option value="approved">{t("Đã xác nhận")}</option><option value="rejected">{t("Đã từ chối")}</option><option value="all">{t("Tất cả đề xuất")}</option></select></label><button className="booth-button secondary compact" type="button" disabled={loading||busy} onClick={()=>setRevision((value)=>value+1)}>{t("Tải lại")}</button></div>}
    {notice && <div className="booth-alert" role="status">{t(notice)}</div>}{(actionError || error) && <div className="booth-alert error" role="alert">{t(actionError || error)}</div>}
    {loading ? <p role="status">{t("Đang tải đề xuất của")} {position.code}…</p> : editing && item ? <BoothEditor key={`${item.id}:${item.updated_at}`} proposal={item} positions={positions} onSaved={saved} onCancel={()=>{setEditing(false);setRevision((value)=>value+1);}} /> : <>
      {!items.length ? <div className="booth-alert">{t("Chưa có đề xuất trong bộ lọc này.")}{position.is_booked && status!=="approved" && <button type="button" onClick={()=>{setStatus("approved");setPage(1);}}>{t("Xem gian hàng đã chốt")}</button>}</div> : <>
        <div className="booth-proposal-count">{total} {t("hồ sơ tại")} {position.code} {t("trong bộ lọc này")}</div>
        <div className="booth-admin-list" aria-label={t("Các đề xuất tại {v0}", { v0: position.code })}>{items.map((entry)=><button key={entry.id} type="button" disabled={busy} className={`booth-admin-item ${item?.id===entry.id ? "selected" : ""}`} aria-pressed={item?.id===entry.id} onClick={()=>setSelected(entry.id)}><div><strong>{position.code} · {entry.brand}</strong><span className={`booth-status ${entry.status}`}>{labels[entry.status]}</span></div><p>{entry.booth_name}</p><small>{entry.reference} · {date(entry.created_at, locale)}</small></button>)}</div>
        {total>20 && <div className="booth-pagination"><button type="button" disabled={page<=1||busy} onClick={()=>setPage((value)=>value-1)}>{t("← Trước")}</button><span>{page}/{Math.ceil(total/20)}</span><button type="button" disabled={page*20>=total||busy} onClick={()=>setPage((value)=>value+1)}>Sau →</button></div>}
        {item && <article className="booth-admin-detail"><span className="booth-kicker">{item.reference}</span><h2>{item.booth_name}</h2><dl className="booth-admin-meta"><div><dt>{t("Thương hiệu")}</dt><dd>{item.brand}</dd></div><div><dt>{t("Lĩnh vực")}</dt><dd>{item.category}</dd></div><div><dt>{t("Người liên hệ")}</dt><dd>{item.contact_name}</dd></div><div><dt>{t("Điện thoại")}</dt><dd><a href={`tel:${item.phone.replace(/[^+\d]/g,"")}`}>{item.phone}</a></dd></div><div><dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd></div><div><dt>Website</dt><dd>{item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer">{item.website} ↗</a> : t("Chưa cung cấp")}</dd></div></dl><p>{item.description}</p><BoothPaymentReview proposal={item} /><div className="booth-admin-images">{item.image_urls?.filter(Boolean).map((url,index)=><a key={url} href={url} target="_blank" rel="noopener noreferrer"><Image unoptimized src={url} width={130} height={110} alt={t("Ảnh giới thiệu {v0} {v1}", { v0: item.booth_name, v1: index+1 })} /></a>)}</div>{item.review_note && <p className="booth-alert">{item.review_note}</p>}{item.status==="approved" && <button type="button" className="booth-button" onClick={()=>setEditing(true)}>{t("Sửa thông tin / ảnh / vị trí")}</button>}{item.status==="pending" && <div className="booth-admin-actions"><button type="button" className="booth-button" disabled={busy} onClick={()=>{setNote("");setDecision("approved");}}>{t("Duyệt & chốt")} {position.code}</button><button type="button" className="booth-button secondary" disabled={busy} onClick={()=>{setNote("");setDecision("rejected");}}>{t("Từ chối đề xuất")}</button></div>}</article>}
      </>}
    </>}
    <dialog ref={dialog} className="booth-review-dialog" aria-labelledby="position-review-title" onCancel={(event)=>{if(busy)event.preventDefault();else setDecision(null);}}><form onSubmit={review}><h2 id="position-review-title">{decision==="approved" ? t("Chốt vị trí {v0}?", { v0: position.code }) : t("Từ chối đề xuất?")}</h2><p>{decision==="approved" ? t("Xác nhận {v0}. Các đề xuất đang chờ khác tại {v1} sẽ được đóng.", { v0: item?.brand, v1: position.code }) : t("Đóng đề xuất của {v0}.", { v0: item?.brand })}</p><label className="booth-field">{t("Ghi chú xét duyệt")}<textarea value={note} onChange={(event)=>setNote(event.target.value)} rows={3} maxLength={1000} disabled={busy} /></label><div className="booth-admin-actions"><button type="button" className="booth-button secondary" disabled={busy} onClick={()=>setDecision(null)}>{t("Quay lại")}</button><button type="submit" className="booth-button" disabled={busy}>{busy ? t("Đang xử lý…") : decision==="approved" ? t("Xác nhận duyệt") : t("Xác nhận từ chối")}</button></div></form></dialog>
  </aside>;
}
