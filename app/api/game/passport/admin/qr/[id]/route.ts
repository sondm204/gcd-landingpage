import { connection } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { gameDb, gameError, GameError } from "@/lib/games/server";
import { passportAdmin, passportDbError, passportUrl } from "@/lib/games/passport-server";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    await passportAdmin(); const id = z.coerce.number().int().positive().max(32767).safeParse((await context.params).id);
    if (!id.success) throw new GameError(400, "Mã gian không hợp lệ.");
    const { data, error } = await gameDb().from("event_passport_stations").select("qr_token").eq("booth_id", id.data).maybeSingle();
    if (error) passportDbError(error); if (!data) throw new GameError(404, "Gian này chưa có mã QR.");
    const svg = await QRCode.toString(passportUrl(request, data.qr_token, "station"), { type: "svg", errorCorrectionLevel: "M", margin: 4 });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store, private", ...(new URL(request.url).searchParams.has("download") ? { "Content-Disposition": `attachment; filename="passport-booth-${id.data}.svg"` } : {}) } });
  } catch (error) { return gameError(error); }
}
