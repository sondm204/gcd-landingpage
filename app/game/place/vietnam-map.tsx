"use client";
import { useEffect, useRef, useState } from "react";
import geometry from "./map-data.json";
import { MAP_HEIGHT, MAP_WIDTH, bounds, project, unproject, type Coordinate } from "./engine";

type View = { x: number; y: number; width: number; height: number };
const overview: View = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
const paths = geometry.map(country => ({ id: country.id, d: country.polygons.map(poly => poly.map(ring => ring.map(([lon, lat], i) => { const p = project({ lon, lat }); return `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join("") + "Z").join("")).join("") }));
function clampView(v: View): View { return { ...v, x: Math.max(0, Math.min(MAP_WIDTH - v.width, v.x)), y: Math.max(0, Math.min(MAP_HEIGHT - v.height, v.y)) }; }
function Marker({ point, answer, scale, labelAbove }: { point: Coordinate; answer?: boolean; scale: number; labelAbove?: boolean }) {
  const p = project(point);
  return <g transform={`translate(${p.x},${p.y}) scale(${scale})`} className={answer ? "place-answer-pin" : "place-guess-pin"}>
    <path d="M0 0C-4-6-13-13-13-22a13 13 0 1 1 26 0C13-13 4-6 0 0Z" stroke="white" strokeWidth="2" />
    <circle cy="-22" r="4" fill="white" />
    <text y={labelAbove ? -42 : 15} textAnchor="middle">{answer ? "Vị trí đúng" : "Bạn ghim"}</text>
  </g>;
}
export default function VietnamMap({ pin, answer, onPick, disabled = false }: { pin: Coordinate | null; answer?: Coordinate; onPick: (point: Coordinate) => void; disabled?: boolean }) {
  const [view, setView] = useState<View>(overview);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const drag = useRef<{ id: number; clientX: number; clientY: number; x: number; y: number; moved: boolean; view: View; matrix: DOMMatrix } | null>(null);
  const zoomFraction = view.width / MAP_WIDTH;
  // SVG units per CSS pixel: preserve readable labels/pins even in a short mobile map.
  const scale = Math.max(view.width / Math.max(1, size.width), view.height / Math.max(1, size.height));
  useEffect(() => {
    const element = svg.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => { setSize({ width: entry.contentRect.width, height: entry.contentRect.height }); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  function zoom(factor: number) {
    setView(v => { const width = Math.max(MAP_WIDTH / 4, Math.min(MAP_WIDTH, v.width * factor)); const height = width / MAP_WIDTH * MAP_HEIGHT;
      return clampView({ x: v.x + (v.width - width) / 2, y: v.y + (v.height - height) / 2, width, height }); });
  }
  function label(text: string, point: Coordinate, className = "") { const p = project(point); return <text key={text} x={p.x} y={p.y} textAnchor="middle" fontSize={11 * scale} className={className}>{text}</text>; }
  const target = answer ? project(answer) : null;
  const guess = pin ? project(pin) : null;
  return <div className="place-map-shell">
    <div className="place-map-tools" role="group" aria-label="Điều khiển bản đồ"><button type="button" aria-label="Phóng to bản đồ" disabled={zoomFraction <= .25} onClick={() => zoom(.65)}>+</button><button type="button" aria-label="Thu nhỏ bản đồ" disabled={zoomFraction >= 1} onClick={() => zoom(1 / .65)}>−</button><button type="button" aria-label="Xem toàn bộ bản đồ" onClick={() => setView(overview)}>⌂</button></div>
    <svg ref={svg} className="place-map" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="group" tabIndex={0} aria-label="Bản đồ Việt Nam. Chạm để ghim; kéo để di chuyển. Có thể dùng các phím mũi tên để chỉnh ghim." data-zoom={Math.round(1 / zoomFraction * 100)} data-guess-lat={pin?.lat} data-guess-lon={pin?.lon}
      onPointerDown={e => {
        if (e.button !== 0 || (e.pointerType === "touch" && !e.isPrimary)) return;
        const matrix = svg.current?.getScreenCTM()?.inverse(); if (!matrix) return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix);
        drag.current = { id: e.pointerId, clientX: e.clientX, clientY: e.clientY, x: p.x, y: p.y, moved: false, view, matrix };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        const d = drag.current; if (!d || d.id !== e.pointerId) return;
        if (Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) > 6) d.moved = true;
        if (!d.moved) return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(d.matrix);
        setView(clampView({ ...d.view, x: d.view.x - (p.x - d.x), y: d.view.y - (p.y - d.y) }));
      }}
      onPointerUp={e => {
        const d = drag.current; if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        if (d.moved || disabled) return;
        const matrix = svg.current?.getScreenCTM()?.inverse(); if (!matrix) return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix);
        if (p.x >= 0 && p.y >= 0 && p.x <= MAP_WIDTH && p.y <= MAP_HEIGHT) onPick(unproject(p.x, p.y));
      }}
      onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={e => {
        if (e.key === "+" || e.key === "-") { e.preventDefault(); zoom(e.key === "+" ? .65 : 1 / .65); return; }
        if (disabled || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        const p = pin ?? { lat: 16, lon: 107 };
        const step = .25 * zoomFraction;
        const next = { lat: Math.max(bounds.south, Math.min(bounds.north, p.lat + (e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0))), lon: Math.max(bounds.west, Math.min(bounds.east, p.lon + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0))) };
        const pos = project(next);
        setView(v => clampView({ ...v, x: pos.x - v.width / 2, y: pos.y - v.height / 2 })); onPick(next);
      }}>
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#e3eef0" />
      <g className="place-grid">{[104, 108, 112, 116].map(lon => <line key={lon} x1={project({ lat: 24, lon }).x} x2={project({ lat: 24, lon }).x} y1="0" y2={MAP_HEIGHT} />)}{[8, 12, 16, 20, 24].map(lat => <line key={lat} y1={project({ lat, lon: 101 }).y} y2={project({ lat, lon: 101 }).y} x1="0" x2={MAP_WIDTH} />)}</g>
      {paths.map(c => <path key={c.id} d={c.d} className={c.id === "VNM" ? "place-land-vn" : "place-land"} fillRule="evenodd" vectorEffect="non-scaling-stroke" />)}
      <g className="place-map-labels" aria-hidden="true">
        {label("VIỆT NAM", { lat: 18.9, lon: 105.4 }, "place-country-label")}
        {label("LÀO", { lat: 18.3, lon: 102.8 })}{label("CAMPUCHIA", { lat: 12.8, lon: 104.3 })}{label("TRUNG QUỐC", { lat: 23.4, lon: 109.9 })}
        {label("BIỂN ĐÔNG", { lat: 19.1, lon: 114.9 }, "place-sea-label")}
        {[{ text: "Hà Nội", lat: 21.0285, lon: 105.8542 }, { text: "TP. Hồ Chí Minh", lat: 10.7769, lon: 106.7009 }].map(c => { const p = project(c); return <g key={c.text}><circle cx={p.x} cy={p.y} r={2 * scale} fill="#315a52" /><text x={p.x + 6 * scale} y={p.y - 6 * scale} fontSize={10 * scale}>{c.text}</text></g>; })}
        {label("Phú Quốc", { lat: 9.7, lon: 103.7 })}{label("Côn Đảo", { lat: 8.5, lon: 106.5 })}
      </g>
      {[{ text: "QĐ. Hoàng Sa", lat: 16.5, lon: 112 }, { text: "QĐ. Trường Sa", lat: 10, lon: 114 }].map(a => { const p = project(a); return <g key={a.text} className="place-islands" transform={`translate(${p.x},${p.y}) scale(${scale})`}><circle r="24" fill="none" strokeDasharray="2 5" /><path d="m-12-4 3-3 2 4m13 5 3-5 2 2m-9 9 3-2" fill="none" strokeWidth="2" />{a.lat === 10 ? <text x="28" y="-12">QĐ.<tspan x="28" dy="12">Trường Sa</tspan><tspan x="28" dy="12">(Việt Nam)</tspan></text> : <text y="40" textAnchor="middle">{a.text}<tspan x="0" dy="13">(Việt Nam)</tspan></text>}</g>; })}
      {target && answer && <ellipse className="place-answer-radius" cx={target.x} cy={target.y} rx={100 / (111.2 * Math.cos(answer.lat * Math.PI / 180)) / 17 * MAP_WIDTH} ry={100 / 111.2 / 17 * MAP_HEIGHT} />}
      {guess && target && <line x1={guess.x} y1={guess.y} x2={target.x} y2={target.y} className="place-distance-line" vectorEffect="non-scaling-stroke" />}
      {pin && <Marker point={pin} scale={scale} labelAbove={Boolean(answer)} />}{answer && <Marker point={answer} answer scale={scale} />}
    </svg>
    <span className="place-compass" aria-hidden="true">N<br />↑</span>
    <span className="place-map-credit"><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · Ký hiệu quần đảo</span>
  </div>;
}
