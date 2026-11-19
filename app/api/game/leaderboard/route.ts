import { gameIds } from "@/lib/games/types";
import { connection } from "next/server";
import { dbGameError, gameDb, gameError, gameJson, GameError } from "@/lib/games/server";
export async function GET(request: Request) {
  await connection();
  try {
    const params = new URL(request.url).searchParams, game = params.get("game") || "total", page = Number(params.get("page") || 0);
    if ((game !== "total" && !gameIds.some(id => id === game)) || !Number.isInteger(page) || page < 0 || page > 200) throw new GameError(400, "Bảng xếp hạng không hợp lệ.");
    const { data, error } = await gameDb().rpc("game_leaderboard", { p_game: game === "total" ? null : game, p_offset: page * 50 });
    if (error) dbGameError(error);
    return gameJson({ entries: data, total: Number(data?.[0]?.total_rows || 0) });
  } catch (error) { return gameError(error); }
}
