import { conceptPositions, POSITION_COUNT, isBookablePosition } from "@/lib/booths/types";
import { connection } from "next/server";
import { configured, serviceClient, json, responseError, BoothError } from "@/lib/booths/server";

export async function GET() {
  await connection();
  try {
    if (!configured()) return json({ configured: false, positions: conceptPositions() });
    const { data, error } = await serviceClient().from("booth_public_map").select("id,code,zone,x,y,width,height,pending_count,confirmed_brand,confirmed_booth,is_booked,is_bookable").order("id");
    if (error || data?.length !== POSITION_COUNT || data.some((position, index) => position.id !== index + 1 || position.is_bookable !== isBookablePosition(position.id))) throw new BoothError(503, "Chưa tải được sơ đồ gian hàng. Vui lòng thử lại sau.");
    return json({ configured: true, positions: data });
  } catch (error) { return responseError(error); }
}
