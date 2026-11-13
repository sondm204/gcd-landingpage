import { isCommercialPosition } from "@/lib/booths/types";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { transferMemo } from "@/lib/booths/payment";
import { quotePayment } from "@/lib/booths/vouchers";
import { boundedForm, validateImages } from "@/lib/booths/uploads";
import { proposalSchema } from "@/lib/booths/validation";
import { BoothError, serviceClient, checkOrigin, rateLimit, json, responseError } from "@/lib/booths/server";

export async function POST(request: Request) {
  const uploaded: string[] = [];
  let keepFiles = false;
  let requestKey: string | null = null;
  try {
    checkOrigin(request);
    const db = serviceClient();
    await rateLimit(request, "proposal-ip", 12, 3600);
    const key = z.uuid().safeParse(request.headers.get("idempotency-key"));
    if (!key.success) throw new BoothError(400, "Phiên gửi không hợp lệ. Vui lòng tải lại trang.");
    requestKey = key.data;
    const form = await boundedForm(request);
    const parsed = proposalSchema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) throw new BoothError(400, parsed.error.issues[0].message);
    const input = parsed.data;
    await rateLimit(request, "proposal-email", 5, 3600, input.email);
    const validated = await validateImages(form);
    const receiptForm = new FormData();
    const receipt = form.get("payment_receipt");
    if (receipt instanceof File && receipt.size) receiptForm.set("images", receipt);
    const receiptImages = await validateImages(receiptForm);
    if (receiptImages.length && !isCommercialPosition(input.position_id)) throw new BoothError(400, "Ảnh chuyển khoản chỉ áp dụng cho gian thương mại.");
    const hash = createHash("sha256").update(JSON.stringify(input));
    validated.forEach((image) => hash.update(`${image.type}:${image.bytes.byteLength}:`).update(image.bytes));
    receiptImages.forEach((image) => hash.update("receipt:").update(image.bytes));
    const fingerprint = hash.digest("hex");
    const { data: existing, error: retryError } = await db.from("booth_proposals").select("reference,fingerprint").eq("request_key", key.data).maybeSingle();
    if (retryError) throw new BoothError(503, "Chưa thể kiểm tra phiên gửi. Vui lòng thử lại.");
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new BoothError(409, "Phiên gửi đã được sử dụng. Vui lòng tải lại trang trước khi gửi nội dung mới.");
      return json({ reference: existing.reference, message: "Đề xuất này đã được ghi nhận." }, 201);
    }
    const payment = await quotePayment(input.position_id, input.discount_code);
    // Reject booked positions before uploading. The RPC checks again under a row lock.
    const { data: position, error: lookupError } = await db.from("booth_public_map").select("is_booked").eq("id", input.position_id).single();
    if (lookupError) throw new BoothError(503, "Không thể kiểm tra vị trí lúc này.");
    if (position.is_booked) throw new BoothError(409, "Vị trí đã được xác nhận. Vui lòng chọn vị trí khác.");
    let receiptPath: string | null = null;
    for (const image of [...validated, ...receiptImages]) {
      const path = `${key.data}/${randomUUID()}.${image.extension}`;
      const { error } = await db.storage.from("booth-proposals").upload(path, image.bytes, { contentType: image.type, upsert: false });
      if (error) throw new BoothError(503, "Chưa thể lưu ảnh. Vui lòng thử lại.");
      uploaded.push(path);
      if (receiptImages.includes(image)) receiptPath = path;
    }
    const { data, error } = await db.rpc("submit_booth_proposal", { p_request_key: key.data, p_fingerprint: fingerprint, p_data: { ...input, payment: payment ? { ...payment, memo: transferMemo(input.position_id, input.brand), receipt_path: receiptPath } : null }, p_images: uploaded.filter(path => path !== receiptPath) });
    if (error) {
      if (/VOUCHER_UNAVAILABLE|VOUCHER_CHANGED/.test(error.message)) throw new BoothError(409, "Voucher đã hết lượt hoặc thay đổi. Vui lòng xác nhận lại mã và số tiền trước khi gửi.");
      if (error.message.includes("BOOTH_TAKEN")) throw new BoothError(409, "Vị trí vừa được xác nhận cho gian hàng khác. Vui lòng chọn lại.");
      if (error.message.includes("REQUEST_KEY_REUSED")) throw new BoothError(409, "Phiên gửi đã được sử dụng. Vui lòng tải lại trang trước khi gửi nội dung mới.");
      console.error("submit_booth_proposal failed", { code: error.code });
      throw new BoothError(503, "Chưa thể lưu đề xuất. Vui lòng thử lại với cùng phiên gửi.");
    }
    keepFiles = !data.reused;
    return json({ reference: data.reference, message: "Đã nhận đề xuất. Vị trí chỉ được xác nhận sau khi ban tổ chức phê duyệt." }, 201);
  } catch (error) { return responseError(error); }
  finally {
    if (!keepFiles && uploaded.length) {
      try {
        // A lost HTTP response can follow a committed insert. Never delete its images.
        const db = serviceClient();
        const { data: stored, error: lookupError } = await db.from("booth_proposals").select("image_paths,payment").eq("request_key", requestKey!).maybeSingle();
        if (!lookupError) {
          const unused = uploaded.filter((path) => !(stored?.image_paths || []).includes(path) && stored?.payment?.receipt_path !== path);
          if (unused.length) await db.storage.from("booth-proposals").remove(unused);
        }
      } catch { console.error("Could not clean up temporary booth uploads"); }
    }
  }
}
