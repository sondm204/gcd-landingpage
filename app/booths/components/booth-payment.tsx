"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function BoothPayment({
  position,
  requestKey,
  code,
  onApply,
}: {
  position: number;
  requestKey: string;
  code: string;
  onApply: (code: string) => void;
}) {
  const [draft, setDraft] = useState(code);
  const [busy, setBusy] = useState(false);
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
        body: JSON.stringify({ position, code: draft, requestKey }),
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
          const response = await fetch("/api/booths/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position, code: "", requestKey }), signal: controller.signal });
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
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/booths/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position, code, requestKey }),
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
  }, [position, requestKey, code]);
  return (
    <section
      className="booth-form-card"
      style={{ marginTop: 20 }}
      aria-label="Thanh toán gian thương mại"
    >
      <h2>Chi phí gian thương mại</h2>
      <p>Giá niêm yết: 5.000.000đ / gian</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void apply();
        }}
      >
        <label className="booth-field">
          Mã giảm giá (không bắt buộc)
          <input
            maxLength={50}
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhập mã ưu đãi"
          />
        </label>
        <button
          type="submit"
          className="booth-button secondary"
          disabled={busy}
        >
          {busy ? "Đang xác nhận…" : "Xác nhận"}
        </button>
        <p>{code}</p>
      </form>
      {error && <p role="alert" className="booth-payment-error">{error}</p>}
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
              <button type="button" className="booth-button secondary" disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  const response = await fetch("/api/booths/payment/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position, code, requestKey }) });
                  if (!response.ok) throw new Error("Chưa lưu được QR. Vui lòng xác nhận lại mã giảm giá.");
                  const url = URL.createObjectURL(await response.blob());
                  const link = document.createElement("a"); link.href=url; link.download=`GCD-TM${String(position).padStart(2,"0")}-QR.png`; link.click();
                  setTimeout(() => URL.revokeObjectURL(url),1000);
                } catch (err) { setError(err instanceof Error ? err.message : "Chưa tải được ảnh QR."); }
                finally { setBusy(false); }
              }}>Lưu ảnh QR về thiết bị</button>
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
