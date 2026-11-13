import { POST as quote } from "../route";

export async function POST(request: Request) {
  const result = await quote(request);
  if (!result.ok) return result;
  const payment = await result.json();
  if (!payment.qr) return Response.json({ error: "Chưa có QR để lưu." }, { status: 400 });
  try {
    const response = await fetch(payment.qr, { signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png")) throw new Error("QR unavailable");
    return new Response(await response.arrayBuffer(), { headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="GCD-QR.png"', "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Chưa tải được ảnh QR." }, { status: 503 }); }
}
