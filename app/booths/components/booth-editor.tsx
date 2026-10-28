"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { BoothPosition, BoothProposal } from "@/lib/booths/types";

const code = (id: number) => `B${String(id).padStart(2,"0")}`;
const categories = ["Thủ công & làng nghề", "Ẩm thực", "Văn hoá & sáng tạo", "Thương hiệu & cộng đồng", "Khác"];

export default function BoothEditor({ proposal, positions, onSaved, onCancel }: { proposal: BoothProposal; positions: BoothPosition[]; onSaved: (position: number) => Promise<void>; onCancel: () => void }) {
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
    if (busy || imageError || retained.length + imageCount > 3) return;
    const body = new FormData(event.currentTarget);
    body.set("expected_updated_at", proposal.updated_at);
    body.set("retained_images", JSON.stringify(retained));
    body.set("confirm_move", body.get("confirm_move") === "on" ? "true" : "false");
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/booths/admin/proposals/${proposal.id}/details`, { method: "PATCH", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể lưu thay đổi.");
      await onSaved(data.position_id);
    } catch (err) { setError(err instanceof Error ? err.message : "Mất kết nối. Hãy tải lại dữ liệu để kiểm tra trước khi gửi lại."); }
    finally { setBusy(false); }
  }
  return <form className="booth-edit-form" onSubmit={save}>
    <span className="booth-kicker">CHỈNH SỬA GIAN HÀNG ĐÃ CHỐT</span><h3>{proposal.brand}</h3>
    <fieldset disabled={busy}>
      <label className="booth-field">Thương hiệu / đơn vị *<input name="brand" defaultValue={proposal.brand} required minLength={2} maxLength={120} /></label>
      <label className="booth-field">Tên gian hàng *<input name="booth_name" defaultValue={proposal.booth_name} required minLength={2} maxLength={120} /></label>
      <label className="booth-field">Vị trí gian hàng<select name="position_id" value={target} onChange={(event) => setTarget(Number(event.target.value))}>{positions.map((item) => <option key={item.id} value={item.id} disabled={item.is_booked && item.id !== proposal.position_id}>{item.code} · Khu {item.zone}{item.id === proposal.position_id ? " · Hiện tại" : item.is_booked ? " · Đã chốt" : item.pending_count ? ` · ${item.pending_count} đề xuất chờ` : " · Có thể chuyển đến"}</option>)}</select></label>
      {moving && <div className="booth-alert">Chuyển từ <strong>{code(proposal.position_id)}</strong> sang <strong>{code(target)}</strong>. Ô cũ sẽ mở lại.{Boolean(targetPosition?.pending_count) && <p>{targetPosition?.pending_count} đề xuất đang chờ ở ô đích sẽ được đóng khi lưu.</p>}<label className="booth-consent"><input type="checkbox" name="confirm_move" required /><span>Tôi xác nhận chuyển vị trí và đóng các đề xuất đang chờ tại ô đích.</span></label></div>}
      <label className="booth-field">Nhóm sản phẩm / hoạt động<select name="category" defaultValue={proposal.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="booth-field">Người liên hệ *<input name="contact_name" defaultValue={proposal.contact_name} required minLength={2} maxLength={100} /></label>
      <div className="booth-field-pair"><label className="booth-field">Điện thoại *<input name="phone" type="tel" defaultValue={proposal.phone} required maxLength={24} /></label><label className="booth-field">Email *<input name="email" type="email" defaultValue={proposal.email} required maxLength={254} /></label></div>
      <label className="booth-field">Website<input name="website" type="url" defaultValue={proposal.website || ""} maxLength={300} /></label>
      <label className="booth-field">Câu chuyện & nội dung gian hàng<textarea name="description" defaultValue={proposal.description} maxLength={2000} rows={4} /></label>
      {proposal.image_paths.length > 0 && <div className="booth-retained-images"><p>Ảnh hiện tại — bỏ chọn để xoá khỏi gian hàng:</p>{proposal.image_paths.map((path,index) => <label key={path}>{proposal.image_urls?.[index] && <Image src={proposal.image_urls[index]} unoptimized width={90} height={75} alt={`Ảnh hiện tại ${index+1}`} />}<span><input type="checkbox" checked={retained.includes(path)} onChange={() => setRetained((items) => items.includes(path) ? items.filter((value) => value !== path) : [...items,path])} /> Giữ ảnh {index+1}</span></label>)}</div>}
      <label className="booth-field">Thêm ảnh mới<input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const files = Array.from(event.target.files || []);
        const invalid = files.length > 3 || files.some((file) => file.size > 1024*1024 || !["image/jpeg","image/png","image/webp"].includes(file.type));
        setImageCount(files.length); setImageError(invalid ? "Ảnh phải là JPEG/PNG/WebP, mỗi ảnh tối đa 1 MB." : ""); setNewImages(invalid ? [] : files.map((file) => URL.createObjectURL(file)));
      }} /><small>Tổng ảnh giữ lại và thêm mới: tối đa 3 ảnh; mỗi ảnh tối đa 1 MB.</small></label>
      <div className="booth-image-previews">{newImages.map((src,index) => <Image key={src} src={src} width={70} height={70} unoptimized alt={`Ảnh mới ${index+1}`} />)}</div>
      {(imageError || retained.length + imageCount > 3) && <p className="booth-inline-error" role="alert">{imageError || "Tổng ảnh giữ lại và thêm mới không được quá 3."}</p>}
      <label className="booth-field">Ghi chú thay đổi<textarea name="note" rows={2} maxLength={1000} placeholder="Lý do đổi tên, ảnh hoặc vị trí…" /></label>
      {error && <div className="booth-alert error" role="alert">{error}</div>}
      <div className="booth-admin-actions"><button type="button" className="booth-button secondary" onClick={onCancel}>Huỷ chỉnh sửa</button><button type="submit" className="booth-button" disabled={Boolean(imageError) || retained.length + imageCount > 3}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
    </fieldset>
  </form>;
}
