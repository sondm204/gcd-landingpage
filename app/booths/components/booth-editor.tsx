"use client";
import { useCopy } from "@/i18n/copy";


import Image from "next/image";
import { useEffect, useState } from "react";
import { conceptPositions, type BoothPosition, type BoothProposal } from "@/lib/booths/types";

const code = (id: number) => conceptPositions().find(p => p.id === id)?.code ?? String(id);
const categories = ["Thủ công & làng nghề", "Ẩm thực", "Văn hoá & sáng tạo", "Thương hiệu & cộng đồng", "Khác"];

export default function BoothEditor({ proposal, positions, onSaved, onCancel }: { proposal: BoothProposal; positions: BoothPosition[]; onSaved: (position: number) => Promise<void>; onCancel: () => void }) {
  const t = useCopy();
  const [target, setTarget] = useState(proposal.position_id);
  const [retained, setRetained] = useState(proposal.image_paths);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => () => newImages.forEach(URL.revokeObjectURL), [newImages]);
  const moving = target !== proposal.position_id;
  const targetPosition = positions.find((item) => item.id === target);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || imageError || retained.length + imageCount > 3 || !targetPosition?.is_bookable) return;
    const body = new FormData(event.currentTarget);
    body.set("expected_updated_at", proposal.updated_at);
    body.set("retained_images", JSON.stringify(retained));
    body.set("confirm_move", body.get("confirm_move") === "on" ? "true" : "false");
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/booths/admin/proposals/${proposal.id}/details`, { method: "PATCH", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_code || data.error || t("Không thể lưu thay đổi."));
      await onSaved(data.position_id);
    } catch (err) { setError(err instanceof Error ? err.message : t("Mất kết nối. Hãy tải lại dữ liệu để kiểm tra trước khi gửi lại.")); }
    finally { setBusy(false); }
  }
  return <form className="booth-edit-form" onSubmit={save}>
    <span className="booth-kicker">{t("CHỈNH SỬA GIAN HÀNG ĐÃ CHỐT")}</span><h3>{proposal.brand}</h3>
    <fieldset disabled={busy}>
      <label className="booth-field">{t("Thương hiệu / đơn vị *")}<input name="brand" defaultValue={proposal.brand} required minLength={2} maxLength={120} /></label>
      <label className="booth-field">{t("Tên gian hàng *")}<input name="booth_name" defaultValue={proposal.booth_name} required minLength={2} maxLength={120} /></label>
      <label className="booth-field">{t("Vị trí gian hàng")}<select name="position_id" value={target} onChange={(event) => setTarget(Number(event.target.value))}>{positions.filter((item) => item.is_bookable).map((item) => <option key={item.id} value={item.id} disabled={(item.is_booked || item.is_locked) && item.id !== proposal.position_id}>{item.code === "TT06" ? t("boothGiftPosition") : item.code} · Khu {t(item.zone)}{item.id === proposal.position_id ? t(" · Hiện tại") : item.is_locked ? t("Tạm khóa đăng ký") : item.is_booked ? t(" · Đã chốt") : item.pending_count ? t(" · {v0} đề xuất chờ", { v0: item.pending_count }) : t(" · Có thể chuyển đến")}</option>)}</select></label>
      {moving && <div className="booth-alert">{t("Chuyển từ")} <strong>{code(proposal.position_id)}</strong> {t("sang") } <strong>{code(target)}</strong>{t(". Ô cũ sẽ mở lại.")}{Boolean(targetPosition?.pending_count) && <p>{targetPosition?.pending_count} {t("đề xuất đang chờ ở ô đích sẽ được đóng khi lưu.")}</p>}<label className="booth-consent"><input type="checkbox" name="confirm_move" required /><span>{t("Tôi xác nhận chuyển vị trí và đóng các đề xuất đang chờ tại ô đích.")}</span></label></div>}
      <label className="booth-field">{t("Nhóm sản phẩm / hoạt động")}<select name="category" defaultValue={proposal.category}>{categories.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label>
      <label className="booth-field">{t("Người liên hệ *")}<input name="contact_name" defaultValue={proposal.contact_name} required minLength={2} maxLength={100} /></label>
      <div className="booth-field-pair"><label className="booth-field">{t("Điện thoại *")}<input name="phone" type="tel" defaultValue={proposal.phone} required maxLength={24} /></label><label className="booth-field">Email *<input name="email" type="email" defaultValue={proposal.email} required maxLength={254} /></label></div>
      <label className="booth-field">Website<input name="website" type="url" defaultValue={proposal.website || ""} maxLength={300} /></label>
      <label className="booth-field">{t("Câu chuyện & nội dung gian hàng")}<textarea name="description" defaultValue={proposal.description} maxLength={2000} rows={4} /></label>
      {proposal.image_paths.length > 0 && <div className="booth-retained-images"><p>{t("Ảnh hiện tại — bỏ chọn để xoá khỏi gian hàng:")}</p>{proposal.image_paths.map((path,index) => <label key={path}>{proposal.image_urls?.[index] && <Image src={proposal.image_urls[index]} unoptimized width={90} height={75} alt={t("Ảnh hiện tại {v0}", { v0: index+1 })} />}<span><input type="checkbox" checked={retained.includes(path)} onChange={() => setRetained((items) => items.includes(path) ? items.filter((value) => value !== path) : [...items,path])} /> {t("Giữ ảnh")} {index+1}</span></label>)}</div>}
      <label className="booth-field">{t("Thêm ảnh mới")}<input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const files = Array.from(event.target.files || []);
        const invalid = files.length > 3 || files.some((file) => file.size > 1024*1024 || !["image/jpeg","image/png","image/webp"].includes(file.type));
        setImageCount(files.length); setImageError(invalid ? t("Ảnh phải là JPEG/PNG/WebP, mỗi ảnh tối đa 1 MB.") : ""); setNewImages(invalid ? [] : files.map((file) => URL.createObjectURL(file)));
      }} /><small>{t("Tổng ảnh giữ lại và thêm mới: tối đa 3 ảnh; mỗi ảnh tối đa 1 MB.")}</small></label>
      <div className="booth-image-previews">{newImages.map((src,index) => <Image key={src} src={src} width={70} height={70} unoptimized alt={t("Ảnh mới {v0}", { v0: index+1 })} />)}</div>
      {(imageError || retained.length + imageCount > 3) && <p className="booth-inline-error" role="alert">{imageError || t("Tổng ảnh giữ lại và thêm mới không được quá 3.")}</p>}
      <label className="booth-field">{t("Ghi chú thay đổi")}<textarea name="note" rows={2} maxLength={1000} placeholder={t("Lý do đổi tên, ảnh hoặc vị trí…")} /></label>
      {error && <div className="booth-alert error" role="alert">{t(error)}</div>}
      <div className="booth-admin-actions"><button type="button" className="booth-button secondary" onClick={onCancel}>{t("Huỷ chỉnh sửa")}</button><button type="submit" className="booth-button" disabled={Boolean(imageError) || retained.length + imageCount > 3}>{busy ? t("Đang lưu…") : t("Lưu thay đổi")}</button></div>
    </fieldset>
  </form>;
}
