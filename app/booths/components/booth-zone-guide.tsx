import { BOOTH_ZONES, type BoothPosition } from "@/lib/booths/types";
import BoothZoneIcon from "./booth-zone-icon";

export default function BoothZoneGuide({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  return <section className="booth-zone-guide" aria-labelledby="booth-zones-title">
    <div className="booth-zone-heading"><span className="booth-kicker">CHỌN KHU THEO CÂU CHUYỆN CỦA BẠN</span><h2>Gian hàng của bạn phù hợp với khu nào?</h2><p>Ba tên gọi gợi mở ba chủ đề trải nghiệm. Thương hiệu và đơn vị từ mọi địa phương đều có thể đăng ký; hãy chọn theo nội dung bạn muốn mang đến, không theo nơi đặt cửa hàng.</p></div>
    <div className="booth-zone-grid">{BOOTH_ZONES.map((zone) => {
      const slots = positions.filter((position) => position.is_bookable && position.zone === zone.name);
      const available = slots.filter((position) => !position.is_booked);
      const active = selected >= zone.firstId && selected <= zone.lastId;
      return <article key={zone.name} className={`booth-zone-card${active ? " is-selected" : ""}`} style={{ borderTopColor: zone.color }}>
        <div className="booth-zone-card-top"><span style={{ color: zone.color }}>B{String(zone.firstId).padStart(2, "0")}–B{String(zone.lastId).padStart(2, "0")}</span><span>8 GIAN</span></div>
        <div className="booth-zone-title"><span className="booth-zone-icon" style={{ color: zone.color, background: zone.background }}><BoothZoneIcon kind={zone.icon} /></span><h3>{zone.name}</h3></div><h4>{zone.theme}</h4><p>{zone.description}</p>
        <span className="booth-zone-example-label">GỢI Ý NỘI DUNG GIAN HÀNG</span>
        <ul>{zone.examples.map((example) => <li key={example}>{example}</li>)}</ul>
        <div className="booth-zone-card-action"><small>{slots.length ? available.length ? `${available.length}/8 gian đang nhận đề xuất` : "Đã xác nhận đủ 8 gian" : "8 gian dự kiến"}</small><button type="button" className="booth-button secondary compact" aria-pressed={active} onClick={() => onSelect(available[0]?.id ?? zone.firstId)}>Chọn khu {zone.name} <span aria-hidden="true">↗</span></button></div>
      </article>;
    })}</div>
    <p className="booth-gift-note"><strong>B25 · Quầy đổi quà</strong> — Không gian phục vụ khách tham dự do ban tổ chức vận hành, không nhận đăng ký gian hàng.</p>
  </section>;
}
