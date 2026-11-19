import { z } from "zod";
import { gameBody, gameDb, gameError, gameJson, gameOrigin, gameRate, GameError, requirePlayer } from "@/lib/games/server";
import { passportDbError } from "@/lib/games/passport-server";
export async function POST(request: Request) {
  try {
    gameOrigin(request); const player = await requirePlayer(); await gameRate(request, "stamp", 40, 60, player.id);
    const input = z.object({ code: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(await gameBody(request));
    if (!input.success) throw new GameError(400, "Mã QR không hợp lệ. Hãy quét lại mã tại gian.");
    const { data, error } = await gameDb().rpc("event_passport_claim", { p_player: player.id, p_token: input.data.code });
    if (error) passportDbError(error); return gameJson(data);
  } catch (error) { return gameError(error); }
}
