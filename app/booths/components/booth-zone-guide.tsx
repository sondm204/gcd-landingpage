import { BOOTH_ZONES, type BoothPosition } from "@/lib/booths/types";
import BoothZoneIcon from "./booth-zone-icon";

export default function BoothZoneGuide({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  return <section className="booth-zone-guide" aria-labelledby="booth-zones-title">
    <div className="booth-zone-heading"><span className="booth-kicker">4 LOẠI GIAN HÀNG</span><h2>Chọn hình thức tham gia phù hợp.</h2><p>Gian thương mại và tài trợ nhận đề xuất. Gian văn hoá đã có đơn vị phụ trách; gian BTC dành riêng cho hỗ trợ khách và đổi quà.</p></div>
    <div className="booth-zone-grid">{BOOTH_ZONES.map((zone) => {
      const slots = positions.filter((position) => position.is_bookable && position.zone === zone.name);
      const available = slots.filter((position) => !position.is_booked);
      const active = selected >= zone.firstId && selected <= zone.lastId;
      return <article key={zone.name} className={`booth-zone-card${active ? " is-selected" : ""}`} style={{ borderTopColor: zone.color }}>
        <div className="booth-zone-card-top"><span style={{ color: zone.color }}>{zone.prefix}01–{zone.prefix}{String(zone.lastId-zone.firstId+1).padStart(2,"0")}</span><span>{zone.lastId-zone.firstId+1} GIAN</span></div>
        <div className="booth-zone-title"><span className="booth-zone-icon" style={{ color: zone.color, background: zone.background }}><BoothZoneIcon kind={zone.icon} /></span><h3>{zone.name}</h3></div><h4>{zone.theme}</h4><p>{zone.description}</p>
        <span className="booth-zone-example-label">GỢI Ý NỘI DUNG GIAN HÀNG</span>
        <ul>{zone.examples.map((example) => <li key={example}>{example}</li>)}</ul>
        <div className="booth-zone-card-action"><small>{!zone.bookable ? "Đã bố trí · Không nhận đăng ký" : slots.length ? `${available.length}/${zone.lastId-zone.firstId+1} gian đang nhận đề xuất` : "Đang tải trạng thái"}</small>{zone.bookable && <button type="button" className="booth-button secondary compact" aria-pressed={active} onClick={() => onSelect(available[0]?.id ?? zone.firstId)}>Chọn {zone.name.toLowerCase()} <span aria-hidden="true">↗</span></button>}</div>
      </article>;
    })}</div>
    <p className="booth-gift-note"><strong>Gian văn hoá đã được bố trí.</strong> Vui lòng chọn gian thương mại hoặc tài trợ để gửi đề xuất. BTC01–BTC02 hỗ trợ khách; BTC03 phục vụ đổi quà.</p>
  </section>;
}
