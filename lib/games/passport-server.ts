import "server-only";
import { requireAdmin, BoothError } from "@/lib/booths/server";
import { dbGameError, GameError } from "./server";
export async function passportAdmin() {
  try { return (await requireAdmin()).user; }
  catch (error) { if (error instanceof BoothError) throw new GameError(error.status, error.message); throw error; }
}
export function passportDbError(error: { code?: string; message: string }): never {
  const messages: Record<string, string> = { QR_INVALID: "Mã QR không hợp lệ hoặc đã được thay mới. Hãy quét mã đang đặt tại gian.", COLLECTION_CLOSED: "Thời gian nhận dấu chưa mở hoặc đã kết thúc.", STATION_DISABLED: "Gian này hiện chưa mở nhận dấu.", PASSPORT_NOT_FOUND: "Không tìm thấy hộ chiếu. Hãy quét QR cá nhân của người chơi.", REDEMPTION_CLOSED: "Ban tổ chức chưa mở đổi quà hoặc chưa đặt mốc số dấu.", NOT_ENOUGH_STAMPS: "Hộ chiếu chưa đủ số dấu để đổi quà.", NOT_ADMIN: "Tài khoản chưa được cấp quyền quản trị." };
  const match = Object.keys(messages).find(key => error.message.includes(key));
  if (match) throw new GameError(match === "NOT_ADMIN" ? 403 : 409, messages[match]);
  dbGameError(error);
}
export function passportUrl(request: Request, code: string, kind: "station" | "card") {
  const url = new URL(kind === "station" ? "/game/check-in" : "/game/admin", process.env.SITE_URL || new URL(request.url).origin);
  url.hash = new URLSearchParams({ [kind === "station" ? "code" : "card"]: code }).toString();
  return url.href;
}
