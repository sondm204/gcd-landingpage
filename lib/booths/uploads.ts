import "server-only";
import { BoothError } from "./server";
import { MAX_REQUEST_BYTES, MAX_IMAGE_BYTES, imageExtension } from "./validation";

export async function boundedForm(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) throw new BoothError(413, "Tổng dung lượng ảnh tối đa 3 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new BoothError(400, "Thiếu nội dung yêu cầu.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) { await reader.cancel(); throw new BoothError(413, "Tổng dung lượng ảnh tối đa 3 MB."); }
    chunks.push(value);
  }
  try { return await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData(); }
  catch { throw new BoothError(400, "Nội dung yêu cầu không hợp lệ."); }
}
export async function validateImages(form: FormData) {
  const files = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 3) throw new BoothError(400, "Chỉ gửi tối đa 3 ảnh.");
  return Promise.all(files.map(async (file) => {
    if (file.size > MAX_IMAGE_BYTES) throw new BoothError(400, "Mỗi ảnh tối đa 1 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = imageExtension(bytes, file.type);
    if (!extension) throw new BoothError(400, "Ảnh phải là JPEG, PNG hoặc WebP hợp lệ.");
    return { bytes, extension, type: file.type };
  }));
}
