"use client";

import { useEffect, useRef, useState } from "react";
import SketchfabViewer from "./sketchfab-viewer";

const landmarks = [
  { name: "Chùa Một Cột", place: "HÀ NỘI", description: "Một đoá sen vươn lên từ mặt nước — cảm hứng từ kiến trúc chùa Một Cột.", tag: "01 / MÁI CHÙA TRONG KÝ ỨC", sketchfab: {
    id: "9b2562f8884141c0b1777e1a1c05887c", title: "One Pillar Pagoda - Chùa Một Cột",
    url: "https://sketchfab.com/3d-models/one-pillar-pagoda-chua-mot-cot-9b2562f8884141c0b1777e1a1c05887c", author: "inucaboo", authorUrl: "https://sketchfab.com/inulab",
  } },
  { name: "Tháp Rùa", place: "HÀ NỘI", description: "Những tầng tháp trầm mặc giữa mặt hồ — một hình ảnh thân quen của Hà Nội.", tag: "02 / DẤU ẤN GIỮA LÒNG HỒ", sketchfab: {
    id: "a22adcd051914e2e911debf0730cab28", title: "Tháp Rùa - Turtle Tower on Hoan Kiem Lake",
    url: "https://sketchfab.com/3d-models/thap-rua-turtle-tower-on-hoan-kiem-lake-a22adcd051914e2e911debf0730cab28", author: "minhduc26119931", authorUrl: "https://sketchfab.com/minhduc26119931",
  } },
  { name: "Ngọ Môn", place: "HUẾ", description: "Nhịp mái ngói, sắc son và cổng thành — khám phá kiến trúc Ngọ Môn qua mô hình 3D.", tag: "03 / VẺ ĐẸP CỐ ĐÔ", sketchfab: {
    id: "4a1866001d034611a47b9116695da1d2", title: "Ngọ Môn (Meridian Gate) 3D Model",
    url: "https://sketchfab.com/3d-models/ngo-mon-meridian-gate-3d-model-4a1866001d034611a47b9116695da1d2", author: "Đào Minh Đức", authorUrl: "https://sketchfab.com/dmd_hn",
  } },
];

export default function HeritageViewer({ reducedMotion }: { reducedMotion: boolean }) {
  const [model, setModel] = useState(0);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let intersects = true;
    const update = () => setVisible(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; update(); });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return <div className="viewer" ref={rootRef}>
    <div className="viewer-topline"><span>{landmarks[model].tag}</span><span>↔ 360°</span></div>
    <SketchfabViewer key={landmarks[model].sketchfab.id} model={landmarks[model].sketchfab} reducedMotion={reducedMotion} visible={visible} />
    <div className="landmark-caption" aria-live="polite"><div><h3>{landmarks[model].name}</h3><span>{landmarks[model].place} · VIỆT NAM</span></div><p>{landmarks[model].description}</p></div>
    <div className="landmark-tabs" role="group" aria-label="Chọn di sản">{landmarks.map((landmark, i) => <button key={landmark.name} aria-pressed={model === i} className={model === i ? "selected" : ""} onClick={() => { setModel(i); }}><span>0{i + 1}</span>{landmark.name}</button>)}</div>
  </div>;
}
