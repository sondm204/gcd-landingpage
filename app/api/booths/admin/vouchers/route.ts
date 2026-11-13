import { z } from "zod";
import { requireAdmin, serviceClient, json, responseError, BoothError, checkOrigin, readJson } from "@/lib/booths/server";

const schema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/), type: z.enum(["percent", "amount"]), value: z.number().int().positive().max(2147483647), usage_limit: z.number().int().positive().max(2147483647).nullable().default(null) }).refine(v => v.type !== "percent" || v.value <= 100);
export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await serviceClient().from("booth_vouchers").select("id,code,type,value,active,created_at,usage_limit,used_count").order("created_at", { ascending: false }).limit(1000);
    if (error) throw new BoothError(503, "Chưa tải được voucher.");
    return json({ vouchers: data });
  } catch (error) { return responseError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); const { user } = await requireAdmin();
    const input = schema.safeParse(await readJson(request));
    if (!input.success) throw new BoothError(400, "Mã chỉ gồm chữ, số, gạch ngang/gạch dưới; mức giảm phải là số nguyên dương, phần trăm tối đa 100.");
    const { error } = await serviceClient().from("booth_vouchers").insert({ ...input.data, created_by: user.id });
    if (error) throw new BoothError(error.code === "23505" ? 409 : 503, error.code === "23505" ? "Mã đã tồn tại." : "Chưa lưu được voucher.");
    return json({ saved: true }, 201);
  } catch (error) { return responseError(error); }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const input = z.object({ id: z.uuid(), active: z.boolean().optional(), usage_limit: z.number().int().positive().max(2147483647).optional() }).refine(v => v.active !== undefined || v.usage_limit !== undefined).safeParse(await readJson(request));
    if (!input.success) throw new BoothError(400, "Thông tin voucher không hợp lệ.");
    const { id, ...updates } = input.data;
    const { data, error } = await serviceClient().from("booth_vouchers").update(updates).eq("id", id).select("id").maybeSingle();
    if (error) throw new BoothError(503, "Chưa cập nhật được voucher.");
    if (!data) throw new BoothError(404, "Không tìm thấy voucher.");
    return json({ saved: true });
  } catch (error) { return responseError(error); }
}
