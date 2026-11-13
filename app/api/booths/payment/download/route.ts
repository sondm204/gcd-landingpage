import { readJson } from "@/lib/booths/server";

export async function POST(request: Request) {
  try {
    const body = await readJson(request) as { qr?: string };
    const url = new URL(body.qr || "");
    const bank = process.env.BOOTH_BANK_ID, account = process.env.BOOTH_BANK_ACCOUNT;
    const path = `/image/${encodeURIComponent(bank || "")}-${encodeURIComponent(account || "")}-compact2.png`;
    if (!bank || !account || url.origin !== "https://img.vietqr.io" || url.pathname !== path || url.username || url.password) return Response.json({error:"Ảnh QR không hợp lệ."},{status:400});
    // Save the displayed QR, without requiring a voucher or applying it again.
    let target = url;
    let response: Response | undefined;
    const signal = AbortSignal.timeout(30000);
    for (let hop = 0; hop < 4; hop++) {
      response = await fetch(target, { signal, redirect: "manual" });
      if (![301,302,303,307,308].includes(response.status)) break;
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Missing redirect");
      const next = new URL(location, target);
      if (next.origin !== url.origin || next.username || next.password) throw new Error("Untrusted redirect");
      target = next;
    }
    if (!response) throw new Error("QR unavailable");
    const type = response.headers.get("content-type")?.split(";")[0];
    if (!response.ok || !type || !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(type)) throw new Error("QR unavailable");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("QR too large");
    const extension = type === "image/svg+xml" ? "svg" : type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    return new Response(bytes, { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="GCD-QR.${extension}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return Response.json({ error: "Không tải được ảnh từ VietQR. Vui lòng thử lại sau." }, { status: 503 }); }
}
