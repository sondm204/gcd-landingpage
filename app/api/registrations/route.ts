import { createHash } from "node:crypto";
import { z } from "zod";
import { registrationSchema } from "@/lib/registrations/validation";
import { BoothError, checkOrigin, json, rateLimit, readJson, responseError, serviceClient } from "@/lib/booths/server";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const key = z.uuid().safeParse(request.headers.get("idempotency-key"));
    if (!key.success) throw new BoothError(400, "Phiên đăng ký không hợp lệ. Vui lòng tải lại trang.");
    await rateLimit(request, "event-registration-ip", 120, 600);
    const parsed = registrationSchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ error: "Vui lòng kiểm tra lại thông tin đăng ký.", errors: Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])) }, 400);
    await rateLimit(request, "event-registration-phone", 6, 600, parsed.data.phone);
    const fingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
    const { data, error } = await serviceClient().rpc("register_event_attendee", { p_request_key: key.data, p_fingerprint: fingerprint, p_data: parsed.data });
    if (error) {
      if (error.code === "23505") throw new BoothError(409, "Số điện thoại hoặc email này đã được đăng ký. Vui lòng liên hệ ban tổ chức nếu cần cập nhật.");
      if (error.message.includes("REQUEST_KEY_REUSED")) throw new BoothError(409, "Nội dung đã thay đổi so với phiên đăng ký trước. Vui lòng tải lại trang để gửi thông tin mới.");
      throw new BoothError(503, "Chưa thể lưu đăng ký. Bạn có thể thử gửi lại mà không tạo đăng ký trùng.");
    }
    return json({ reference: data.reference }, 201);
  } catch (error) { return responseError(error); }
}
