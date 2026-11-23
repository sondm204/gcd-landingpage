"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useCopy } from "@/i18n/copy";

export default function AdminExportButton({ href, label, disabled = false }: { href: string; label: string; disabled?: boolean }) {
  const t = useCopy(), locale = useLocale();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function download() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const url = new URL(href, window.location.origin); url.searchParams.set("locale", locale);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error_code || data.error || t("Chưa thể xuất Excel. Vui lòng thử lại.")); }
      const blob = await response.blob(), objectUrl = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = objectUrl; link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "GCD2026.xlsx";
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : t("Chưa thể xuất Excel. Vui lòng thử lại.")); }
    finally { setBusy(false); }
  }
  return <div className="admin-export"><button type="button" className="booth-button secondary compact" disabled={busy || disabled} onClick={() => void download()} aria-busy={busy}>{busy ? t("Đang tạo Excel…") : label}<span aria-hidden="true">↓</span></button>{error && <p className="admin-export-error" role="alert">{t(error)}</p>}</div>;
}
