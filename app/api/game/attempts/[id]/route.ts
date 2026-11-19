import { createHash } from "node:crypto";
import { z } from "zod";
import type { Attempt } from "@/lib/games/types";
import { replayResult } from "@/lib/games/replay";
import { dbGameError, gameBody, gameDb, gameError, gameJson, gameOrigin, gameRate, GameError, requirePlayer } from "@/lib/games/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    gameOrigin(request); const player = await requirePlayer(); await gameRate(request, "finish", 50, 60, player.id);
    const id = z.uuid().safeParse((await context.params).id);
    if (!id.success) throw new GameError(400, "Mã lượt chơi không hợp lệ.");
    const db = gameDb();
    const { data: attempt, error } = await db.from("game_attempts").select("id,game,mode,seed,attempt_number,started_at,status,score,result_digest").eq("id", id.data).eq("player_id", player.id).maybeSingle();
    if (error) dbGameError(error);
    if (!attempt) throw new GameError(404, "Không tìm thấy lượt chơi của bạn.");
    const input = await gameBody(request, 1500000);
    const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    if (attempt.status === "completed") {
      if (attempt.result_digest !== digest) throw new GameError(409, "Lượt này đã có kết quả. Không thể thay đổi điểm.");
      return gameJson({ score: attempt.score, attempt_id: attempt.id });
    }
    if (attempt.status !== "started") throw new GameError(409, "Lượt chơi đã đóng khi bạn mở lượt khác.");
    if (Date.now() - Date.parse(attempt.started_at) > 6 * 3600000) throw new GameError(409, "Lượt chơi đã hết hạn lưu kết quả.");
    const verified = replayResult(attempt as Attempt, input, Date.now() - Date.parse(attempt.started_at));
    const { data: saved, error: saveError } = await db.rpc("game_finish_attempt", { p_player: player.id, p_attempt: attempt.id, p_score: verified.score, p_digest: digest, p_result: verified.result });
    if (saveError) dbGameError(saveError);
    return gameJson({ score: saved.score, attempt_id: saved.id });
  } catch (error) { return gameError(error); }
}
