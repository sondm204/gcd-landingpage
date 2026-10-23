import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, CatmullRomCurve3, Vector3 } from "three";

type Point = [number, number, number];

function Ridge({ points, color, radius = 0.018 }: { points: Point[]; color: string; radius?: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points]);
  return <mesh castShadow><tubeGeometry args={[curve, 16, radius, 5, false]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>;
}

export function DetailedRoof({ y, width, depth, height = 0.65, color = "#655a44" }: { y: number; width: number; depth: number; height?: number; color?: string }) {
  const point = (side: number, u: number, t: number): Point => {
    const rise = height * (1 - t) ** 1.7 + 0.14 * t ** 8;
    return side < 2
      ? [u * width * (0.3 + 0.7 * t) / 2, rise, (side ? -1 : 1) * depth * t / 2]
      : [(side === 2 ? 1 : -1) * width * (0.3 + 0.7 * t) / 2, rise, u * depth * t / 2];
  };
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  for (let side = 0; side < 4; side++) for (let row = 0; row < 12; row++) for (let col = 0; col < 16; col++) {
    const u = col / 8 - 1, v = (col + 1) / 8 - 1, t = row / 12, next = (row + 1) / 12;
    const a = point(side, u, t), b = point(side, v, t), c = point(side, u, next), d = point(side, v, next);
    vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
  }
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return <group position={[0, y - height / 2, 0]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.87} side={2} /></mesh>
    {[0, 1, 2, 3].map((side) => <group key={side}>
      {Array.from({ length: 17 }, (_, i) => <Ridge key={i} points={Array.from({ length: 13 }, (_, j) => point(side, i / 8 - 1, j / 12))} color={i % 3 ? color : "#8d8065"} radius={0.014} />)}
      {[0.25, 0.5, 0.75, 1].map((t) => <Ridge key={t} points={[-1, 0, 1].map((u) => point(side, u, t))} color="#9a8865" radius={t === 1 ? 0.035 : 0.009} />)}
    </group>)}
    <Ridge points={[[-width * 0.23, height + 0.1, 0], [-width * 0.15, height + 0.04, 0], [width * 0.15, height + 0.04, 0], [width * 0.23, height + 0.1, 0]]} color="#bca478" radius={0.055} />
  </group>;
}

export function ArchTrim({ x, y, z, width = 0.22, height = 0.39 }: { x: number; y: number; z: number; width?: number; height?: number }) {
  return <group position={[x, y, z]}>
    <Ridge points={[[-width / 2 - 0.025, -height / 2, 0], [-width / 2 - 0.025, height / 2, 0], [0, height / 2 + width / 2 + 0.025, 0], [width / 2 + 0.025, height / 2, 0], [width / 2 + 0.025, -height / 2, 0]]} color="#e2d2ae" radius={0.027} />
    <mesh position={[0, -height / 2, 0]} castShadow><boxGeometry args={[width + 0.12, 0.055, 0.09]} /><meshStandardMaterial color="#ad9d80" roughness={0.95} /></mesh>
  </group>;
}
