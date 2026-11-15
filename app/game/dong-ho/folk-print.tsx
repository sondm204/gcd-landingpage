import Image from "next/image";
import { MAX_LAYERS } from "./engine";

export default function FolkPrint({ layers }: { layers: number }) {
  return <div className="print-art print-photo" role="img" aria-label={`Tranh Đông Hồ, đã mở ${layers}/${MAX_LAYERS} phần`}>
    <Image src="/game/tranh_dong_ho.webp" alt="" fill sizes="(max-width: 600px) 90vw, 560px" />
    <div className="print-photo-overlays" aria-hidden="true">{Array.from({ length: MAX_LAYERS }, (_, i) => <span key={i} className={i < layers ? "revealed" : ""} />)}</div>
  </div>;
}
