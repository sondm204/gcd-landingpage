"use client";

import { useId, useState } from "react";
import { BOOTH_ZONES, type BoothPosition } from "@/lib/booths/types";

export default function BoothMap({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const [zoom, setZoom] = useState(1);
  const markerId = useId().replace(/:/g, "");
  return <div className="booth-map-card">
    <div className="booth-map-top"><div><span className="booth-kicker">MẶT BẰNG DỰ KIẾN · 33 GIAN</span><h2>Chọn gian thương mại hoặc tài trợ.</h2></div><div className="booth-map-tools"><button type="button" aria-label="Thu nhỏ sơ đồ" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button><button type="button" aria-label="Đặt lại sơ đồ" onClick={() => setZoom(1)}>⟲</button><button type="button" aria-label="Phóng to sơ đồ" disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + .5))}>+</button></div></div>
    <div className="booth-map-viewport" tabIndex={0} aria-label="Sơ đồ 33 gian; phóng to và cuộn ngang để xem chi tiết">
      <div className="booth-map-canvas" style={{ width: `${zoom * 100}%` }}>
        <svg viewBox="70 210 1460 1160" role="group" aria-label="Sơ đồ gian hàng Global Citizens Day">
          <defs>
            <marker id={`${markerId}-visit`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#087d73" /></marker>
            <marker id={`${markerId}-hall`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#ad3650" /></marker>
          </defs>
          <rect x="70" y="210" width="1460" height="1160" fill="#eff5fc" />
          <rect x="92" y="245" width="1416" height="1000" rx="28" fill="#fff" stroke="#cbd9ec" strokeWidth="2" />
          <rect x="482" y="275" width="650" height="132" rx="20" fill="#153b55" />
          <text x="807" y="340" textAnchor="middle" fontSize="36" fontWeight="700" fill="#fff">HỘI TRƯỜNG</text>
          {[617,877].map((x,index)=><g key={x}><rect x={x} y="361" width="148" height="44" rx="10" fill="#e6f0f6" /><text x={x+74} y="390" textAnchor="middle" fill="#153b55" fontSize="23">Cửa {index+1}</text></g>)}
          <rect x="113" y="314" width="270" height="62" rx="12" fill="#e9f6f1" stroke="#bedfd7" />
          <text x="248" y="353" textAnchor="middle" fontSize="23" fill="#087d73">Backdrop GCD</text>
          <text x="117" y="433" fontSize="25" fontWeight="700" fill="#087d73">TRẢI NGHIỆM VĂN HOÁ</text>
          <text x="790" y="493" fontSize="27" fontWeight="700" fill="#9a650e">NHÀ TÀI TRỢ</text>
          <rect x="1180" y="440" width="290" height="70" rx="12" fill="#fff8e9" stroke="#ead8ad" />
          <text x="1325" y="483" textAnchor="middle" fontSize="23" fill="#9a650e">Backdrop Trống Đồng</text>
          <circle cx="1325" cy="573" r="32" fill="#fff4e5" stroke="#c69b48" strokeDasharray="5 5" strokeWidth="2" />
          <text x="1325" y="581" textAnchor="middle" fontSize="22" fontWeight="600" fill="#9a650e">360°</text>
          <text x="1325" y="646" textAnchor="middle" fontSize="20" fill="#9a650e">Khu chờ Camera 360°</text>
          <text x="277" y="656" textAnchor="middle" fontSize="22" fill="#087d73">Khu chờ trải nghiệm</text>
          {["M1480 944H1210V873H800", "M752 977H579V653H510", "M577 1003H414V1085"].map((path) => <path key={path} d={path} fill="none" stroke="#087d73" strokeWidth="6" strokeLinejoin="round" markerEnd={`url(#${markerId}-visit)`} />)}
          <path d="M690 891V445" fill="none" stroke="#ad3650" strokeWidth="6" markerEnd={`url(#${markerId}-hall)`} />
          <text x="1395" y="920" textAnchor="middle" fontSize="27" fontWeight="700" fill="#087d73">LỐI VÀO</text>
          <text x="690" y="960" textAnchor="middle" fontSize="22" fill="#ad3650">Thảm đỏ</text>
          <text x="247" y="1170" textAnchor="middle" fontSize="22" fill="#793c91">Khu chờ đổi quà</text>
          {positions.map((booth) => {
            const x=booth.x*16, y=booth.y*16, w=booth.width*16, h=booth.height*16;
            if (!booth.is_bookable) {
              const organizer = booth.code.startsWith("BTC");
              const color = organizer ? "#793c91" : "#087d73";
              return <g key={booth.id} className="booth-map-service" role="img" aria-label={`${booth.code} · ${booth.zone} — Đã bố trí, không nhận đăng ký`}>
                <title>{booth.code} · Đã bố trí, không nhận đăng ký</title>
                <rect x={x} y={y} width={w} height={h} rx="10" fill={organizer ? "#f5ecfa" : "#e9f6f1"} stroke={color} strokeWidth="2" />
                <text x={x+w/2} y={y+25} textAnchor="middle" fill={color} fontSize="23" fontWeight="600">{booth.code}</text>
                <text x={x+w/2} y={y+(organizer ? 56 : 46)} textAnchor="middle" fill={color} fontSize={organizer ? 21 : 12}>{organizer ? booth.code === "BTC03" ? "Đổi quà theo lượt" : "Hỗ trợ khách" : "Đã bố trí"}</text>
              </g>;
            }
            const status=booth.is_booked ? "Đã xác nhận" : booth.pending_count ? `${booth.pending_count} đề xuất, vẫn nhận thêm` : "Đang nhận đề xuất";
            const color=BOOTH_ZONES.find(z=>z.name===booth.zone)?.color;
            return <g key={booth.id} className={`booth-map-spot ${booth.is_booked ? "is-booked" : booth.pending_count ? "is-pending" : "is-open"} ${selected===booth.id ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${booth.code} · ${booth.zone} — ${status}`} aria-pressed={selected===booth.id} onClick={()=>onSelect(booth.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(booth.id);}}}>
              <title>{booth.code}: {status}{booth.confirmed_brand ? ` · ${booth.confirmed_brand}` : ""}</title>
              <rect className="booth-map-spot-fill" x={x} y={y} width={w} height={h} rx="10" style={{ stroke: color, ...(selected===booth.id || booth.is_booked ? { fill: color } : {}) }} />
              <text x={x+w/2} y={y+h/2+7} textAnchor="middle" style={{ fontSize: 23, fill: selected===booth.id || booth.is_booked ? "#fff" : color }}>{booth.code}</text>
              {selected===booth.id && <rect className="booth-map-spot-outline" x={x-4} y={y-4} width={w+8} height={h+8} rx="13" style={{ stroke: color }} />}
            </g>;
          })}
          <g fontSize="19" fontWeight="600">
            {BOOTH_ZONES.map((zone,index)=><g key={zone.name} transform={`translate(${117+index*350} 1290)`}><rect y="-18" width="18" height="18" rx="3" fill={zone.background} stroke={zone.color} /><text x="28" fill={zone.color}>{zone.lastId-zone.firstId+1} {zone.name.toLowerCase()}</text></g>)}
          </g>
          <path d="M120 1333H174" stroke="#087d73" strokeWidth="4" markerEnd={`url(#${markerId}-visit)`} /><text x="194" y="1340" fontSize="18" fill="#395b79">Hướng tham quan gợi ý</text>
          <path d="M690 1333H744" stroke="#ad3650" strokeWidth="4" markerEnd={`url(#${markerId}-hall)`} /><text x="764" y="1340" fontSize="18" fill="#395b79">Vào hội trường theo giờ</text>
        </svg>
      </div>
    </div>
    <div className="booth-map-legend"><span><i className="open" />Nhận đề xuất</span><span><i className="pending" />Có đề xuất</span><span><i className="booked" />Đã xác nhận</span><span>VH: đã bố trí · BTC: phục vụ sự kiện</span></div>
    <p className="booth-map-note">5 gian văn hoá đã có đơn vị phụ trách và 3 gian BTC không nhận đăng ký. Bạn có thể chọn 20 gian thương mại hoặc 5 gian tài trợ. Sơ đồ đề xuất, không theo tỷ lệ; mặt bằng và lối đi được ban tổ chức xác nhận với địa điểm.</p>
  </div>;
}
