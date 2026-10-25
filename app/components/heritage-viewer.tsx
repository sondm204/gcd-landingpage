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
  { name: "Nhà hát Thành phố", place: "TP. HỒ CHÍ MINH", description: "Một điểm nhìn về kiến trúc và đời sống nghệ thuật giữa lòng thành phố.", tag: "04 / NHỊP ĐIỆU ĐÔ THỊ", sketchfab: {
    id: "4267a8d941414589bc49f899c9c9d61f", title: "City Theatre — Việt Nam", url: "https://sketchfab.com/3d-models/city-theatre-viet-nam-4267a8d941414589bc49f899c9c9d61f",
  } },
  { name: "Chùa Cầu", place: "HỘI AN", description: "Mái cầu giữa phố cổ — một góc nhìn về sự gặp gỡ và giao thoa văn hoá.", tag: "05 / NHỊP CẦU GIAO THOA", sketchfab: {
    id: "59d89d40238c445f8316364b5fa45acd", title: "Chùa Cầu — Japanese Bridge, Hội An", url: "https://sketchfab.com/3d-models/chua-cau-japanese-bridge-hoi-an-59d89d40238c445f8316364b5fa45acd",
  } },
  { name: "Khuê Văn Các", place: "VĂN MIẾU · HÀ NỘI", description: "Khám phá những đường nét kiến trúc gắn với tinh thần hiếu học và trân trọng tri thức.", tag: "06 / DẤU ẤN VĂN CHƯƠNG", sketchfab: {
    id: "e448a20cb453475ab52b7a6486eae671", title: "Khuê Văn Các", url: "https://sketchfab.com/3d-models/khue-van-cac-e448a20cb453475ab52b7a6486eae671", author: "kien249", authorUrl: "https://sketchfab.com/kien249",
  } },
  { name: "Lăng Tự Đức", place: "HUẾ", description: "Đi qua không gian kiến trúc và cảnh quan để tìm một nhịp Huế trầm lắng.", tag: "07 / NÉT TĨNH CỐ ĐÔ", sketchfab: {
    id: "978f8e7afd9a4aebb738339c9f0087a0", title: "Tomb of Tu Duc — Lăng Tự Đức", url: "https://sketchfab.com/3d-models/tomb-of-tu-duc-978f8e7afd9a4aebb738339c9f0087a0",
  } },
  { name: "Nhà thờ Chính toà", place: "ĐÀ NẴNG", description: "Một lát cắt kiến trúc trong đời sống đô thị Đà Nẵng, nhìn từ không gian 3D.", tag: "08 / KIẾN TRÚC GIỮA ĐỜI THƯỜNG", sketchfab: {
    id: "b02a72b4468b4cceb1db4f2cc394d182", title: "Cathedral Church — Nhà thờ Chính toà", url: "https://sketchfab.com/3d-models/cathedral-church-b02a72b4468b4cceb1db4f2cc394d182",
  } },
  { name: "Trống đồng Đông Sơn", place: "VĂN HOÁ ĐÔNG SƠN", description: "Quan sát hình dáng và hoa văn trống đồng, từ chi tiết nhỏ đến câu chuyện về cội nguồn.", tag: "09 / ÂM VANG CỘI NGUỒN", sketchfab: {
    id: "7e38e31e0ac64f43a2035aecfc32f6b2", title: "Trống đồng Việt Nam", url: "https://sketchfab.com/3d-models/trong-ong-viet-nam-7e38e31e0ac64f43a2035aecfc32f6b2",
  } },
  { name: "Nón lá", place: "VĂN HOÁ VIỆT NAM", description: "Một vật dụng thân quen mở ra câu chuyện về bàn tay làm nghề và bản sắc trong đời sống.", tag: "10 / VẺ ĐẸP TỪ ĐIỀU GIẢN DỊ", sketchfab: {
    id: "08338678a712414fbdbf392e6d8ce53e", title: "Conical Hats — Nón lá Việt Nam", url: "https://sketchfab.com/3d-models/conical-hats-non-la-viet-nam-08338678a712414fbdbf392e6d8ce53e",
  } },
  { name: "Bia tiến sĩ", place: "VĂN MIẾU · HÀ NỘI", description: "Khám phá hình khối và nét khắc trên bia tiến sĩ, một câu chuyện về học tập và sự tiếp nối tri thức.", tag: "11 / TRI THỨC ĐƯỢC TIẾP NỐI", sketchfab: {
    id: "7aac2b6d65764a519fdbc71ceb03227f", title: "Bia tiến sĩ năm 1442 — Văn Miếu Quốc Tử Giám", url: "https://sketchfab.com/3d-models/bia-tien-si-nam-1442-van-mieu-quoc-tu-giam-7aac2b6d65764a519fdbc71ceb03227f",
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
    <div className="landmark-tabs" role="group" aria-label="Chọn di sản">{landmarks.map((landmark, i) => <button key={landmark.name} type="button" aria-pressed={model === i} className={model === i ? "selected" : ""} onClick={() => { setModel(i); }}><span>{String(i + 1).padStart(2, "0")}</span>{landmark.name}</button>)}</div>
  </div>;
}
