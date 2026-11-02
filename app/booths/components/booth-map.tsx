"use client";

import { useState } from "react";
import { BOOTH_ZONES, type BoothPosition } from "@/lib/booths/types";
import BoothZoneIcon from "./booth-zone-icon";

export default function BoothMap({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const [zoom, setZoom] = useState(1);
  return <div className="booth-map-card">
    <div className="booth-map-top"><div><span className="booth-kicker">MẶT BẰNG DỰ KIẾN</span><h2>Ba khu. Những câu chuyện riêng.</h2></div><div className="booth-map-tools"><button type="button" aria-label="Thu nhỏ sơ đồ" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.4))}>−</button><button type="button" aria-label="Đặt lại sơ đồ" onClick={() => setZoom(1)}>⟲</button><button type="button" aria-label="Phóng to sơ đồ" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.4))}>+</button></div></div>
    <div className="booth-map-viewport" tabIndex={0} aria-label="Sơ đồ 25 vị trí: 24 gian đăng ký và một quầy đổi quà; có thể cuộn ngang khi phóng to">
      <div className="booth-map-canvas" style={{ width: `${zoom * 100}%` }}>
        <svg viewBox="0 0 1000 760" role="group" aria-label="Chọn gian hàng tại Hạ Long, Văn Miếu hoặc Hội An">
          <rect width="1000" height="760" fill="#f7faff" />
          <rect x="90" y="40" width="820" height="110" rx="16" fill="#153b74" />
          <text x="500" y="83" textAnchor="middle" fill="#fff" fontSize="22">GLOBAL CITIZENS DAY 2026</text>
          <text x="500" y="116" textAnchor="middle" fill="#ffe2a0" fontSize="14" letterSpacing="2">SÂN KHẤU · KHÔNG GIAN KẾT NỐI</text>
          {BOOTH_ZONES.map((zone, index) => <g key={zone.name}>
            <rect x={90 + index * 280} y="185" width="250" height="440" rx="18" fill={zone.background} stroke={zone.color} strokeOpacity=".3" />
            <BoothZoneIcon kind={zone.icon} x={107 + index * 280} y={197} width={28} height={28} color={zone.color} />
            <text x={215 + index * 280} y="216" textAnchor="middle" fill={zone.color} fontSize="22" fontWeight="600">{zone.name.toUpperCase()}</text>
            <text x={215 + index * 280} y="239" textAnchor="middle" fill={zone.color} fontSize="12">8 GIAN · B{String(zone.firstId).padStart(2, "0")}–B{String(zone.lastId).padStart(2, "0")}</text>
          </g>)}
          <path d="M355 260V635M635 260V635" stroke="#afc5df" strokeWidth="2" strokeDasharray="7 7" />
          <text x="90" y="688" fill="#125ac4" fontSize="14">LỐI VÀO →</text>
          <text x="910" y="688" fill="#125ac4" fontSize="14" textAnchor="end">LỐI RA →</text>
          {positions.map((booth) => {
            const x = booth.x * 10, y = booth.y * 7.6, w = booth.width * 10, h = booth.height * 7.6;
            if (!booth.is_bookable) return <g key={booth.id} className="booth-map-service" role="img" aria-label="B25 — Quầy đổi quà của ban tổ chức, không nhận đăng ký">
              <title>Quầy đổi quà · Ban tổ chức · Không nhận đăng ký</title>
              <rect x={x - 35} y={y} width={w + 70} height={h} rx="8" fill="#fff1ca" stroke="#ab7b20" />
              <text x={x + w / 2} y={y + 23} textAnchor="middle" fill="#77521b" fontSize="14" fontWeight="600">B25 · ĐỔI QUÀ</text>
              <text x={x + w / 2} y={y + 43} textAnchor="middle" fill="#77521b" fontSize="11">BAN TỔ CHỨC</text>
            </g>;
            const status = booth.is_booked ? "Đã xác nhận" : booth.pending_count ? `Có ${booth.pending_count} đề xuất, vẫn nhận thêm` : "Đang nhận đề xuất";
            return <g key={booth.id} className={`booth-map-spot ${booth.is_booked ? "is-booked" : booth.pending_count ? "is-pending" : "is-open"} ${selected === booth.id ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${booth.code} · Khu ${booth.zone} — ${status}`} aria-pressed={selected === booth.id} onClick={() => onSelect(booth.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(booth.id); } }}>
              <title>{booth.code} · Khu {booth.zone}: {status}{booth.confirmed_brand ? ` · ${booth.confirmed_brand}` : ""}</title>
              <rect className="booth-map-spot-shadow" x={x + 2} y={y + 3} width={w} height={h} rx="6" />
              <rect className="booth-map-spot-fill" x={x} y={y} width={w} height={h} rx="6" />
              <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle">{booth.code}</text>
              {selected === booth.id && <rect className="booth-map-spot-outline" x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="9" />}
            </g>;
          })}
          <text x="500" y="744" fontSize="11" fill="#48688c" textAnchor="middle">24 GIAN ĐĂNG KÝ · 1 QUẦY ĐỔI QUÀ</text>
        </svg>
      </div>
    </div>
    <div className="booth-map-legend"><span><i className="open" />Đang nhận đề xuất</span><span><i className="pending" />Có đề xuất · vẫn nhận thêm</span><span><i className="booked" />Đã xác nhận</span><span><i className="service" />Quầy đổi quà · không đăng ký</span></div>
    <p className="booth-map-note">Sơ đồ ý tưởng gồm 3 khu, mỗi khu 8 gian đăng ký; B25 là quầy đổi quà của ban tổ chức. Vị trí, kích thước và tiện ích thực tế sẽ được chốt sau. Phóng to và vuốt ngang để xem chi tiết, hoặc chọn vị trí bằng danh sách bên cạnh.</p>
  </div>;
}
