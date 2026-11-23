import { z } from "zod";
import { normalizeName, normalizePhone } from "../games/validation.ts";

export const registrationSchema = z.object({
  full_name: z.string().max(200).transform(normalizeName).pipe(z.string().min(2, "Vui lòng nhập họ và tên.").max(120, "Họ và tên tối đa 120 ký tự.")),
  birth_date: z.string().refine(value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T00:00:00Z");
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0,10);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && value >= "1900-01-01" && value <= today;
  }, "Ngày sinh không hợp lệ hoặc nằm trong tương lai."),
  phone: z.string().max(40).transform(normalizePhone).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Vui lòng nhập số điện thoại hợp lệ.")),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Vui lòng nhập địa chỉ email hợp lệ.")),
  facebook_url: z.string().trim().max(500).transform(value => /^https?:\/\//i.test(value) ? value : "https://" + value).refine(value => {
    try { const url = new URL(value); return ["https:","http:"].includes(url.protocol) && !url.username && !url.password && !url.port && /(^|\.)facebook\.com$|^(www\.)?fb\.com$/i.test(url.hostname) && url.pathname !== "/"; } catch { return false; }
  }, "Vui lòng nhập liên kết Facebook cá nhân hợp lệ."),
  is_jci: z.boolean(),
  chapter: z.string().trim().max(120, "Tên chapter tối đa 120 ký tự."),
  consent: z.literal(true, { error: "Vui lòng đồng ý để ban tổ chức sử dụng thông tin đăng ký." }),
  website_confirm: z.literal("", { error: "Yêu cầu đăng ký không hợp lệ." }),
}).strict().superRefine((value, ctx) => {
  if (value.is_jci && value.chapter.length < 2) ctx.addIssue({ code: "custom", path: ["chapter"], message: "Vui lòng nhập chapter JCI bạn đang hoạt động." });
}).transform(value => ({ ...value, chapter: value.is_jci ? value.chapter : "" }));
