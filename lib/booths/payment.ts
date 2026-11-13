export const COMMERCIAL_PRICE = 5_000_000;
export function calculatePayment(position: number, code: string, config = "[]") {
  if (!((position >= 1 && position <= 20) || position === 34)) {
    if (code) throw new Error("Mã giảm giá chỉ áp dụng cho gian thương mại.");
    return null;
  }
  const normalized = code.trim().toUpperCase();
  let discount = 0;
  if (normalized) {
    const rules: { code: string; type: string; value: number }[] = JSON.parse(config);
    const rule = rules.find(item => item.code.toUpperCase() === normalized);
    if (!rule) throw new Error("Mã giảm giá không hợp lệ.");
    if (!Number.isSafeInteger(rule.value) || rule.value <= 0 || !["percent", "amount"].includes(rule.type) || (rule.type === "percent" && rule.value > 100)) throw new Error("Mã giảm giá chưa được cấu hình đúng.");
    discount = Math.min(COMMERCIAL_PRICE, rule.type === "percent" ? Math.floor(COMMERCIAL_PRICE * rule.value / 100) : rule.value);
  }
  return { base: COMMERCIAL_PRICE, discount, amount: COMMERCIAL_PRICE - discount, discount_code: normalized };
}

export function transferMemo(position: number, brand: string) {
  const name = brand.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "D").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return `JCITL GCD TM${String(position === 34 ? 21 : position).padStart(2, "0")} ${name}`.slice(0, 50).trim();
}
