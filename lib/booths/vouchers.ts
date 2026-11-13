import "server-only";
import { calculatePayment } from "./payment";
import { isCommercialPosition } from "./types";
import { serviceClient, BoothError } from "./server";

export async function quotePayment(position: number, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return calculatePayment(position, "", "[]");
  if (!isCommercialPosition(position)) throw new BoothError(400, "Mã giảm giá chỉ áp dụng cho gian thương mại.");
  const { data, error } = await serviceClient().from("booth_vouchers").select("code,type,value,usage_limit,used_count").eq("code", normalized).eq("active", true).maybeSingle();
  if (error) throw new BoothError(503, "Chưa kiểm tra được mã giảm giá. Vui lòng thử lại.");
  if (!data) throw new BoothError(400, "Mã giảm giá không tồn tại hoặc đã tắt.");
  if (data.usage_limit != null && data.used_count >= data.usage_limit) throw new BoothError(400, "Mã giảm giá đã hết lượt sử dụng.");
  return calculatePayment(position, normalized, JSON.stringify([data]));
}
