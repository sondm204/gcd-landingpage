"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { isEmbeddedBrowser } from "@/lib/booths/browser";

type PreparedImage = { src: string; file: File };

async function preparePng(qr: string, filename: string): Promise<PreparedImage> {
  let blob: Blob;
  try {
    const response = await fetch(qr);
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Direct download failed");
    blob = await response.blob();
  } catch {
    const response = await fetch("/api/booths/payment/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr }) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Chưa tải được ảnh QR. Vui lòng thử lại."); }
    blob = await response.blob();
  }
  if (blob.type !== "image/png") {
    const source = URL.createObjectURL(blob);
    try {
      const image = new window.Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || 1024;
      canvas.height = image.naturalHeight || 1024;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Không chuyển được ảnh QR sang PNG.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Không chuyển được ảnh QR sang PNG.")), "image/png"));
    } finally { URL.revokeObjectURL(source); }
  }
  const file = new File([blob], filename, { type: "image/png" });
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không mở được ảnh QR."));
    reader.readAsDataURL(blob);
  });
  return { src, file };
}

// Key this component by QR URL so a changed voucher cannot reuse an old image.
export default function BoothQrImage({ qr, position }: { qr: string; position: number }) {
  const [embedded] = useState(() => typeof navigator !== "undefined" && isEmbeddedBrowser(navigator.userAgent));
  const [showSaveHint, setShowSaveHint] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<Promise<PreparedImage> | null>(null);
  const mounted = useRef(true);
  const filename = `GCD-TM${String(position === 34 ? 21 : position).padStart(2, "0")}-QR.png`;
  const prepare = useCallback(() => {
    if (!pending.current) {
      pending.current = preparePng(qr, filename).catch(err => { pending.current = null; throw err; });
    }
    return pending.current;
  }, [qr, filename]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void prepare().then(result => { if (active) setPrepared(result); }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : "Chưa mở được ảnh PNG. Bạn vẫn có thể chụp màn hình QR.");
    });
    return () => { active = false; };
  }, [prepare]);

  async function save() {
    setError("");
    setBusy(true);
    try {
      const result = await prepare();
      if (!mounted.current) return;
      setPrepared(result);
      const url = URL.createObjectURL(result.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "Chưa lưu được ảnh QR."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="booth-qr-save-preview" role="region" aria-label="Ảnh PNG để lưu">
      <Image ref={image} src={prepared ? prepared.src : qr} width={300} height={360} unoptimized alt="QR chuyển khoản phí gian hàng" style={{ display: "block", maxWidth: "100%", height: "auto", background: "#fff", userSelect: "auto", WebkitTouchCallout: "default" }} />
    </div>
    <button type="button" className="booth-button secondary" disabled={busy || !prepared} onClick={() => {
      if (embedded) {
        setShowSaveHint(true);
        image.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      } else void save();
    }}>{busy ? "Đang lưu ảnh…" : embedded ? "Nhấn giữ ảnh QR để lưu" : "Lưu ảnh QR về thiết bị"}</button>
    {(embedded || showSaveHint) && <p role="status">Nhấn và giữ trực tiếp lên ảnh QR bên trên, sau đó chọn “Lưu ảnh”. Nếu ứng dụng không hỗ trợ, hãy chụp màn hình QR hoặc mở trang bằng Safari / Chrome.</p>}
    {error && <p role="alert" className="booth-payment-error">{error}</p>}
  </>;
}
