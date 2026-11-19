import { connection } from "next/server";
import { gameDb, gameError, gameJson, requirePlayer } from "@/lib/games/server";
import { passportDbError } from "@/lib/games/passport-server";
export async function GET() {
  await connection();
  try { const player = await requirePlayer(); const { data, error } = await gameDb().rpc("event_passport_state", { p_player: player.id }); if (error) passportDbError(error); return gameJson(data); } catch (error) { return gameError(error); }
}
