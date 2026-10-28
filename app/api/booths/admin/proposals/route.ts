import { requireAdmin, serviceClient, BoothError, json, responseError } from "@/lib/booths/server";
import type { BoothProposal } from "@/lib/booths/types";
import { connection } from "next/server";

export async function GET(request: Request) {
  await connection();
  try {
    const { user } = await requireAdmin();
    const params = new URL(request.url).searchParams;
    const status = params.get("status") || "pending";
    const page = Number(params.get("page") || 1);
    const position = params.get("position");
    if (!["all", "pending", "approved", "rejected"].includes(status) || !Number.isInteger(page) || page < 1 || page > 10000 || (position && (!/^\d+$/.test(position) || Number(position) < 1 || Number(position) > 40))) throw new BoothError(400, "Bộ lọc không hợp lệ.");
    const db = serviceClient();
    let query = db.from("booth_proposals").select("id,reference,position_id,brand,booth_name,contact_name,phone,email,website,category,description,image_paths,status,created_at,updated_at,reviewed_at,review_note", { count: "exact" }).order("created_at", { ascending: false }).order("id");
    if (status !== "all") query = query.eq("status", status);
    if (position) query = query.eq("position_id", Number(position));
    const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);
    if (error) throw new BoothError(503, "Chưa tải được danh sách đề xuất.");
    const proposals = data as BoothProposal[];
    const paths = proposals.flatMap((item) => item.image_paths);
    const urlMap = new Map<string, string>();
    if (paths.length) {
      const { data: signed, error: imageError } = await db.storage.from("booth-proposals").createSignedUrls(paths, 300);
      if (imageError) throw new BoothError(503, "Chưa tải được ảnh đính kèm. Vui lòng thử lại.");
      signed?.forEach((image) => { if (image.path && image.signedUrl) urlMap.set(image.path, image.signedUrl); });
    }
    return json({ proposals: proposals.map((item) => ({ ...item, image_urls: item.image_paths.map((path) => urlMap.get(path) || "") })), total: count || 0, page, admin: user.email });
  } catch (error) { return responseError(error); }
}
