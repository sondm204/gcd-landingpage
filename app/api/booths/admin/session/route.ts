import { connection } from "next/server";
import { BoothError, configured, json, requireAdmin, responseError } from "@/lib/booths/server";

export async function GET() {
  await connection();
  if (!configured()) return json({ admin: null });
  try {
    const { user } = await requireAdmin();
    return json({ admin: { email: user.email } });
  } catch (error) {
    if (error instanceof BoothError && [401,403].includes(error.status)) return json({ admin: null });
    return responseError(error);
  }
}
