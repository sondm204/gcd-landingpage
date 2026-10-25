"use client";

import { useState } from "react";
import type { BoothPosition } from "@/lib/booths/types";

export default function BoothMap({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const [zoom, setZoom] = useState(1);
  return <div className="booth-map-card">
    <div className="booth-map-top"><div><span className="booth-kicker">MẶT BẰNG DỰ KIẾN</span><h2>Một vị trí. Một kết nối mới.</h2></div><div className="booth-map-tools"><button type="button" aria-label="Thu nhỏ sơ đồ" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.4))}>−</button><button type="button" aria-label="Đặt lại sơ đồ" onClick={() => setZoom(1)}>⟲</button><button type="button" aria-label="Phóng to sơ đồ" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.4))}>+</button></div></div>
    <div className="booth-map-viewport" tabIndex={0} aria-label="Sơ đồ 40 vị trí; có thể cuộn ngang để khám phá">
      <div className="booth-map-canvas" style={{ width: `${zoom * 100}%` }}>
        <svg viewBox="0 0 1000 760" role="group" aria-label="Chọn một gian hàng trên sơ đồ sự kiện">
          <defs><pattern id="booth-paving" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#cfc9b6" strokeWidth="0.6" /></pattern><marker id="booth-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b04a36" /></marker></defs>
          <rect width="1000" height="760" fill="#e8e7d9" /><rect x="165" y="78" width="790" height="610" rx="25" fill="#dbd7c5" /><rect x="245" y="164" width="605" height="443" rx="30" fill="url(#booth-paving)" />
          <rect x="22" y="102" width="125" height="560" rx="6" fill="#677560" /><path d="M22 115L84 78L147 115" fill="#4e624e" /><text className="booth-map-building" x="84" y="366" textAnchor="middle">HỘI TRƯỜNG</text><text x="84" y="389" textAnchor="middle" fontSize="12" fill="#e8e9d9">KHÔNG GIAN SỰ KIỆN</text>
          <rect x="190" y="57" width="150" height="31" rx="5" fill="#b04a36" /><text x="265" y="78" textAnchor="middle" fontSize="12" fill="#fff7e8">BACKDROP · CHECK-IN</text>
          <path d="M270 189H790Q820 189 820 220V570Q820 590 790 590H295Q270 590 270 566V221" fill="none" stroke="#b04a36" strokeWidth="2" strokeDasharray="8 7" markerEnd="url(#booth-arrow)" />
          <path d="M360 189H410M820 324V370M690 590H640" stroke="#b04a36" strokeWidth="2" markerEnd="url(#booth-arrow)" />
          <circle cx="548" cy="382" r="72" fill="#c8b383" opacity=".35" /><circle cx="548" cy="382" r="59" fill="#ae4833" /><circle cx="548" cy="382" r="50" fill="none" stroke="#e0c588" /><text x="548" y="376" textAnchor="middle" fill="#fff6df" fontSize="26">360°</text><text x="548" y="401" textAnchor="middle" fill="#f3dbb5" fontSize="10" letterSpacing="1">KHÔNG GIAN KẾT NỐI</text>
          {[[389,268],[714,268],[548,532]].map(([x,y],index) => <g key={index}><circle cx={x} cy={y} r="34" fill="#8b9c70" opacity=".3" /><circle cx={x} cy={y} r="25" fill="#a1834c" /><text x={x} y={y+4} textAnchor="middle" fill="#fff8e9" fontSize="13">ROOTS</text></g>)}
          {[[178,116],[356,104],[490,95],[640,96],[791,99],[944,179],[949,330],[943,508],[913,692],[747,706],[579,710],[417,704],[237,694],[168,546],[169,386]].map(([x,y],index) => <g key={index} opacity=".75"><circle cx={x} cy={y} r="18" fill="#a2ae8b" /><circle cx={x-5} cy={y-4} r="12" fill="#8b9e7b" /><circle cx={x+5} cy={y+3} r="10" fill="#718a68" /></g>)}
          <text x="163" y="182" fill="#ad4633" fontSize="13">LỐI VÀO ↗</text><text x="859" y="690" fill="#ad4633" fontSize="13">LỐI RA ↗</text>
          {positions.map((booth) => {
            const x = booth.x * 10, y = booth.y * 7.6, w = booth.width * 10, h = booth.height * 7.6;
            const status = booth.is_booked ? "Đã xác nhận" : booth.pending_count ? `Có ${booth.pending_count} đề xuất, vẫn nhận thêm` : "Đang nhận đề xuất";
            return <g key={booth.id} className={`booth-map-spot ${booth.is_booked ? "is-booked" : booth.pending_count ? "is-pending" : "is-open"} ${selected === booth.id ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${booth.code} — ${status}`} aria-pressed={selected === booth.id} onClick={() => onSelect(booth.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(booth.id); } }}>
              <title>{booth.code}: {status}{booth.confirmed_brand ? ` · ${booth.confirmed_brand}` : ""}</title>
              <rect className="booth-map-spot-shadow" x={x+2} y={y+3} width={w} height={h} rx="4" />
              <rect className="booth-map-spot-fill" x={x} y={y} width={w} height={h} rx="4" /><text x={x+w/2} y={y+h/2+5} textAnchor="middle">{String(booth.id).padStart(2, "0")}</text>
              {selected === booth.id && <rect className="booth-map-spot-outline" x={x-4} y={y-4} width={w+8} height={h+8} rx="7" />}
            </g>;
          })}
          <text x="55" y="720" fontSize="15" fill="#566650" letterSpacing="2">GLOBAL CITIZENS DAY 2026</text><text x="933" y="52" fontSize="12" fill="#566650" textAnchor="middle">BẮC ↑</text>
        </svg>
      </div>
    </div>
    <div className="booth-map-legend"><span><i className="open" />Đang nhận đề xuất</span><span><i className="pending" />Có đề xuất · vẫn nhận thêm</span><span><i className="booked" />Đã xác nhận</span></div>
    <p className="booth-map-note">Sơ đồ ý tưởng gồm 40 vị trí. Vị trí, kích thước và tiện ích thực tế sẽ được ban tổ chức chốt. Dùng nút + để xem chi tiết và vuốt ngang khi phóng to; có thể chọn ô bằng danh sách bên cạnh.</p>
  </div>;
}
