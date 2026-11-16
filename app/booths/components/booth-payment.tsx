"use client";
import { useLocale } from "next-intl";
import { useCopy } from "@/i18n/copy";

import BoothQrImage from "./booth-qr-image";
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
  const t = useCopy();

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
    <button type="button" className="booth-button" disabled={disabled} onClick={() => { if (onPrepare()) setOpen(true); }}>{t("Nhận QR code")}</button>
    <p>{t("Điền đầy đủ thông tin bắt buộc trong form đăng ký trước khi tạo QR. Có thể áp mã giảm giá trong dialog.")}</p>
    {open && createPortal(<dialog ref={dialog} className="booth-voucher-dialog booth-qr-dialog" aria-labelledby="booth-qr-title" onCancel={event => { if (disabled) event.preventDefault(); else setOpen(false); }} onClose={() => setOpen(false)}>
      <button type="button" className="booth-button secondary compact booth-voucher-close" aria-label={t("Đóng QR thanh toán")} onClick={() => setOpen(false)}>{t("Đóng ✕")}</button>
      {open && <PaymentContent {...props} />}
      <label className="booth-field">{t("Ảnh chuyển khoản")}<input form="booth-registration" name="payment_receipt" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} /><small>{t("Một ảnh JPEG, PNG hoặc WebP, tối đa 1 MB.")}</small></label>
      {submitError && <p role="alert" className="booth-payment-error">{t(submitError)}</p>}
      <button type="button" className="booth-button" disabled={disabled} onClick={onComplete}>{disabled ? t("Đang gửi…") : t("Hoàn thành")}</button>
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
  const t = useCopy();
  const locale = useLocale();
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
        body: JSON.stringify({ position, brand, code: draft, requestKey }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_code || data.error);
      setQuote(data);
      onApply(draft.trim().toUpperCase());
    } catch (err) {
      if (!controller.signal.aborted) {
        setQuote(null);
        onApply("");
        setError(`${err instanceof Error ? err.message : t("Chưa áp dụng được mã.")}`);
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
        if (!response.ok) throw new Error(data.error_code || data.error);
        setQuote(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setQuote(null);
          setError(err instanceof Error ? err.message : t("Chưa tải được QR."));
        }
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, brand, requestKey, code, t]);
  return (
    <section
      className="booth-form-card"
      style={{ marginTop: 20 }}
      aria-label={t("Thanh toán gian thương mại")}
    >
      <h2 id="booth-qr-title">{t("QR thanh toán gian thương mại")}</h2>
      <p>{t("Giá niêm yết: 5.000.000đ / gian")}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void apply();
        }}
      >
        <label className="booth-field">{t("Mã giảm giá (không bắt buộc)")}<input
            maxLength={50}
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("Nhập mã ưu đãi")}
          />
        </label>
        <button
          type="submit"
          className="booth-button secondary"
          disabled={busy || brand.trim().length < 2}
        >
          {busy ? t("Đang xác nhận…") : t("Xác nhận")}
        </button>
        <p>{code}</p>
      </form>
      {error && <p role="alert" className="booth-payment-error">{t(error)}</p>}
      {brand.trim().length < 2 && <p>{t("Nhập tên “Thương hiệu / đơn vị” trong form đăng ký để tạo QR đúng nội dung chuyển khoản.")}</p>}
      <p>{t("Tên đơn vị trong nội dung chuyển khoản được chuyển thành không dấu; nội dung tối đa 50 ký tự.")}</p>
      {!busy && quote && (
        <>
          <p>{t("Giảm:")} {quote.discount.toLocaleString(locale)}{t("đ ·")}{" "}
            <strong>{t("Cần chuyển:")} {quote.amount.toLocaleString(locale)}{t("đ")}</strong>
          </p>
          <p>{t("Nội dung chuyển khoản:")} <strong>{quote.memo}</strong>
          </p>
          {quote.qr ? (
            <BoothQrImage key={quote.qr} qr={quote.qr} position={position} />
          ) : (
            <p>
              {quote.amount === 0
                ? t("Số tiền sau giảm là 0đ, không cần chuyển khoản.")
                : t("Thông tin nhận chuyển khoản đang được ban tổ chức cập nhật. Chưa có QR thanh toán.")}
            </p>
          )}
        </>
      )}
      <p>{t("Chuyển khoản và ảnh biên nhận chưa phải xác nhận giữ chỗ hoặc xác nhận đã thanh toán; BTC sẽ đối soát.")}</p>
    </section>
  );
}
