import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

export class BoothError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.BOOTH_RATE_LIMIT_SECRET);
}
export function serviceClient() {
  if (!configured()) throw new BoothError(503, "Khu vực đăng ký đang được chuẩn bị. Vui lòng quay lại sau.");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function authClient() {
  if (!configured()) throw new BoothError(503, "Khu vực quản trị chưa được cấu hình.");
  const jar = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => { items.forEach(({ name, value, options }) => jar.set(name, value, options)); },
    },
  });
}
export async function requireAdmin() {
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new BoothError(401, "Vui lòng đăng nhập để tiếp tục.");
  const { data, error: roleError } = await serviceClient().from("booth_admins").select("user_id").eq("user_id", user.id).eq("active", true).maybeSingle();
  if (roleError) throw new BoothError(503, "Không thể kiểm tra quyền quản trị lúc này.");
  if (!data) throw new BoothError(403, "Tài khoản chưa được cấp quyền quản trị gian hàng.");
  return { user, client };
}
export function checkOrigin(request: Request) {
  const allowed = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("origin") !== new URL(allowed).origin) throw new BoothError(403, "Yêu cầu không hợp lệ. Vui lòng tải lại trang.");
}
export async function rateLimit(request: Request, scope: string, limit: number, seconds: number, identity?: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const key = createHmac("sha256", process.env.BOOTH_RATE_LIMIT_SECRET!).update(`${scope}:${identity || ip}`).digest("hex");
  const { data, error } = await serviceClient().rpc("booth_consume_rate_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) throw new BoothError(503, "Chưa thể gửi yêu cầu. Vui lòng thử lại sau.");
  if (!data) throw new BoothError(429, "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau.");
}
export function responseError(error: unknown) {
  if (error instanceof BoothError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  console.error("Booth operation failed", error instanceof Error ? error.message : "Unexpected database/storage error");
  return Response.json({ error: "Không thể hoàn tất yêu cầu. Vui lòng thử lại sau." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store, private" } }); }

export async function readJson(request: Request, max = 8192): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new BoothError(400, "Thiếu nội dung yêu cầu.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw new BoothError(413, "Nội dung yêu cầu quá lớn."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new BoothError(400, "Nội dung yêu cầu không hợp lệ."); }
}
