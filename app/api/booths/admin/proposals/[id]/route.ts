import { z } from "zod";
import { reviewSchema } from "@/lib/booths/validation";
import { requireAdmin, serviceClient, checkOrigin, BoothError, json, responseError, readJson } from "@/lib/booths/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const { user } = await requireAdmin();
    const { id } = await params;
    const input = reviewSchema.safeParse(await readJson(request));
    if (!z.uuid().safeParse(id).success || !input.success) throw new BoothError(400, "Yêu cầu xét duyệt không hợp lệ.");
    const { data, error } = await serviceClient().rpc("review_booth_proposal", { p_proposal_id: id, p_decision: input.data.decision, p_admin_id: user.id, p_note: input.data.note });
    if (error) {
      if (/BOOTH_TAKEN|ALREADY_REVIEWED/.test(error.message)) throw new BoothError(409, "Đề xuất đã được xử lý hoặc vị trí đã được chốt. Vui lòng tải lại danh sách.");
      if (error.message.includes("NOT_FOUND")) throw new BoothError(404, "Không tìm thấy đề xuất.");
      if (error.message.includes("NOT_ADMIN")) throw new BoothError(403, "Quyền quản trị đã thay đổi. Vui lòng đăng nhập lại.");
      throw new BoothError(503, "Chưa thể duyệt đề xuất. Vui lòng thử lại.");
    }
    return json(data);
  } catch (error) { return responseError(error); }
}
