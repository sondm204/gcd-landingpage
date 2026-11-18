"use client";
import { useEffect, useRef, useState } from "react";
import geometry from "./map-data.json";
import { MAP_HEIGHT, MAP_WIDTH, bounds, project, unproject, type Coordinate } from "./engine";

type View = { x: number; y: number; width: number; height: number };
type Pointer = { x: number; y: number };
type Gesture = { view: View; matrix: DOMMatrix; anchor: DOMPoint; origin: Pointer; distance: number; moved: boolean };
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
  const currentView = useRef<View>(overview);
  const pointers = useRef(new Map<number, Pointer>());
  const gesture = useRef<Gesture | null>(null);
  const suppressTap = useRef(false);
  const zoomFraction = view.width / MAP_WIDTH;
  // SVG units per CSS pixel: preserve readable labels/pins even in a short mobile map.
  const scale = Math.max(view.width / Math.max(1, size.width), view.height / Math.max(1, size.height));
  useEffect(() => {
    const element = svg.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => { setSize({ width: entry.contentRect.width, height: entry.contentRect.height }); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  function zoom(factor: number) {
    const v = currentView.current;
    const width = Math.max(MAP_WIDTH / 4, Math.min(MAP_WIDTH, v.width * factor));
    const height = width / MAP_WIDTH * MAP_HEIGHT;
    updateView({ x: v.x + (v.width - width) / 2, y: v.y + (v.height - height) / 2, width, height });
  }
  function updateView(next: View) {
    currentView.current = clampView(next);
    setView(currentView.current);
  }
  function startGesture() {
    const points = [...pointers.current.values()];
    const matrix = svg.current?.getScreenCTM()?.inverse();
    if (!points.length || !matrix) { gesture.current = null; return; }
    const [a, b] = points;
    const origin = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
    gesture.current = { view: currentView.current, matrix, origin,
      anchor: new DOMPoint(origin.x, origin.y).matrixTransform(matrix),
      distance: b ? Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)) : 0, moved: suppressTap.current };
  }
  function finishPointer(id: number, cancelled = false) {
    const point = pointers.current.get(id);
    if (!point) return;
    const g = gesture.current;
    if (!cancelled && pointers.current.size === 1 && g && !g.moved && !suppressTap.current && !disabled) {
      const matrix = svg.current?.getScreenCTM()?.inverse();
      if (matrix) {
        const p = new DOMPoint(point.x, point.y).matrixTransform(matrix);
        if (p.x >= 0 && p.y >= 0 && p.x <= MAP_WIDTH && p.y <= MAP_HEIGHT) onPick(unproject(p.x, p.y));
      }
    }
    pointers.current.delete(id);
    // Rebase after lifting either finger; the remaining finger may keep panning.
    if (!pointers.current.size) { gesture.current = null; suppressTap.current = false; }
    else { suppressTap.current = true; startGesture(); }
  }
  function label(text: string, point: Coordinate, className = "") { const p = project(point); return <text key={text} x={p.x} y={p.y} textAnchor="middle" fontSize={11 * scale} className={className}>{text}</text>; }
  const target = answer ? project(answer) : null;
  const guess = pin ? project(pin) : null;
  return <div className="place-map-shell">
    <div className="place-map-tools" role="group" aria-label="Điều khiển bản đồ"><button type="button" aria-label="Phóng to bản đồ" disabled={zoomFraction <= .25} onClick={() => zoom(.65)}>+</button><button type="button" aria-label="Thu nhỏ bản đồ" disabled={zoomFraction >= 1} onClick={() => zoom(1 / .65)}>−</button><button type="button" aria-label="Xem toàn bộ bản đồ" onClick={() => updateView(overview)}>⌂</button></div>
    <svg ref={svg} className="place-map" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="group" tabIndex={0} aria-label="Bản đồ Việt Nam. Chạm để ghim; kéo một ngón để di chuyển; chụm hoặc tách hai ngón để thu phóng. Có thể dùng các phím mũi tên để chỉnh ghim." data-zoom={Math.round(1 / zoomFraction * 100)} data-guess-lat={pin?.lat} data-guess-lon={pin?.lon}
      onPointerDown={e => {
        if (e.pointerType !== "touch" && e.button !== 0) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size > 1) suppressTap.current = true;
        startGesture();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture.current; if (!g) return;
        const [a, b] = [...pointers.current.values()];
        const center = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
        if (b || Math.hypot(center.x - g.origin.x, center.y - g.origin.y) > 6) { g.moved = true; suppressTap.current = true; }
        if (!g.moved) return;
        const p = new DOMPoint(center.x, center.y).matrixTransform(g.matrix);
        const width = b && g.distance ? Math.max(MAP_WIDTH / 4, Math.min(MAP_WIDTH, g.view.width * g.distance / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)))) : g.view.width;
        const ratio = width / g.view.width;
        updateView({ x: g.anchor.x - (p.x - g.view.x) * ratio, y: g.anchor.y - (p.y - g.view.y) * ratio, width, height: g.view.height * ratio });
      }}
      onPointerUp={e => {
        if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        finishPointer(e.pointerId);
      }}
      onPointerCancel={e => finishPointer(e.pointerId, true)} onLostPointerCapture={e => finishPointer(e.pointerId, true)}
      onKeyDown={e => {
        if (e.key === "+" || e.key === "-") { e.preventDefault(); zoom(e.key === "+" ? .65 : 1 / .65); return; }
        if (disabled || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        const p = pin ?? { lat: 16, lon: 107 };
        const step = .25 * zoomFraction;
        const next = { lat: Math.max(bounds.south, Math.min(bounds.north, p.lat + (e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0))), lon: Math.max(bounds.west, Math.min(bounds.east, p.lon + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0))) };
        const pos = project(next);
        const v = currentView.current;
        updateView({ ...v, x: pos.x - v.width / 2, y: pos.y - v.height / 2 }); onPick(next);
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
