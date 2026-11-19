import { connection } from "next/server";
import QRCode from "qrcode";
import { gameDb, gameError, requirePlayer } from "@/lib/games/server";
import { passportDbError, passportUrl } from "@/lib/games/passport-server";
export async function GET(request: Request) {
  await connection();
  try {
    const player = await requirePlayer(); const { data, error } = await gameDb().from("game_players").select("passport_code").eq("id", player.id).single();
    if (error) passportDbError(error);
    const svg = await QRCode.toString(passportUrl(request, data!.passport_code, "card"), { type: "svg", errorCorrectionLevel: "M", margin: 4 });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store, private" } });
  } catch (error) { return gameError(error); }
}
