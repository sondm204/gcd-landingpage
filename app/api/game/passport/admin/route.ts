import { connection } from "next/server";
import { z } from "zod";
import { gameBody, gameDb, gameError, gameJson, gameOrigin, GameError } from "@/lib/games/server";
import { passportAdmin, passportDbError } from "@/lib/games/passport-server";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settings"), collecting_open: z.boolean(), redeeming_open: z.boolean(), minimum_stamps: z.number().int().min(1).max(1000).nullable(), reward_label: z.string().trim().min(1).max(120) }).strict(),
  z.object({ action: z.literal("station"), id: z.number().int().positive().max(32767), enabled: z.boolean(), title: z.string().trim().max(120), rotate: z.boolean() }).strict(),
  z.object({ action: z.literal("sync") }).strict(),
  z.object({ action: z.enum(["lookup","redeem"]), card: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
]);
export async function GET(request: Request) {
  await connection();
  try { const admin = await passportAdmin(); const { data, error } = await gameDb().rpc("event_passport_admin_state", { p_admin: admin.id }); if (error) passportDbError(error); return gameJson({ ...data, qr_origin: new URL(process.env.SITE_URL || request.url).origin }); } catch (error) { return gameError(error); }
}
export async function POST(request: Request) {
  try {
    gameOrigin(request); const admin = await passportAdmin(); const input = schema.safeParse(await gameBody(request));
    if (!input.success) throw new GameError(400, "Kiểm tra lại thông tin quản trị passport.");
    const value = input.data, db = gameDb();
    if (value.action === "settings" && value.redeeming_open && value.minimum_stamps === null) throw new GameError(400, "Cần đặt số dấu tối thiểu trước khi mở đổi quà.");
    const response = value.action === "settings" ? await db.rpc("event_passport_configure", { p_admin: admin.id, p_collecting: value.collecting_open, p_redeeming: value.redeeming_open, p_minimum: value.minimum_stamps, p_reward: value.reward_label })
      : value.action === "station" ? await db.rpc("event_passport_station_update", { p_admin: admin.id, p_id: value.id, p_enabled: value.enabled, p_title: value.title, p_rotate: value.rotate })
      : value.action === "sync" ? await db.rpc("event_passport_sync", { p_admin: admin.id })
      : await db.rpc(value.action === "lookup" ? "event_passport_lookup" : "event_passport_redeem", { p_admin: admin.id, p_card: value.card });
    if (response.error) passportDbError(response.error);
    return gameJson(response.data ?? { ok: true });
  } catch (error) { return gameError(error); }
}
