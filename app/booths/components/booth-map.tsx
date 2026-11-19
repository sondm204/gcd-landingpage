"use client";
import { useCopy } from "@/i18n/copy";


import { useId, useState } from "react";
import { BOOTH_ZONES, zonePositionCount, type BoothPosition } from "@/lib/booths/types";

export default function BoothMap({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const t = useCopy();
  const [zoom, setZoom] = useState(1);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(() => new Set());
  const markerId = useId().replace(/:/g, "");
  return <div className="booth-map-card">
    <div className="booth-map-top"><div><span className="booth-kicker">{t("MẶT BẰNG DỰ KIẾN · 40 VỊ TRÍ")}</span><h2>{t("Chọn gian thương mại hoặc tài trợ.")}</h2></div><div className="booth-map-tools"><button type="button" aria-label={t("Thu nhỏ sơ đồ")} disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button><button type="button" aria-label={t("Đặt lại sơ đồ")} onClick={() => setZoom(1)}>⟲</button><button type="button" aria-label={t("Phóng to sơ đồ")} disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + .5))}>+</button></div></div>
    <div className="booth-map-viewport" tabIndex={0} aria-label={t("Sơ đồ 40 vị trí; phóng to và cuộn ngang để xem chi tiết")}>
      <div className="booth-map-canvas" style={{ width: `${zoom * 100}%` }}>
        <svg viewBox="70 210 1510 1220" role="group" aria-label={t("Sơ đồ gian hàng Global Citizens Day")}>
          <defs>
            <marker id={`${markerId}-visit`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#087d73" /></marker>
            <marker id={`${markerId}-hall`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#ad3650" /></marker>
            <marker id={`${markerId}-carpet`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#fff8eb" /></marker>
          </defs>
          <rect x="70" y="210" width="1510" height="1220" fill="#eff5fc" />
          <rect x="82" y="225" width="1486" height="1040" rx="28" fill="#fff" stroke="#cbd9ec" strokeWidth="2" />
          <g aria-label={t("Thảm đỏ đi thẳng vào Cửa 1")} pointerEvents="none">
            <rect x="649" y="405" width="84" height="500" rx="4" fill="#a72f49" />
            <path d="M656 410V899M726 410V899" stroke="#e5b775" strokeWidth="2" />
          </g>
          <rect x="482" y="275" width="650" height="132" rx="20" fill="#153b55" />
          <text x="807" y="340" textAnchor="middle" fontSize="36" fontWeight="700" fill="#fff">{t("HỘI TRƯỜNG")}</text>
          {[617,877].map((x,index)=><g key={x}><rect x={x} y="361" width="148" height="44" rx="10" fill="#e6f0f6" /><text x={x+74} y="390" textAnchor="middle" fill="#153b55" fontSize="23">{t("Cửa")} {index+1}</text></g>)}
          <rect x="113" y="314" width="270" height="62" rx="12" fill="#e9f6f1" stroke="#bedfd7" />
          <text x="248" y="353" textAnchor="middle" fontSize="23" fill="#087d73">Backdrop GCD</text>
          <text x="117" y="433" fontSize="25" fontWeight="700" fill="#087d73">{t("TRẢI NGHIỆM VĂN HOÁ")}</text>
          <text x="770" y="505" fontSize="27" fontWeight="700" fill="#9a650e">{t("NHÀ TÀI TRỢ")}</text>
          <text x="335" y="582" textAnchor="middle" fontSize="21" fill="#087d73">{t("Khu chờ trải nghiệm")}</text>
          {["M1540 918H1270V850H800", "M770 940H590V590H465", "M590 952H420V1030"].map((path) => <path key={path} d={path} fill="none" stroke="#087d73" strokeWidth="6" strokeLinejoin="round" markerEnd={`url(#${markerId}-visit)`} />)}
          <path d="M691 891V445" fill="none" stroke="#fff8eb" strokeWidth="5" markerEnd={`url(#${markerId}-carpet)`} />
          <text x="1440" y="890" textAnchor="middle" fontSize="27" fontWeight="700" fill="#087d73">{t("LỐI VÀO")}</text>
          <text x="691" y="927" textAnchor="middle" fontSize="18" fontWeight="600" fill="#a72f49">{t("THẢM ĐỎ · CỬA 1")}</text>
          <text x="247" y="1130" textAnchor="middle" fontSize="22" fill="#793c91">{t("Khu chờ đổi quà")}</text>
          {positions.map((booth) => {
            const x=booth.x*16, y=booth.y*16, w=booth.width*16, h=booth.height*16;
            if (!booth.is_bookable) {
              const organizer = booth.code.startsWith("BTC");
              const color = organizer ? "#793c91" : "#087d73";
              return <g key={booth.id} className="booth-map-service" role="img" aria-label={t("{v0} · {v1} — Đã bố trí, không nhận đăng ký", { v0: booth.code, v1: t(booth.zone) })}>
                <title>{booth.code} {t("· Đã bố trí, không nhận đăng ký")}</title>
                <rect x={x} y={y} width={w} height={h} rx="10" fill={organizer ? "#f5ecfa" : "#e9f6f1"} stroke={color} strokeWidth="2" />
                <text x={x+w/2} y={y+25} textAnchor="middle" fill={color} fontSize="23" fontWeight="600">{booth.code}</text>
                <text x={x+w/2} y={y+(organizer ? 56 : 49)} textAnchor="middle" fill={color} fontSize={organizer ? 21 : 15}>{organizer ? booth.code === "BTC03" ? t("Đổi quà theo lượt") : t("Hỗ trợ khách") : t("Điểm hỗ trợ")}</text>
              </g>;
            }
            const status=booth.is_booked ? t("Đã xác nhận") : booth.pending_count ? t("{v0} đề xuất, vẫn nhận thêm", { v0: booth.pending_count }) : t("Đang nhận đề xuất");
            const color=BOOTH_ZONES.find(z=>z.name===booth.zone)?.color;
            const logo = booth.is_booked && booth.confirmed_logo_url && !failedLogos.has(booth.confirmed_logo_url) ? booth.confirmed_logo_url : null;
            return <g key={booth.id} className={`booth-map-spot ${booth.is_booked ? "is-booked" : booth.pending_count ? "is-pending" : "is-open"} ${selected===booth.id ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${booth.code} · ${booth.zone} — ${status}`} aria-pressed={selected===booth.id} onClick={()=>onSelect(booth.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(booth.id);}}}>
              <title>{booth.code}: {status}{booth.confirmed_brand ? ` · ${booth.confirmed_brand}` : ""}</title>
              <rect className="booth-map-spot-fill" x={x} y={y} width={w} height={h} rx="10" style={{ stroke: color, ...(selected===booth.id || booth.is_booked ? { fill: color } : {}) }} />
              {logo ? <g pointerEvents="none">
                <defs><clipPath id={`${markerId}-logo-${booth.id}`}><rect x={x+1} y={y+1} width={w-2} height={h-2} rx="9" /></clipPath></defs>
                <g clipPath={`url(#${markerId}-logo-${booth.id})`}><rect x={x+1} y={y+1} width={w-2} height={h-2} fill="#fff" /><image href={logo} x={x+1} y={y+1} width={w-2} height={h-2} preserveAspectRatio="xMidYMid meet" onError={() => setFailedLogos(previous => new Set(previous).add(logo))} /></g>
              </g> : <text x={x+w/2} y={y+(booth.code === "TT07" || booth.code === "TT08" ? 25 : h/2+7)} textAnchor="middle" style={{ fontSize: 23, fill: selected===booth.id || booth.is_booked ? "#fff" : color }}>{booth.code}</text>}
              {(booth.code === "TT07" || booth.code === "TT08") && <text x={x+w/2} y={y+h-9} textAnchor="middle" fontSize="17" fill={selected===booth.id || booth.is_booked ? "#fff" : color}>{booth.code === "TT07" ? t("Backdrop Trống Đồng") : t("Camera 360°")}</text>}
              {selected===booth.id && <rect className="booth-map-spot-outline" x={x-4} y={y-4} width={w+8} height={h+8} rx="13" style={{ stroke: color }} />}
            </g>;
          })}
          <g fontSize="19" fontWeight="600">
            {BOOTH_ZONES.map((zone,index)=><g key={t(zone.name)} transform={`translate(${117+index%3*480} ${index<3 ? 1300 : 1340})`}><rect y="-18" width="18" height="18" rx="3" fill={zone.background} stroke={zone.color} /><text x="28" fill={zone.color}>{zonePositionCount(zone.prefix)} {t(zone.name).toLowerCase()}</text></g>)}
          </g>
          <path d="M120 1383H174" stroke="#087d73" strokeWidth="4" markerEnd={`url(#${markerId}-visit)`} /><text x="194" y="1390" fontSize="18" fill="#395b79">{t("Hướng tham quan gợi ý")}</text>
          <path d="M690 1383H744" stroke="#ad3650" strokeWidth="4" markerEnd={`url(#${markerId}-hall)`} /><text x="764" y="1390" fontSize="18" fill="#395b79">{t("Vào hội trường theo giờ")}</text>
        </svg>
      </div>
    </div>
    <div className="booth-map-legend"><span><i className="open" />{t("Nhận đề xuất")}</span><span><i className="pending" />{t("Có đề xuất")}</span><span><i className="booked" />{t("Đã xác nhận")}</span><span>{t("VH: đã bố trí · BTC: phục vụ sự kiện")}</span></div>
    <p className="booth-map-note">{t("VH01–VH05 và 3 gian BTC đã bố trí, không nhận đăng ký. Bạn có thể chọn 24 gian thương mại hoặc 8 gian tài trợ. TT07 là Backdrop Trống Đồng; TT08 là Camera 360°. Sơ đồ đề xuất, không theo tỷ lệ; mặt bằng và lối đi được ban tổ chức xác nhận với địa điểm.")}</p>
  </div>;
}
