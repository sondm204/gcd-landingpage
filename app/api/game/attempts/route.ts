import { randomInt } from "node:crypto";
import { z } from "zod";
import { gameIds } from "@/lib/games/types";
import { dbGameError, gameBody, gameDb, gameError, gameJson, gameOrigin, gameRate, GameError, requirePlayer } from "@/lib/games/server";
const schema = z.object({ game: z.enum(gameIds), mode: z.enum(["online", "event"]), request_key: z.uuid() }).strict();
export async function POST(request: Request) {
  try {
    gameOrigin(request); const player = await requirePlayer(); await gameRate(request, "start", 40, 60, player.id);
    const parsed = schema.safeParse(await gameBody(request));
    if (!parsed.success) throw new GameError(400, "Thông tin lượt chơi không hợp lệ.");
    const { game, mode, request_key } = parsed.data;
    const { data, error } = await gameDb().rpc("game_start_attempt", { p_player: player.id, p_game: game, p_mode: mode, p_request_key: request_key, p_seed: randomInt(0, 4294967296) });
    if (error) dbGameError(error);
    if (data.status !== "started") throw new GameError(409, "Lượt này đã kết thúc. Vui lòng mở lượt mới.");
    return gameJson({ attempt: { id: data.id, game: data.game, mode: data.mode, seed: data.seed, attempt_number: data.attempt_number, started_at: data.started_at, status: data.status } }, 201);
  } catch (error) { return gameError(error); }
}
