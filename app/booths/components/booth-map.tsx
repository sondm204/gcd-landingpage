"use client";
import { useCopy } from "@/i18n/copy";
import { useEffect, useId, useRef, useState } from "react";
import { BOOTH_ZONES, zonePositionCount, type BoothPosition } from "@/lib/booths/types";
import { boothMapBounds } from "./booth-map-layout";
import "./booth-map.css";

export default function BoothMap({ positions, selected, onSelect }: { positions: BoothPosition[]; selected: number; onSelect: (id: number) => void }) {
  const t = useCopy();
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(() => new Set());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const markerId = useId().replace(/:/g, "");
  const visiblePositions = positions.filter(booth => !booth.code.startsWith("BTC"));
  const selectedBooth = visiblePositions.find(booth => booth.id === selected);
  const label = (booth: BoothPosition) => booth.code === "TT06" ? t("boothGiftPosition") : booth.code;
  const status = (booth: BoothPosition) => booth.is_locked ? t("Tạm khóa đăng ký") : booth.is_booked ? t("Đã xác nhận") : booth.pending_count ? t("{v0} đề xuất, vẫn nhận thêm", { v0: booth.pending_count }) : t("Đang nhận đề xuất");

  useEffect(() => {
    if (!expanded) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; dialog?.close(); };
  }, [expanded]);

  function closeMap() {
    setExpanded(false);
    requestAnimationFrame(() => expandButton.current?.focus());
  }

  const content = <>
    <div className="booth-map-top">
      <div className="booth-map-title"><span className="booth-kicker">{t("boothMapHeading")}</span><h2>{t("Sơ đồ gian hàng Global Citizens Day")}</h2></div>
      <div className="booth-map-tools" role="group" aria-label={t("boothMapTools")}>
        <button type="button" aria-label={t("Thu nhỏ sơ đồ")} disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button>
        <button type="button" className="booth-map-scale" aria-label={t("Đặt lại sơ đồ")} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label={t("Phóng to sơ đồ")} disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + .5))}>+</button>
        <button ref={expanded ? undefined : expandButton} type="button" className="booth-map-expand" aria-haspopup={expanded ? undefined : "dialog"} onClick={() => expanded ? closeMap() : setExpanded(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={expanded ? "m7 7 10 10M17 7 7 17" : "M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"} /></svg>
          {t(expanded ? "boothMapClose" : "boothMapExpand")}
        </button>
      </div>
    </div>
    <p className="booth-map-help">{t(expanded ? "boothMapExpandedHelp" : "boothMapHelp")}</p>
    <div className="booth-map-viewport" tabIndex={0} aria-label={t("boothMapViewport")}>
      <div className="booth-map-canvas" style={{ width: `${zoom * 100}%` }}>
        <svg className="booth-plan-drawing" viewBox="70 210 1510 1200" role="group" aria-label={t("Sơ đồ gian hàng Global Citizens Day")}>
          <defs>
            <marker id={`${markerId}-visit`} markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" refX="14" refY="9" orient="auto"><path d="m2 2 12 7L2 16" fill="none" stroke="#087d73" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></marker>
            <marker id={`${markerId}-carpet`} markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" refX="15" refY="10" orient="auto"><path d="m3 3 12 7-12 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></marker>
          </defs>
          <rect x="88" y="225" width="1480" height="1165" rx="26" fill="#fff" stroke="#d8e3eb" strokeWidth="2" />
          <g className="booth-plan-culture-zone" aria-hidden="true">
            <rect x="102" y="425" width="390" height="355" rx="22" fill="#f0f8f5" />
            <text x="124" y="460" className="booth-plan-zone-title" fill="#087d73">{t("boothMapCultureZone")}</text>
            <text x="330" y="609" textAnchor="middle" className="booth-plan-wait-label" fill="#39736a">{t("boothMapWaiting")}<tspan x="330" dy="25">{t("boothMapExperience")}</tspan></text>
          </g>
          <g className="booth-plan-hall" aria-label={t("HỘI TRƯỜNG")}>
            <rect x="500" y="250" width="710" height="170" rx="20" fill="#153b55" />
            <text x="855" y="305" textAnchor="middle" className="booth-plan-hall-title" fill="#fff">{t("HỘI TRƯỜNG")}</text>
            {[610, 970].map((x, index) => <g key={x}><rect x={x} y="355" width="150" height="52" rx="10" fill="#f0f6fa" /><text x={x + 75} y="388" textAnchor="middle" className="booth-plan-door-label" fill="#153b55">{t("Cửa")} {index + 1}</text></g>)}
            <g role="img" aria-label="Backdrop GCD"><rect x="782" y="340" width="166" height="67" rx="10" fill="#dff2e8" /><text x="865" y="367" textAnchor="middle" className="booth-plan-backdrop-label" fill="#153b55">Backdrop<tspan x="865" dy="25">GCD</tspan></text></g>
          </g>
          <g aria-label={t("Thảm đỏ đi thẳng vào Cửa 1")} pointerEvents="none">
            <rect x="650" y="420" width="70" height="520" rx="8" fill="#a72f49" />
            <path d="M658 432v496M712 432v496" stroke="#e9b6a6" strokeWidth="1.5" />
            <path d="M685 905V455" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" markerEnd={`url(#${markerId}-carpet)`} />
            <text x="685" y="958" textAnchor="middle" className="booth-plan-route-label" fill="#a72f49">{t("boothMapCarpet")}<tspan x="685" dy="20">{t("Cửa")} 1</tspan></text>
          </g>
          <text x="780" y="552" className="booth-plan-zone-title" fill="#9a650e">{t("boothMapSponsorZone")}</text>
          <g className="booth-plan-routes" aria-label={t("Hướng tham quan gợi ý")}>
            <path d="M1530 970H1296Q1280 970 1280 954V936Q1280 920 1264 920H776Q760 920 760 936V974Q760 990 744 990H636Q620 990 620 974V631Q620 615 604 615H505" className="booth-plan-route-underlay" />
            <path d="M1530 970H1296Q1280 970 1280 954V936Q1280 920 1264 920H776Q760 920 760 936V974Q760 990 744 990H636Q620 990 620 974V631Q620 615 604 615H505" className="booth-plan-route" markerEnd={`url(#${markerId}-visit)`} />
            <path d="M620 990H436Q420 990 420 1006V1100" className="booth-plan-route-underlay" />
            <path d="M620 990H436Q420 990 420 1006V1100" className="booth-plan-route" markerEnd={`url(#${markerId}-visit)`} />
            <path d="M1080 920h-32M620 800v-32" className="booth-plan-route" markerEnd={`url(#${markerId}-visit)`} />
            <text x="1460" y="952" textAnchor="middle" className="booth-plan-entry-label" fill="#087d73">{t("LỐI VÀO")}</text>
          </g>
          <g role="img" aria-label={t("boothMapCheckin")}>
            <rect x="1460" y="838" width="92" height="80" rx="12" fill="#fff1c9" stroke="#c18b2a" strokeWidth="2" />
            <path d="M1494 851h24v22h-24zM1500 847v8M1512 847v8M1500 862l4 4 8-8" fill="none" stroke="#79500f" strokeWidth="2.5" strokeLinejoin="round" />
            <text x="1506" y="899" textAnchor="middle" className="booth-plan-checkin-label" fill="#79500f">{t("boothMapCheckin")}</text>
          </g>
          {visiblePositions.map(booth => {
            const { x, y, w, h } = boothMapBounds(booth);
            const color = BOOTH_ZONES.find(zone => zone.name === booth.zone)?.color || "#3452a1";
            if (!booth.is_bookable) return <g key={booth.id} className="booth-map-service" role="img" aria-label={t("{v0} · {v1} — Đã bố trí, không nhận đăng ký", { v0: booth.code, v1: t(booth.zone) })}>
              <title>{booth.code} {t("· Đã bố trí, không nhận đăng ký")}</title>
              <rect x={x} y={y} width={w} height={h} rx="12" fill="#fff" stroke={color} strokeWidth="2" />
              <text x={x+w/2} y={y+31} textAnchor="middle" className="booth-plan-service-code" fill={color}>{booth.code}</text>
              <text x={x+w/2} y={y+57} textAnchor="middle" className="booth-plan-service-note" fill="#39736a">{t("Điểm hỗ trợ")}</text>
            </g>;
            const active = selected === booth.id;
            const textColor = active || booth.is_booked ? "#fff" : color;
            const special = ["TT06", "TT07", "TT08"].includes(booth.code);
            const gift = booth.code === "TT06";
            const logo = !special && booth.is_booked && booth.confirmed_logo_url && !failedLogos.has(booth.confirmed_logo_url) ? booth.confirmed_logo_url : null;
            return <g key={booth.id} data-code={booth.code} className={`booth-map-spot ${booth.is_booked ? "is-booked" : booth.pending_count ? "is-pending" : "is-open"} ${booth.is_locked ? "is-locked" : ""} ${active ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${label(booth)} · ${t(booth.zone)} — ${status(booth)}`} aria-pressed={active} onClick={() => onSelect(booth.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(booth.id); } }}>
              <title>{label(booth)}: {status(booth)}{booth.confirmed_brand ? ` · ${booth.confirmed_brand}` : ""}</title>
              <rect className="booth-map-spot-fill" x={x} y={y} width={w} height={h} rx="10" style={{ stroke: color, ...(active || booth.is_booked ? { fill: color } : gift ? { fill: "#fff3d5" } : {}) }} />
              {logo ? <g pointerEvents="none"><defs><clipPath id={`${markerId}-logo-${booth.id}`}><rect x={x+2} y={y+2} width={w-4} height={h-4} rx="8" /></clipPath></defs><g clipPath={`url(#${markerId}-logo-${booth.id})`}><rect x={x+2} y={y+2} width={w-4} height={h-4} fill="#fff" /><image href={logo} x={x+2} y={y+2} width={w-4} height={h-4} preserveAspectRatio="xMidYMid meet" onError={() => setFailedLogos(previous => new Set(previous).add(logo))} /></g></g> : <>
                <text x={x+w/2} y={special ? y+29 : y+h/2+8} textAnchor="middle" style={{ fontSize: gift ? 20 : 24, fill: textColor, fontWeight: 650 }}>{gift ? "TT06" : booth.code}</text>
                {special && <text x={x+w/2} y={y+h-18} textAnchor="middle" style={{ fontSize: gift ? 22 : 19, fill: textColor, fontWeight: gift ? 600 : 450 }}>{gift ? t("boothMapGiftName") : booth.code === "TT07" ? t("boothMapCultureBackdrop") : t("Camera 360°")}</text>}
              </>}
              {(active || booth.is_booked) && <g aria-hidden="true" pointerEvents="none"><circle cx={x+w-3} cy={y+2} r="11" fill="#fff" stroke={color} strokeWidth="2" /><path d={`m${x+w-8} ${y+2} 3 3 6-6`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></g>}
              {booth.is_locked && <g transform={`translate(${x+w-18} ${y-9})`} pointerEvents="none" aria-hidden="true"><rect width="25" height="25" rx="6" fill="#495a71" /><rect x="7" y="11" width="11" height="9" rx="2" fill="#fff" /><path d="M9 11V8a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#fff" strokeWidth="2" /></g>}
              {active && <rect className="booth-map-spot-outline" x={x-5} y={y-5} width={w+10} height={h+10} rx="15" style={{ stroke: color }} />}
            </g>;
          })}
        </svg>
      </div>
    </div>
    <div className="booth-plan-zone-legend">{BOOTH_ZONES.filter(zone => zone.prefix !== "BTC").map(zone => <span key={zone.prefix} style={{ color: zone.color }}><i style={{ background: zone.background, borderColor: zone.color }} />{zonePositionCount(zone.prefix)} {t(zone.name).toLowerCase()}</span>)}</div>
    <div className="booth-plan-route-legend"><span><i className="visit-route" />{t("Hướng tham quan gợi ý")}</span><span><i className="hall-route" />{t("Vào hội trường theo giờ")}</span></div>
    <div className="booth-map-legend"><span><i className="open" />{t("Nhận đề xuất")}</span><span><i className="pending" />{t("Có đề xuất")}</span><span><i className="booked" />{t("Đã xác nhận")}</span><span><i className="locked" />{t("Tạm khóa đăng ký")}</span></div>
    {selectedBooth && <div className="booth-map-selection" role="status"><span>{t("boothMapSelected")}<strong>{label(selectedBooth)}</strong></span><span>{status(selectedBooth)}</span>{expanded && <button type="button" onClick={closeMap}>{t("boothMapDone")}</button>}</div>}
    <p className="booth-map-note">{t("boothMapNote")}</p>
  </>;

  return <>
    <div className="booth-map-card booth-wayfinding" hidden={expanded}>{!expanded && content}</div>
    <dialog ref={dialogRef} className="booth-map-dialog" aria-label={t("Sơ đồ gian hàng Global Citizens Day")} onCancel={closeMap} onClick={event => { if (event.target === event.currentTarget) closeMap(); }}>
      {expanded && <div className="booth-map-card booth-wayfinding is-expanded">{content}</div>}
    </dialog>
  </>;
}
