import { z } from "zod";

const safeWebsite = z.string().trim().max(300).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}, "Website phải là liên kết http:// hoặc https:// hợp lệ.").transform((value) => value ? new URL(value).href : "");

export const proposalSchema = z.object({
  position_id: z.coerce.number().int().min(1).max(40),
  brand: z.string().trim().min(2, "Nhập tên thương hiệu.").max(120),
  booth_name: z.string().trim().min(2, "Nhập tên gian hàng.").max(120),
  contact_name: z.string().trim().min(2, "Nhập tên người liên hệ.").max(100),
  email: z.email("Email chưa hợp lệ.").trim().toLowerCase().max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()\-.]{8,24}$/, "Số điện thoại chưa hợp lệ.").refine((value) => { const digits = value.replace(/\D/g, "").length; return digits >= 8 && digits <= 15; }, "Số điện thoại cần có 8–15 chữ số."),
  website: safeWebsite,
  description: z.string().trim().max(2000, "Nội dung gian hàng tối đa 2000 ký tự.").default(""),
  category: z.enum(["Thủ công & làng nghề", "Ẩm thực", "Văn hoá & sáng tạo", "Thương hiệu & cộng đồng", "Khác"]),
  consent: z.literal("true", { error: "Bạn cần đồng ý để ban tổ chức liên hệ xét duyệt." }),
  website_confirm: z.string().max(0),
});
export const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).default(""),
});
export const editBoothSchema = proposalSchema.omit({ consent: true, website_confirm: true }).extend({
  expected_updated_at: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(1000).default(""),
  confirm_move: z.enum(["true", "false"]).default("false"),
});
export const loginSchema = z.object({ email: z.email().trim().toLowerCase().max(254), password: z.string().min(1).max(256) });
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_REQUEST_BYTES = 3 * MAX_IMAGE_BYTES + 64 * 1024;

export function imageExtension(bytes: Uint8Array, mime: string): string | null {
  if (mime === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (mime === "image/png" && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) return "png";
  if (mime === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}
