import { z } from "zod";

export function normalizePhone(value: string) {
  let phone = value.trim().replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = "+" + phone.slice(2);
  if (/^0[35789]\d{8}$/.test(phone)) phone = "+84" + phone.slice(1);
  if (/^84[35789]\d{8}$/.test(phone)) phone = "+" + phone;
  return phone;
}
export const normalizeName = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ");
export const accountSchema = z.object({
  phone: z.string().max(40).transform(normalizePhone).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Nhập số điện thoại hợp lệ, ví dụ 0912345678 hoặc +84912345678.")),
  display_name: z.string().max(100).transform(normalizeName).pipe(z.string().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(40, "Tên hiển thị tối đa 40 ký tự.").regex(/^[\p{L}\p{M}\p{N} ._'’-]+$/u, "Tên chỉ gồm chữ, số, khoảng trắng và dấu . _ ' -.")),
}).strict();
export const phoneLoginSchema = accountSchema.partial({ display_name: true });
