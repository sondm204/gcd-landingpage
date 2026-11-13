"use client";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type PaymentProps = {
  position: number;
  brand: string;
  requestKey: string;
  code: string;
  onApply: (code: string) => void;
};

export default function BoothPayment({ onPrepare, onComplete, disabled, submitError, ...props }: PaymentProps & { onPrepare: () => boolean; onComplete: () => void; disabled: boolean; submitError: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <div className="booth-qr-launcher">
    <button type="button" className="booth-button" disabled={disabled} onClick={() => { if (onPrepare()) setOpen(true); }}>Nhận QR code</button>
    <p>Điền đầy đủ thông tin bắt buộc trong form đăng ký trước khi tạo QR. Có thể áp mã giảm giá trong dialog.</p>
    {open && createPortal(<dialog ref={dialog} className="booth-voucher-dialog booth-qr-dialog" aria-labelledby="booth-qr-title" onCancel={event => { if (disabled) event.preventDefault(); else setOpen(false); }} onClose={() => setOpen(false)}>
      <button type="button" className="booth-button secondary compact booth-voucher-close" aria-label="Đóng QR thanh toán" onClick={() => setOpen(false)}>Đóng ✕</button>
      {open && <PaymentContent {...props} />}
      <label className="booth-field">Ảnh chuyển khoản<input form="booth-registration" name="payment_receipt" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} /><small>Một ảnh JPEG, PNG hoặc WebP, tối đa 1 MB.</small></label>
      {submitError && <p role="alert" className="booth-payment-error">{submitError}</p>}
      <button type="button" className="booth-button" disabled={disabled} onClick={onComplete}>{disabled ? "Đang gửi…" : "Hoàn thành"}</button>
    </dialog>, document.body)}
  </div>;
}

function PaymentContent({
  position,
  brand,
  requestKey,
  code,
  onApply,
}: PaymentProps) {
  const [draft, setDraft] = useState(code);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [preview, setPreview] = useState<{ qr: string; src: string; file: File; shareable: boolean } | null>(null);
  const savedQr = useRef<{ src: string; blob: Blob } | null>(null);
  const applyRequest = useRef<AbortController | null>(null);
  useEffect(() => () => applyRequest.current?.abort(), []);
  async function apply() {
    applyRequest.current?.abort();
    const controller = new AbortController();
    applyRequest.current = controller;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booths/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, brand, code: draft, requestKey }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuote(data);
      onApply(draft.trim().toUpperCase());
    } catch (err) {
      if (!controller.signal.aborted) {
        setQuote(null);
        onApply("");
        setError(`${err instanceof Error ? err.message : "Chưa áp dụng được mã."}`);
        try {
          const response = await fetch("/api/booths/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position, brand, code: "", requestKey }), signal: controller.signal });
          if (response.ok) setQuote(await response.json());
        } catch { /* Hide QR until a valid base quote is available. */ }
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const [quote, setQuote] = useState<{
    amount: number;
    discount: number;
    memo: string;
    qr: string | null;
    bank: string;
    account: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (brand.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/booths/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position, brand, code, requestKey }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setQuote(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setQuote(null);
          setError(err instanceof Error ? err.message : "Chưa tải được QR.");
        }
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, brand, requestKey, code]);
  return (
    <section
      className="booth-form-card"
      style={{ marginTop: 20 }}
      aria-label="Thanh toán gian thương mại"
    >
      <h2 id="booth-qr-title">QR thanh toán gian thương mại</h2>
      <p>Giá niêm yết: 5.000.000đ / gian</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void apply();
        }}
      >
        <label className="booth-field">
          Mã giảm giá (không bắt buộc)
          <input
            maxLength={50}
            value={draft}
            disabled={busy || downloading}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhập mã ưu đãi"
          />
        </label>
        <button
          type="submit"
          className="booth-button secondary"
          disabled={busy || downloading || brand.trim().length < 2}
        >
          {busy ? "Đang xác nhận…" : "Xác nhận"}
        </button>
        <p>{code}</p>
      </form>
      {error && <p role="alert" className="booth-payment-error">{error}</p>}
      {brand.trim().length < 2 && <p>Nhập tên “Thương hiệu / đơn vị” trong form đăng ký để tạo QR đúng nội dung chuyển khoản.</p>}
      <p>Tên đơn vị trong nội dung chuyển khoản được chuyển thành không dấu; nội dung tối đa 50 ký tự.</p>
      {!busy && quote && (
        <>
          <p>
            Giảm: {quote.discount.toLocaleString("vi-VN")}đ ·{" "}
            <strong>Cần chuyển: {quote.amount.toLocaleString("vi-VN")}đ</strong>
          </p>
          <p>
            Nội dung chuyển khoản: <strong>{quote.memo}</strong>
          </p>
          {quote.qr ? (
            <>
              <Image
                key={quote.qr}
                src={quote.qr}
                width={300}
                height={360}
                unoptimized
                alt="QR chuyển khoản phí gian hàng"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <button type="button" className="booth-button secondary" disabled={busy || downloading} onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDownloading(true);
                setDownloadError("");
                try {
                  let blob: Blob;
                  if (savedQr.current?.src === quote.qr) {
                    blob = savedQr.current.blob;
                  } else {
                    try {
                      const direct = await fetch(quote.qr!);
                      if (!direct.ok || !direct.headers.get("content-type")?.startsWith("image/")) throw new Error("Direct download failed");
                      blob = await direct.blob();
                    } catch {
                      const response = await fetch("/api/booths/payment/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr: quote.qr }) });
                      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Chưa lưu được ảnh QR. Vui lòng thử lại."); }
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
                      } finally {
                        URL.revokeObjectURL(source);
                      }
                    }
                    savedQr.current = { src: quote.qr!, blob };
                  }
                  const filename = `GCD-TM${String(position === 34 ? 21 : position).padStart(2,"0")}-QR.png`;
                  const file = new File([blob], filename, { type: "image/png" });
                  const src = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = () => reject(new Error("Không mở được ảnh QR."));
                    reader.readAsDataURL(blob);
                  });
                  let shareable = false;
                  try { shareable = Boolean(navigator.canShare?.({ files: [file] })); } catch { /* Some WebViews block file sharing. */ }
                  setPreview({ qr: quote.qr!, src, file, shareable });
                  // Embedded mobile browsers may silently ignore blob downloads.
                  // Keep the prepared PNG on this page, with a fresh gesture for sharing.
                  if (/Android|iPhone|iPad|iPod|Zalo|FBAN|FBAV|Instagram/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return;
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a"); link.href=url; link.download=`GCD-TM${String(position === 34 ? 21 : position).padStart(2,"0")}-QR.png`; document.body.appendChild(link); link.click(); link.remove();
                  setTimeout(() => URL.revokeObjectURL(url),1000);
                } catch (err) { setDownloadError(err instanceof Error ? err.message : "Chưa tải được ảnh QR."); }
                finally { setDownloading(false); }
              }}>{downloading ? "Đang lưu ảnh…" : "Lưu ảnh QR về thiết bị"}</button>
              {preview?.qr === quote.qr && <div className="booth-qr-save-preview" aria-label="Ảnh PNG để lưu" role="region">
                <strong>Ảnh QR đã sẵn sàng (PNG)</strong>
                <p>Nhấn giữ ảnh bên dưới và chọn lưu ảnh nếu có. Nếu ứng dụng không hỗ trợ, bạn có thể chụp màn hình ảnh QR hoặc mở trang bằng Safari / Chrome qua menu của ứng dụng.</p>
                <Image src={preview.src} width={300} height={360} unoptimized alt="Ảnh QR PNG để lưu hoặc chụp màn hình" style={{ display: "block", maxWidth: "100%", height: "auto", margin: "12px auto", background: "#fff", userSelect: "auto", WebkitTouchCallout: "default" }} />
                {preview.shareable && <button type="button" className="booth-button secondary" disabled={downloading} onClick={async () => {
                  setDownloadError("");
                  setDownloading(true);
                  try { await navigator.share({ files: [preview.file] }); }
                  catch (err) {
                    if (!(err instanceof Error && err.name === "AbortError")) setDownloadError("Ứng dụng chưa hỗ trợ chia sẻ ảnh. Hãy nhấn giữ ảnh hoặc chụp màn hình QR bên trên.");
                  } finally { setDownloading(false); }
                }}>Lưu / chia sẻ ảnh PNG</button>}
              </div>}
              {downloadError && <p role="alert" className="booth-payment-error">{downloadError}</p>}
            </>
          ) : (
            <p>
              {quote.amount === 0
                ? "Số tiền sau giảm là 0đ, không cần chuyển khoản."
                : "Thông tin nhận chuyển khoản đang được ban tổ chức cập nhật. Chưa có QR thanh toán."}
            </p>
          )}
        </>
      )}
      <p>
        Chuyển khoản và ảnh biên nhận chưa phải xác nhận giữ chỗ hoặc xác nhận
        đã thanh toán; BTC sẽ đối soát.
      </p>
    </section>
  );
}
