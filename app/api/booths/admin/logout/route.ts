import { authClient, checkOrigin, json, responseError, BoothError } from "@/lib/booths/server";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const client = await authClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new BoothError(503, "Chưa thể đăng xuất. Vui lòng thử lại.");
    return json({ ok: true });
  } catch (error) { return responseError(error); }
}
