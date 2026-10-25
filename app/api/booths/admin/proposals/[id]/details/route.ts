import { randomUUID } from "node:crypto";
import { z } from "zod";
import { editBoothSchema } from "@/lib/booths/validation";
import { boundedForm, validateImages } from "@/lib/booths/uploads";
import { BoothError, checkOrigin, json, requireAdmin, responseError, serviceClient } from "@/lib/booths/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uploaded: string[] = [];
  let committed = false;
  let proposalId: string | undefined;
  try {
    checkOrigin(request);
    const { user } = await requireAdmin();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new BoothError(400, "Mã gian hàng không hợp lệ.");
    proposalId = id;
    const form = await boundedForm(request);
    const input = editBoothSchema.safeParse(Object.fromEntries(form.entries()));
    if (!input.success) throw new BoothError(400, input.error.issues[0].message);
    let retained: string[];
    try { retained = z.array(z.string()).max(3).parse(JSON.parse(String(form.get("retained_images") || "[]"))); }
    catch { throw new BoothError(400, "Danh sách ảnh giữ lại không hợp lệ."); }
    if (new Set(retained).size !== retained.length) throw new BoothError(400, "Danh sách ảnh bị trùng.");
    const db = serviceClient();
    const { data: current, error: lookupError } = await db.from("booth_proposals").select("id,position_id,status,image_paths,updated_at").eq("id", id).maybeSingle();
    if (lookupError) throw new BoothError(503, "Chưa tải được gian hàng. Vui lòng thử lại.");
    if (!current) throw new BoothError(404, "Không tìm thấy gian hàng.");
    if (current.status !== "approved") throw new BoothError(409, "Chỉ sửa được gian hàng đã xác nhận.");
    if (retained.some((path) => !current.image_paths.includes(path))) throw new BoothError(400, "Ảnh giữ lại không thuộc gian hàng này.");
    if (current.position_id !== input.data.position_id && input.data.confirm_move !== "true") throw new BoothError(400, "Vui lòng xác nhận việc chuyển vị trí.");
    const images = await validateImages(form);
    if (retained.length + images.length > 3) throw new BoothError(400, "Tổng ảnh giữ lại và thêm mới không được quá 3.");
    for (const image of images) {
      const path = `admin/${id}/${randomUUID()}.${image.extension}`;
      const { error } = await db.storage.from("booth-proposals").upload(path, image.bytes, { contentType: image.type, upsert: false });
      if (error) throw new BoothError(503, "Không lưu được ảnh mới.");
      uploaded.push(path);
    }
    const { data, error } = await db.rpc("update_confirmed_booth", {
      p_proposal_id: id, p_admin_id: user.id, p_expected_updated_at: input.data.expected_updated_at,
      p_data: input.data, p_images: [...retained, ...uploaded], p_note: input.data.note,
    });
    if (error) {
      if (error.message.includes("BOOTH_TAKEN")) throw new BoothError(409, "Ô đích đã có gian hàng xác nhận. Vui lòng chọn ô khác.");
      if (/STALE_PROPOSAL|NOT_CONFIRMED/.test(error.message)) throw new BoothError(409, "Gian hàng đã được thay đổi bởi một thao tác khác. Hãy tải lại trước khi sửa.");
      if (error.message.includes("NOT_ADMIN")) throw new BoothError(403, "Tài khoản không còn quyền quản trị.");
      throw new BoothError(503, "Chưa thể cập nhật gian hàng. Vui lòng tải lại để kiểm tra kết quả.");
    }
    committed = true;
    // Keep old files for the private audit history; only signed admin URLs expose them.
    return json(data);
  } catch (error) { return responseError(error); }
  finally {
    if (!committed && uploaded.length && proposalId) {
      try {
        const db = serviceClient();
        const { data, error } = await db.from("booth_proposals").select("image_paths").eq("id", proposalId).maybeSingle();
        if (!error) {
          const unused = uploaded.filter((path) => !(data?.image_paths || []).includes(path));
          if (unused.length) await db.storage.from("booth-proposals").remove(unused);
        }
      } catch { console.error("Unable to clean up unused admin image uploads"); }
    }
  }
}
