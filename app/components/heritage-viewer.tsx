"use client";

import { Component, useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DetailedRoof as Roof, ArchTrim } from "./architectural-details";
import { Sun } from "./ornaments";

const landmarks = [
  { name: "Chùa Một Cột", place: "HÀ NỘI", description: "Một đoá sen vươn lên từ mặt nước — cảm hứng từ kiến trúc chùa Một Cột.", tag: "01 / MÁI CHÙA TRONG KÝ ỨC" },
  { name: "Tháp Rùa", place: "HÀ NỘI", description: "Những tầng tháp trầm mặc giữa mặt hồ — một hình ảnh thân quen của Hà Nội.", tag: "02 / DẤU ẤN GIỮA LÒNG HỒ" },
  { name: "Ngọ Môn", place: "HUẾ", description: "Nhịp mái ngói, sắc son và cổng thành — một phác hoạ lấy cảm hứng từ Ngọ Môn.", tag: "03 / VẺ ĐẸP CỐ ĐÔ" },
];

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-loading scene-fallback"><Sun /><span>Thiết bị chưa hỗ trợ không gian 3D.<br />Bạn vẫn có thể khám phá câu chuyện bên dưới.</span></div> : this.props.children;
  }
}

type Triple = [number, number, number];

function Block({ position, size, color = "#d7bd88" }: { position: Triple; size: Triple; color?: string }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>;
}

function Island({ water = true }: { water?: boolean }) {
  return <group>
    <mesh position={[0, -0.34, 0]} receiveShadow><cylinderGeometry args={[3.15, 2.85, 0.5, 64]} /><meshStandardMaterial color="#bda777" roughness={1} /></mesh>
    <mesh position={[0, -0.065, 0]} receiveShadow><cylinderGeometry args={[3.12, 3.12, 0.07, 64]} /><meshStandardMaterial color={water ? "#4e8b80" : "#bdb88b"} roughness={0.36} metalness={0.15} /></mesh>
    {water && [2.3, 2.6, 2.9].map((radius) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><ringGeometry args={[radius, radius + 0.012, 80]} /><meshBasicMaterial color="#83b6a2" transparent opacity={0.55} /></mesh>)}
    {[-2.1, 1.8, 2.4, -1.5].map((x, i) => <group key={x} position={[x, 0.015, i % 2 ? 1.2 : -1.4]}>
      <mesh rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.24, 16, 0, Math.PI * 1.85]} /><meshStandardMaterial color="#355e42" side={2} /></mesh>
      {Array.from({ length: 5 }, (_, j) => <mesh key={j} position={[Math.cos(j * 1.26) * 0.05, 0.08, Math.sin(j * 1.26) * 0.05]} rotation={[0.5, j * 1.26, 0.5]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color="#e4a094" /></mesh>)}
    </group>)}
  </group>;
}

function Pagoda() {
  return <group position={[0, 0.03, 0]}>
    <Island />
    <mesh position={[0, 0.65, 0]} castShadow><cylinderGeometry args={[0.23, 0.29, 1.3, 12]} /><meshStandardMaterial color="#b7b39d" /></mesh>
    <Block position={[0, 1.25, 0]} size={[2.15, 0.18, 1.95]} />
    <Block position={[0, 1.43, 0]} size={[1.9, 0.15, 1.72]} color="#8b4b34" />
    <Block position={[0, 1.98, -0.1]} size={[1.45, 0.98, 1.2]} color="#a7633d" />
    {[-0.65, 0, 0.65].map((x) => <Block key={x} position={[x, 1.95, 0.515]} size={[0.33, 0.73, 0.045]} color="#442e26" />)}
    {[-0.87, 0.87].flatMap((x) => [-0.75, 0.75].map((z) => <Block key={`${x}-${z}`} position={[x, 1.98, z]} size={[0.09, 1.05, 0.09]} color="#8c392c" />))}
    {[-0.65, 0, 0.65].flatMap((x) => Array.from({ length: 5 }, (_, i) => <Block key={x + ":" + i} position={[x + (i - 2) * 0.052, 1.98, 0.55]} size={[0.016, 0.6, 0.025]} color="#bd8652" />))}
    <Roof y={2.7} width={2.55} depth={2.35} height={0.85} />
    {[-1, 1].map((x) => <group key={x}><Block position={[x, 1.7, 0]} size={[0.05, 0.06, 1.8]} color="#d6c296" />{Array.from({ length: 7 }, (_, i) => <Block key={i} position={[x, 1.52, (i - 3) * 0.27]} size={[0.045, 0.35, 0.045]} />)}</group>)}
    {Array.from({ length: 9 }, (_, i) => <Block key={i} position={[0, 0.08 + i * 0.15, 2.45 - i * 0.17]} size={[0.65, 0.15, 0.25]} color="#bfba9d" />)}
  </group>;
}

function TurtleTower() {
  return <group>
    <Island />
    <mesh position={[0, 0.06, 0]} receiveShadow><cylinderGeometry args={[1.8, 1.95, 0.18, 12]} /><meshStandardMaterial color="#869166" /></mesh>
    {[0, 1, 2].map((level) => {
      const width = 2.2 - level * 0.4;
      const y = 0.6 + level * 0.83;
      return <group key={level}>
        <Block position={[0, y, 0]} size={[width, 0.76, width * 0.74]} color={level === 2 ? "#ddcca1" : "#c9b991"} />
        {[-1, 0, 1].map((i) => <group key={i}>
          <ArchTrim x={i * width * 0.29} y={y - 0.07} z={width * 0.37 + 0.035} /><Block position={[i * width * 0.29, y - 0.07, width * 0.37 + 0.005]} size={[0.22, 0.39, 0.015]} color="#3c4940" />
          <mesh position={[i * width * 0.29, y + 0.125, width * 0.37 + 0.015]}><circleGeometry args={[0.11, 16, 0, Math.PI]} /><meshStandardMaterial color="#3c4940" /></mesh>
          <Block position={[width * 0.5 + 0.005, y, i * width * 0.2]} size={[0.015, 0.38, 0.18]} color="#3c4940" />
        </group>)}
        {[-1, 1].map((side) => <Block key={side} position={[side * (width / 2 - 0.07), y, width * 0.37 + 0.025]} size={[0.09, 0.72, 0.06]} color="#e2d4b7" />)}
        {[0.19, 0.3].map((offset) => <Block key={offset} position={[0, y + offset, width * 0.37 + 0.02]} size={[width, 0.025, 0.035]} color="#b5a284" />)}
        <Block position={[0, y + 0.41, 0]} size={[width + 0.14, 0.1, width * 0.74 + 0.14]} color="#e2d4af" />
      </group>;
    })}
    <Roof y={2.95} width={1.58} depth={1.23} height={0.6} />
    <mesh position={[0, 3.36, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#ccb576" /></mesh>
  </group>;
}

function ImperialGate() {
  return <group scale={0.83}>
    <Island water={false} />
    <Block position={[0, 0.57, 0]} size={[4.8, 1.14, 1.7]} color="#bdad83" />
    {[-1.55, -0.77, 0, 0.77, 1.55].map((x) => <group key={x}><ArchTrim x={x} y={0.39} z={0.9} width={0.4} height={0.76} /><Block position={[x, 0.39, 0.86]} size={[0.4, 0.76, 0.02]} color="#344039" /><mesh position={[x, 0.77, 0.875]}><circleGeometry args={[0.2, 16, 0, Math.PI]} /><meshStandardMaterial color="#344039" /></mesh></group>)}
    {Array.from({ length: 6 }, (_, row) => <group key={row}>
      <Block position={[0, 0.12 + row * 0.17, 0.855]} size={[4.78, 0.012, 0.008]} color="#9c8c70" />
      {Array.from({ length: 16 }, (_, i) => <Block key={i} position={[-2.25 + i * 0.29 + (row % 2) * 0.08, 0.2 + row * 0.17, 0.855]} size={[0.01, 0.15, 0.008]} color="#9c8c70" />)}
    </group>)}
    <Block position={[0, 1.2, 0]} size={[5, 0.12, 1.95]} color="#e2cd98" />
    {[-1.75, 0, 1.75].map((x) => <group key={x} position={[x, 0, 0]}>
      <Block position={[0, 1.7, 0]} size={[1.2, 0.9, 1.25]} color="#a54e34" />
      {[-0.49, 0, 0.49].map((px) => <Block key={px} position={[px, 1.74, 0.65]} size={[0.055, 0.88, 0.055]} color="#ebc578" />)}
      <Roof y={2.35} width={1.8} depth={1.75} height={0.56} color="#a58837" />
      {x === 0 && <><Block position={[0, 2.68, 0]} size={[1.03, 0.45, 1]} color="#a95438" /><Roof y={3.14} width={1.65} depth={1.55} height={0.55} color="#b99a48" /></>}
    </group>)}
    {Array.from({ length: 15 }, (_, i) => <Block key={i} position={[(i - 7) * 0.34, 1.37, 0.93]} size={[0.045, 0.3, 0.045]} />)}
    <Block position={[0, 1.52, 0.93]} size={[4.85, 0.05, 0.06]} />
  </group>;
}

export default function HeritageViewer({ reducedMotion }: { reducedMotion: boolean }) {
  const [model, setModel] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [visible, setVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  function zoomModel(factor: number) {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = controls.object.position.clone().sub(controls.target);
    const distance = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor));
    controls.object.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
  }

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
    <div className="canvas-wrap" role="img" aria-label={`Mô hình 3D cách điệu ${landmarks[model].name}. Kéo để xoay hoặc dùng nút Xoay trái và Xoay phải bên dưới.`}>
      <div className="scene-halo" />
      {contextLost ? <div className="scene-loading scene-fallback"><Sun /><span>Không gian 3D tạm dừng.<br />Tải lại trang để thử lại.</span></div> : <SceneBoundary>
        <Canvas shadows dpr={[1, 1.6]} camera={{ position: [5.5, 4.2, 6.5], fov: 39 }} frameloop={visible && autoRotate && !reducedMotion ? "always" : "demand"} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", () => setContextLost(true), { once: true }); }} fallback={<div className="scene-loading">Trình duyệt chưa hỗ trợ WebGL.</div>}>
          <ambientLight intensity={0.45} />
          <hemisphereLight args={["#e9f1ff", "#51472f", 0.9]} />
          <directionalLight position={[3, 7, 4]} intensity={2.8} color="#fff0d5" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={0.04} />
          <directionalLight position={[-5, 3, -3]} intensity={1.1} color="#bfd7ed" /><group position={[0, -1, 0]}>{model === 0 ? <Pagoda /> : model === 1 ? <TurtleTower /> : <ImperialGate />}</group>
          <OrbitControls ref={controlsRef} enablePan={false} enableZoom minDistance={4} maxDistance={16} zoomSpeed={0.7} minPolarAngle={0.4} maxPolarAngle={Math.PI / 2.15} autoRotate={autoRotate && !reducedMotion && visible} autoRotateSpeed={0.65} target={[0, 0.35, 0]} />
        </Canvas>
      </SceneBoundary>}
      <div className="viewer-tools">
        <button type="button" aria-label="Phóng to mô hình" title="Phóng to" onClick={() => zoomModel(0.8)}>+</button>
        <button type="button" aria-label="Thu nhỏ mô hình" title="Thu nhỏ" onClick={() => zoomModel(1.25)}>−</button>
        <button aria-label="Xoay trái" onClick={() => { setAutoRotate(false); if (controlsRef.current) controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - Math.PI / 5); }}>↶</button>
        <button aria-label="Đặt lại góc nhìn" onClick={() => controlsRef.current?.reset()}>⟲</button>
        <button aria-label="Xoay phải" onClick={() => { setAutoRotate(false); if (controlsRef.current) controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + Math.PI / 5); }}>↷</button>
        {!reducedMotion && <button aria-label={autoRotate ? "Dừng tự xoay" : "Bật tự xoay"} aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)}>{autoRotate ? "Ⅱ" : "▷"}</button>}
      </div>
    </div>
    <div className="landmark-caption" aria-live="polite"><div><h3>{landmarks[model].name}</h3><span>{landmarks[model].place} · VIỆT NAM</span></div><p>{landmarks[model].description}</p></div>
    <div className="landmark-tabs" role="group" aria-label="Chọn di sản">{landmarks.map((landmark, i) => <button key={landmark.name} aria-pressed={model === i} className={model === i ? "selected" : ""} onClick={() => { setModel(i); controlsRef.current?.reset(); }}><span>0{i + 1}</span>{landmark.name}</button>)}</div>
  </div>;
}
