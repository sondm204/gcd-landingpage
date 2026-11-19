import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHash, createHmac } from "node:crypto";

export const SESSION_COOKIE = "gcd_game_session";
export class GameError extends Error { constructor(public status: number, message: string) { super(message); } }
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function gameDb() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new GameError(503, "Hệ thống game đang được chuẩn bị. Vui lòng quay lại sau.");
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function gameOrigin(request: Request) {
  const allowed = new URL(process.env.APP_ORIGIN || request.url).origin;
  if (request.headers.get("origin") !== allowed) throw new GameError(403, "Yêu cầu không hợp lệ. Vui lòng tải lại trang.");
}
export async function gameRate(request: Request, scope: string, limit: number, seconds = 60, identity?: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const secret = process.env.GAME_RATE_LIMIT_SECRET || process.env.BOOTH_RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const key = createHmac("sha256", secret).update(`game:${scope}:${identity || ip}`).digest("hex");
  const { data, error } = await gameDb().rpc("booth_consume_rate_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) throw new GameError(503, "Chưa thể xử lý yêu cầu lúc này. Vui lòng thử lại.");
  if (!data) throw new GameError(429, "Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.");
}
export async function currentPlayer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = gameDb();
  const { data: session, error } = await db.from("game_sessions").select("player_id").eq("token_hash", tokenHash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new GameError(503, "Chưa thể kiểm tra tài khoản game. Vui lòng thử lại.");
  if (!session) return null;
  const { data, error: playerError } = await db.from("game_players").select("id,display_name").eq("id", session.player_id).single();
  if (playerError) throw new GameError(503, "Chưa thể tải tài khoản game.");
  return data as { id: string; display_name: string };
}
export async function requirePlayer() {
  const player = await currentPlayer();
  if (!player) throw new GameError(401, "Nhập số điện thoại để mở hộ chiếu của bạn.");
  return player;
}
export function gameJson(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store, private" } }); }
export function gameError(error: unknown) {
  if (error instanceof GameError) return gameJson({ error: error.message }, error.status);
  console.error("Game operation failed", error instanceof Error ? error.name : "Unknown error");
  return gameJson({ error: "Chưa thể hoàn tất thao tác. Vui lòng thử lại." }, 500);
}
export async function gameBody(request: Request, max = 8192): Promise<unknown> {
  const reader = request.body?.getReader(); if (!reader) throw new GameError(400, "Thiếu nội dung yêu cầu.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new GameError(413, "Nội dung lượt chơi quá lớn."); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new GameError(400, "Nội dung không hợp lệ."); }
}
export function dbGameError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new GameError(409, "Tên hiển thị đã có người sử dụng. Hãy chọn tên khác.");
  if (error.message.includes("ATTEMPT_LIMIT")) throw new GameError(409, "Bạn đã dùng hết 3 lượt của game này.");
  if (/ATTEMPT_CLOSED|ATTEMPT_EXPIRED|RESULT_CONFLICT|REQUEST_REUSED/.test(error.message)) throw new GameError(409, "Lượt chơi đã đóng hoặc đã ghi nhận kết quả. Vui lòng kiểm tra lại tài khoản.");
  if (error.message.includes("ATTEMPT_NOT_FOUND")) throw new GameError(404, "Không tìm thấy lượt chơi của bạn.");
  console.error("Game database operation failed", { code: error.code });
  throw new GameError(503, "Hệ thống game chưa sẵn sàng. Vui lòng thử lại sau.");
}
