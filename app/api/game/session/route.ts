import { cookies } from "next/headers";
import { connection } from "next/server";
import { randomBytes } from "node:crypto";
import { phoneLoginSchema } from "@/lib/games/validation";
import { gameIds, type Usage } from "@/lib/games/types";
import { currentPlayer, dbGameError, gameBody, gameDb, gameError, gameJson, gameOrigin, gameRate, SESSION_COOKIE, tokenHash, GameError } from "@/lib/games/server";

export async function GET() {
  await connection();
  try {
    const player = await currentPlayer();
    if (!player) return gameJson({ player: null, usage: [] });
    const { data, error } = await gameDb().from("game_attempts").select("game,status,score").eq("player_id", player.id);
    if (error) dbGameError(error);
    const usage: Usage[] = gameIds.map(game => {
      const attempts = data!.filter(a => a.game === game), scores = attempts.filter(a => a.status === "completed").map(a => a.score as number);
      return { game, used: attempts.length, best: scores.length ? Math.max(...scores) : null };
    });
    return gameJson({ player, usage });
  } catch (error) { return gameError(error); }
}
export async function POST(request: Request) {
  try {
    gameOrigin(request); await gameRate(request, "account-ip", 120);
    const parsed = phoneLoginSchema.safeParse(await gameBody(request));
    if (!parsed.success) throw new GameError(400, parsed.error.issues[0].message);
    await gameRate(request, "account-phone", 10, 60, parsed.data.phone);
    const token = randomBytes(32).toString("hex");
    const { data, error } = await gameDb().rpc("game_open_session", { p_phone: parsed.data.phone, p_name: parsed.data.display_name ?? null, p_name_key: parsed.data.display_name?.toLowerCase() ?? null, p_token_hash: tokenHash(token) });
    if (error?.message.includes("NAME_REQUIRED")) return gameJson({ needs_name: true });
    if (error) dbGameError(error);
    (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
    return gameJson({ player: data });
  } catch (error) { return gameError(error); }
}
export async function DELETE(request: Request) {
  try {
    gameOrigin(request);
    const jar = await cookies(), token = jar.get(SESSION_COOKIE)?.value;
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      const { error } = await gameDb().from("game_sessions").delete().eq("token_hash", tokenHash(token));
      if (error) dbGameError(error);
    }
    jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return gameJson({ player: null });
  } catch (error) { return gameError(error); }
}
