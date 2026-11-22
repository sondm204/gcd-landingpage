import { z } from "zod";
import { isCommercialPosition } from "@/lib/booths/types";
import { transferMemo } from "@/lib/booths/payment";
import { quotePayment } from "@/lib/booths/vouchers";
import { json, BoothError, responseError, serviceClient } from "@/lib/booths/server";

export async function POST(request: Request) {
  try {
    const parsed = z.object({ position: z.number().int().refine(isCommercialPosition), brand: z.string().trim().min(2).max(120), code: z.string().trim().max(50), requestKey: z.uuid() }).safeParse(await request.json());
    if (!parsed.success) throw new BoothError(400, "Thông tin thanh toán không hợp lệ.");
    const { data: position, error } = await serviceClient().from("booth_public_map").select("is_locked,is_booked").eq("id", parsed.data.position).single();
    if (error || !position) throw new BoothError(503, "Không thể kiểm tra vị trí lúc này.");
    if (position.is_locked) throw new BoothError(409, "Vị trí đang tạm khóa đăng ký. Vui lòng chọn vị trí khác.");
    if (position.is_booked) throw new BoothError(409, "Vị trí đã được xác nhận. Vui lòng chọn vị trí khác.");
    const payment = await quotePayment(parsed.data.position, parsed.data.code);
    const memo = transferMemo(parsed.data.position, parsed.data.brand);
    const bank = process.env.BOOTH_BANK_ID, account = process.env.BOOTH_BANK_ACCOUNT, name = process.env.BOOTH_BANK_NAME;
    const query = new URLSearchParams({ amount: String(payment!.amount), addInfo: memo, accountName: name || "" });
    const qr = bank && account && name && payment!.amount > 0 ? `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-compact2.png?${query}` : null;
    return json({ ...payment, memo, qr, bank: bank || "", account: account || "", name: name || "" });
  } catch (error) { return responseError(error); }
}
