import { conceptPositions, POSITION_COUNT, isBookablePosition } from "@/lib/booths/types";
import { connection } from "next/server";
import { configured, serviceClient, json, responseError, BoothError } from "@/lib/booths/server";

export async function GET() {
  await connection();
  try {
    if (!configured()) return json({ configured: false, positions: conceptPositions() });
    const { data, error } = await serviceClient().from("booth_public_map").select("id,code,zone,x,y,width,height,pending_count,confirmed_brand,confirmed_booth,is_booked,is_bookable").order("id");
    if (error || data?.length !== POSITION_COUNT || data.some((position, index) => position.id !== index + 1 || position.is_bookable !== isBookablePosition(position.id))) throw new BoothError(503, "Chưa tải được sơ đồ gian hàng. Vui lòng thử lại sau.");
    const logos = new Map<number, string>();
    const booked = data.filter(position => position.is_booked).map(position => position.id);
    if (booked.length) {
      const db = serviceClient();
      // Publish only the first image of approved proposals; never contact data or receipts.
      const { data: approved } = await db.from("booth_proposals").select("position_id,image_paths,brand,booth_name").eq("status", "approved").in("position_id", booked);
      const matches = (approved || []).filter(proposal => data.some(position => position.id === proposal.position_id && position.confirmed_brand === proposal.brand && position.confirmed_booth === proposal.booth_name));
      const paths = [...new Set(matches.flatMap(proposal => proposal.image_paths?.[0] ? [proposal.image_paths[0] as string] : []))];
      if (paths.length) {
        const { data: signed } = await db.storage.from("booth-proposals").createSignedUrls(paths, 300);
        const urls = new Map((signed || []).filter(image => !image.error && image.signedUrl).map(image => [image.path, image.signedUrl]));
        matches.forEach(proposal => { const url = urls.get(proposal.image_paths?.[0]); if (url) logos.set(proposal.position_id, url); });
      }
    }
    return json({ configured: true, positions: data.map(position => ({ ...position, confirmed_logo_url: position.is_booked ? logos.get(position.id) || null : null })) });
  } catch (error) { return responseError(error); }
}
