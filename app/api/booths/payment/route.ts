import { z } from "zod";
import { isCommercialPosition } from "@/lib/booths/types";
import { transferMemo } from "@/lib/booths/payment";
import { quotePayment } from "@/lib/booths/vouchers";
import { json, BoothError, responseError } from "@/lib/booths/server";

export async function POST(request: Request) {
  try {
    const parsed = z.object({ position: z.number().int().refine(isCommercialPosition), code: z.string().trim().max(50), requestKey: z.uuid() }).safeParse(await request.json());
    if (!parsed.success) throw new BoothError(400, "Thông tin thanh toán không hợp lệ.");
    const payment = await quotePayment(parsed.data.position, parsed.data.code);
    const memo = transferMemo(parsed.data.position, parsed.data.requestKey);
    const bank = process.env.BOOTH_BANK_ID, account = process.env.BOOTH_BANK_ACCOUNT, name = process.env.BOOTH_BANK_NAME;
    const query = new URLSearchParams({ amount: String(payment!.amount), addInfo: memo, accountName: name || "" });
    const qr = bank && account && name && payment!.amount > 0 ? `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-compact2.png?${query}` : null;
    return json({ ...payment, memo, qr, bank: bank || "", account: account || "", name: name || "" });
  } catch (error) { return responseError(error); }
}
