"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Voucher = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  usage_limit: number | null;
  used_count: number;
};
export default function BoothVouchers() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        className="booth-button secondary compact"
        onClick={() => setOpen(true)}
      >
        Quản lý voucher
      </button>
      <dialog
        ref={dialog}
        className="booth-voucher-dialog"
        aria-labelledby="voucher-title"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <button
          type="button"
          className="booth-button secondary compact booth-voucher-close"
          onClick={() => setOpen(false)}
          aria-label="Đóng quản lý voucher"
        >
          Đóng ✕
        </button>
        {open && <VoucherContent />}
      </dialog>
    </>
  );
}

function VoucherContent() {
  const [items, setItems] = useState<Voucher[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/booths/admin/vouchers", {
        cache: "no-store",
        signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems(data.vouchers);
      setError("");
    } catch (err) {
      if (!signal?.aborted)
        setError(err instanceof Error ? err.message : "Chưa tải được voucher.");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    // State updates follow the asynchronous HTTP response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function mutate(body: unknown, method: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/booths/admin/vouchers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice("Đã lưu voucher.");
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa lưu được.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="booth-form-card"
      style={{ marginBlock: 24 }}
      aria-labelledby="voucher-title"
    >
      <span className="booth-kicker">QUẢN TRỊ</span>
      <h2 id="voucher-title">Mã giảm giá gian thương mại</h2>
      <p>
        Mã áp dụng cho gian thương mại giá 5.000.000đ. Tắt mã để ngừng nhận đăng
        ký mới; thông tin thanh toán của hồ sơ đã gửi được giữ nguyên.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          if (
            await mutate(
              {
                code: data.get("code"),
                type: data.get("type"),
                value: Number(data.get("value")),
                usage_limit: data.get("usage_limit")
                  ? Number(data.get("usage_limit"))
                  : null,
              },
              "POST",
            )
          )
            form.reset();
        }}
      >
        <fieldset disabled={busy}>
          <div className="booth-field-pair">
            <label className="booth-field">
              Mã voucher
              <input
                name="code"
                required
                maxLength={50}
                pattern="[A-Za-z0-9_-]+"
                placeholder="GCD10"
              />
            </label>
            <label className="booth-field">
              Loại giảm
              <select name="type">
                <option value="percent">Giảm phần trăm (%)</option>
                <option value="amount">Giảm số tiền (đ)</option>
              </select>
            </label>
          </div>
          <label className="booth-field">
            Mức giảm
            <input
              name="value"
              type="number"
              min={1}
              step={1}
              max={2147483647}
              required
            />
            <small>
              Nhập 10 để giảm 10%, hoặc 500000 để giảm 500.000đ. Phần trăm tối
              đa 100%.
            </small>
          </label>
          <label className="booth-field">
            Số lượt sử dụng tối đa
            <input
              name="usage_limit"
              type="number"
              min={1}
              max={2147483647}
              step={1}
              placeholder="Để trống nếu không giới hạn"
            />
            <small>
              Mỗi hồ sơ gửi thành công tính một lượt;
              xem QR không trừ lượt.
            </small>
          </label>
          <button className="booth-button" type="submit">
            {busy ? "Đang lưu…" : "Thêm voucher"}
          </button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="booth-alert error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {items.map((item) => (
          <div
            key={item.id}
            className="booth-alert"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong>{item.code}</strong> · Giảm{" "}
              {item.value.toLocaleString("vi-VN")}
              {item.type === "percent" ? "%" : "đ"} ·{" "}
              {item.active ? "Đang bật" : "Đã tắt"}
              <br />
              Đã dùng: {item.used_count ?? 0} ·{" "}
              {item.usage_limit == null
                ? "Không giới hạn lượt"
                : `Còn ${Math.max(0, item.usage_limit - (item.used_count ?? 0))}/${item.usage_limit} lượt`}
            </span>
            <form
              key={`${item.id}:${item.usage_limit}`}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void mutate(
                  { id: item.id, usage_limit: Number(data.get("usage_limit")) },
                  "PATCH",
                );
              }}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "end",
                flexWrap: "wrap",
              }}
            >
              <label className="booth-field" style={{ marginBottom: 0 }}>
                Tổng lượt {item.code}
                <input
                  name="usage_limit"
                  type="number"
                  required
                  min={1}
                  step={1}
                  max={2147483647}
                  defaultValue={item.usage_limit ?? ""}
                  disabled={busy}
                  style={{ width: 110 }}
                />
              </label>
              <button
                type="submit"
                className="booth-button secondary compact booth-voucher-save"
                disabled={busy}
              >
                Lưu lượt
              </button>
            </form>
            <button
              className={`booth-button compact booth-voucher-toggle ${item.active ? "is-disable" : "is-enable"}`}
              type="button"
              disabled={busy}
              onClick={() =>
                void mutate({ id: item.id, active: !item.active }, "PATCH")
              }
            >
              {item.active ? "Tắt" : "Bật"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
