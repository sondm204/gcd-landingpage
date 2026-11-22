import { z } from "zod";
import { isBookablePosition } from "@/lib/booths/types";
import { BoothError, checkOrigin, json, readJson, requireAdmin, responseError, serviceClient } from "@/lib/booths/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const { user } = await requireAdmin();
    const position = z.coerce.number().int().refine(isBookablePosition).safeParse((await context.params).id);
    const input = z.object({ is_locked: z.boolean() }).strict().safeParse(await readJson(request));
    if (!position.success || !input.success) throw new BoothError(400, "Thông tin khóa vị trí không hợp lệ.");
    const { data, error } = await serviceClient().rpc("set_booth_position_lock", { p_position_id: position.data, p_locked: input.data.is_locked, p_admin_id: user.id });
    if (error) {
      if (error.message.includes("NOT_ADMIN")) throw new BoothError(403, "Tài khoản chưa được cấp quyền quản trị gian hàng.");
      if (error.message.includes("INVALID_POSITION")) throw new BoothError(400, "Vị trí này không hỗ trợ khóa đăng ký.");
      throw new BoothError(503, "Chưa thể cập nhật khóa vị trí. Vui lòng thử lại.");
    }
    return json(data);
  } catch (error) { return responseError(error); }
}
