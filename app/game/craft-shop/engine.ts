export type Mode = "online" | "event";
export const products = [
  { id: "pot", name: "Bình gốm", village: "Bát Tràng", color: "#dce9f3" },
  { id: "silk", name: "Khăn lụa", village: "Vạn Phúc", color: "#f4dfe2" },
  { id: "basket", name: "Giỏ mây", village: "Phú Vinh", color: "#eee3c9" },
  { id: "fan", name: "Quạt giấy", village: "Chàng Sơn", color: "#e5ebd9" },
  { id: "hat", name: "Nón lá", village: "làng Chuông", color: "#f4eaca" },
  { id: "dragonfly", name: "Chuồn chuồn tre", village: "Thạch Xá", color: "#e5e1f4" },
] as const;
export type ProductId = typeof products[number]["id"];
export const rules = {
  online: { duration: 60_000, patience: 24_000 },
  event: { duration: 60_000, patience: 32_000 },
};
export const MAX_TRAY = 3;
export type Order = { id: number; items: ProductId[] };
export type Customer = Order & { slot: number; expiresAt: number };
export type Answer = Order & { correct: boolean; points: number };
export type Notice = { id: number; kind: "correct" | "wrong" | "expired"; text: string; slot?: number };
export type State = {
  phase: "ready" | "playing" | "result"; mode: Mode; orders: Order[];
  customers: Customer[]; nextOrder: number; tray: ProductId[]; seed: number;
  score: number; combo: number; answers: Answer[]; end: number; now: number;
  notice: Notice | null; revision: number;
};
export type Action = { type: "start"; orders: Order[]; now: number; seed?: number }
  | { type: "select"; id: ProductId; now: number }
  | { type: "remove"; index: number; now: number }
  | { type: "tick" | "deliver" | "clear"; now: number } | { type: "reset" };
export function initialState(mode: Mode): State {
  return { phase: "ready", mode, orders: [], customers: [], nextOrder: 0, tray: [], seed: 1, score: 0, combo: 0, answers: [], end: 0, now: 0, notice: null, revision: 0 };
}
export function shuffledOrders(): Order[] {
  const orders: Order[] = [];
  const seen = new Set<string>();
  while (orders.length < 3) {
    const count = orders.length % 2 === 0 ? 2 : 3;
    const items = Array.from({ length: count }, () => products[Math.floor(Math.random() * products.length)].id);
    if (seen.has(items.join(","))) continue;
    seen.add(items.join(","));
    orders.push({ id: orders.length + 1, items });
  }
  return orders;
}
function refill(s: State): State {
  const customers = [...s.customers];
  const orders = [...s.orders];
  let nextOrder = s.nextOrder;
  let seed = s.seed;
  for (let slot = 0; slot < 3; slot++) {
    if (!customers.some(c => c.slot === slot)) {
      if (nextOrder === orders.length) {
        // Seeded generation keeps the reducer pure, including React Strict Mode replays.
        let items: ProductId[];
        do {
          items = Array.from({ length: nextOrder % 2 === 0 ? 2 : 3 }, () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return products[Math.floor(seed / 4294967296 * products.length)].id;
          });
        } while (customers.some(c => c.items.join(",") === items.join(",")));
        orders.push({ id: nextOrder + 1, items });
      }
      // Stagger the opening customers so all three do not leave at once.
      const bonus = s.answers.length === 0 ? slot * 3000 : 0;
      customers.push({ ...orders[nextOrder++], slot, expiresAt: s.now + Math.max(8000, rules[s.mode].patience - Math.floor((s.now - (s.end - rules[s.mode].duration)) / 10000) * 3000) + bonus });
    }
  }
  return { ...s, orders, seed, customers: customers.sort((a, b) => a.slot - b.slot), nextOrder };
}
function advanceTime(s: State, now: number): State {
  const current = { ...s, now };
  const expired = s.customers.filter(c => now >= c.expiresAt);
  if (now >= s.end) {
    return { ...current, phase: "result", customers: [], tray: [], answers: [
      ...s.answers, ...s.orders.filter(o => !s.answers.some(a => a.id === o.id)).map(o => ({ ...o, correct: false, points: 0 })),
    ] };
  }
  if (!expired.length) return current;
  const answers = [...s.answers, ...expired.map(c => ({ id: c.id, items: c.items, correct: false, points: -10 }))];
  const next = { ...current, customers: s.customers.filter(c => now < c.expiresAt), answers, combo: 0, score: Math.max(0, s.score - expired.length * 10),
    revision: s.revision + 1, notice: { id: s.revision + 1, kind: "expired" as const, text: `${expired.length} khách đã hết kiên nhẫn và rời tiệm. -${expired.length * 10} điểm` } };
  return refill(next);
}
export function reducer(s: State, a: Action): State {
  if (a.type === "reset") return initialState(s.mode);
  if (a.type === "start") {
    if (s.phase !== "ready" || a.orders.length !== 3) return s;
    return refill({ ...initialState(s.mode), phase: "playing", orders: a.orders, seed: a.seed ?? a.now >>> 0, now: a.now, end: a.now + rules[s.mode].duration });
  }
  if (s.phase !== "playing") return s;
  const current = advanceTime(s, a.now);
  if (current.phase !== "playing") return current;
  if (a.type === "select") return current.tray.length < MAX_TRAY ? { ...current, tray: [...current.tray, a.id] } : current;
  if (a.type === "remove") return { ...current, tray: current.tray.filter((_, index) => index !== a.index) };
  if (a.type === "clear") return { ...current, tray: [] };
  if (a.type !== "deliver" || !current.tray.length) return current;
  const customer = current.customers.find(c => c.items.length === current.tray.length && c.items.every((id, i) => id === current.tray[i]));
  const revision = current.revision + 1;
  if (!customer) return { ...current, combo: 0, revision, notice: { id: revision, kind: "wrong", text: "Chưa khớp đơn nào! Kiểm tra món và thứ tự từ trái sang phải." } };
  const combo = current.combo + 1;
  const points = 10;
  const answers = [...current.answers, { id: customer.id, items: customer.items, correct: true, points }];
  const next = { ...current, tray: [], customers: current.customers.filter(c => c.id !== customer.id), answers,
    combo, score: current.score + points, revision,
    notice: { id: revision, kind: "correct" as const, slot: customer.slot, text: `Khách #${customer.id} đã nhận đúng đơn! +${points} điểm` } };
  return refill(next);
}
