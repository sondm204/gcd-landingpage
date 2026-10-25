import { authClient, serviceClient, checkOrigin, rateLimit, BoothError, json, responseError, readJson } from "@/lib/booths/server";
import { loginSchema } from "@/lib/booths/validation";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    serviceClient();
    await rateLimit(request, "admin-login", 10, 900);
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new BoothError(400, "Nhập email và mật khẩu hợp lệ.");
    const client = await authClient();
    const { data, error } = await client.auth.signInWithPassword(parsed.data);
    if (error || !data.user) throw new BoothError(401, "Email hoặc mật khẩu chưa đúng.");
    const { data: admin, error: adminError } = await serviceClient().from("booth_admins").select("user_id").eq("user_id", data.user.id).eq("active", true).maybeSingle();
    if (!admin || adminError) {
      await client.auth.signOut();
      throw new BoothError(adminError ? 503 : 403, adminError ? "Không thể kiểm tra quyền quản trị lúc này." : "Tài khoản chưa được cấp quyền quản trị.");
    }
    return json({ ok: true });
  } catch (error) { return responseError(error); }
}
