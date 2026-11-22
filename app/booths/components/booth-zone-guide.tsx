"use client";
import { useCopy } from "@/i18n/copy";
import { BOOTH_ZONES, zoneForPosition, zonePositionCount, type BoothPosition } from "@/lib/booths/types";
import BoothZoneIcon from "./booth-zone-icon";

export default function BoothZoneGuide({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const t = useCopy();
  return <section className="booth-zone-guide" aria-labelledby="booth-zones-title">
    <div className="booth-zone-heading"><span className="booth-kicker">{t("4 NHÓM VỊ TRÍ")}</span><h2>{t("Chọn hình thức tham gia phù hợp.")}</h2><p>{t("Gian thương mại và tài trợ nhận đề xuất. Gian văn hoá đã có đơn vị phụ trách; gian BTC dành riêng cho hỗ trợ khách và đổi quà.")}</p></div>
    <div className="booth-zone-grid">{BOOTH_ZONES.map((zone) => {
      const slots = positions.filter((position) => position.is_bookable && position.zone === zone.name);
      const available = slots.filter((position) => !position.is_booked && !position.is_locked);
      const active = zoneForPosition(selected)?.name === zone.name;
      return <article key={t(zone.name)} className={`booth-zone-card${active ? " is-selected" : ""}`} style={{ borderTopColor: zone.color }}>
        <div className="booth-zone-card-top"><span style={{ color: zone.color }}>{zone.prefix}01–{zone.prefix}{String(zonePositionCount(zone.prefix)).padStart(2,"0")}</span><span>{zonePositionCount(zone.prefix)} {t("GIAN") }</span></div>
        <div className="booth-zone-title"><span className="booth-zone-icon" style={{ color: zone.color, background: zone.background }}><BoothZoneIcon kind={zone.icon} /></span><h3>{t(zone.name)}</h3></div><h4>{t(zone.theme)}</h4>{zone.prefix === "TM" && <p><strong>{t("Chi phí: 5.000.000đ / gian")}</strong></p>}<p>{t(zone.description)}</p>
        <p><strong>{t("Loại 9m²: Kích thước 3m x 3m x 2.5m")}</strong></p>
        <span className="booth-zone-example-label">{t("GỢI Ý NỘI DUNG GIAN HÀNG")}</span>
        <ul>{zone.examples.map((example) => <li key={t(example)}>{t(example)}</li>)}</ul>
        <div className="booth-zone-card-action"><small>{!zone.bookable ? t("Đã bố trí · Không nhận đăng ký") : slots.length ? t("{v0}/{v1} gian đang nhận đề xuất", { v0: available.length, v1: zonePositionCount(zone.prefix) }) : t("Đang tải trạng thái")}</small>{zone.bookable && <button type="button" className="booth-button secondary compact" aria-pressed={active} onClick={() => onSelect(available[0]?.id ?? zone.firstId)}>{t("Chọn")} {t(zone.name).toLowerCase()} <span aria-hidden="true">↗</span></button>}</div>
      </article>;
    })}</div>
    <p className="booth-gift-note"><strong>{t("Gian văn hoá đã được bố trí.")}</strong> {t("Vui lòng chọn gian thương mại hoặc tài trợ để gửi đề xuất. BTC01–BTC02 hỗ trợ khách; BTC03 phục vụ đổi quà.")}</p>
  </section>;
}
