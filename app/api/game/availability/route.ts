import { connection } from "next/server";
import { serviceClient, json } from "@/lib/booths/server";
export async function GET() {
  await connection();
  try {
    const { data, error } = await serviceClient().from("game_availability").select("game,is_open");
    if (error) return json({ games: [] }, 503);
    return json({ games: data });
  } catch { return json({ games: [] }, 503); }
}
