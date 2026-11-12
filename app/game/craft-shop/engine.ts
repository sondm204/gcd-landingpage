export type Mode = "online" | "event";
export const products = [
  { id: "pot", name: "Bình gốm", village: "Bát Tràng", hint: "Nặn đất, tạo dáng rồi nung qua lửa.", color: "#dce9f3" },
  { id: "silk", name: "Khăn lụa", village: "Vạn Phúc", hint: "Từng sợi tơ dệt nên một tấm vải mềm mại.", color: "#f4dfe2" },
  { id: "basket", name: "Giỏ mây", village: "Phú Vinh", hint: "Những nan mây đan vào nhau dưới đôi tay người thợ.", color: "#eee3c9" },
  { id: "fan", name: "Quạt giấy", village: "Chàng Sơn", hint: "Nan tre và giấy mở ra một làn gió mát.", color: "#e5ebd9" },
  { id: "hat", name: "Nón lá", village: "làng Chuông", hint: "Lá được khâu trên những vòng tre, che nắng che mưa.", color: "#f4eaca" },
] as const;
export type ProductId = typeof products[number]["id"];
export const rules = { online: { count: 5, target: 4, duration: 60_000, patience: 12_000 }, event: { count: 3, target: 3, duration: 0, patience: 0 } };
export type Answer = { product: ProductId; selected: ProductId | null; correct: boolean; points: number };
export type State = { phase: "ready" | "playing" | "feedback" | "result"; mode: Mode; orders: ProductId[]; index: number; selected: ProductId | null; score: number; combo: number; answers: Answer[]; end: number; customerEnd: number; now: number };
export type Action = { type: "start"; orders: ProductId[]; now: number } | { type: "select"; id: ProductId } | { type: "tick" | "deliver" | "next"; now: number } | { type: "reset" };
export function initialState(mode: Mode): State { return { phase: "ready", mode, orders: [], index: 0, selected: null, score: 0, combo: 0, answers: [], end: 0, customerEnd: 0, now: 0 }; }
export function shuffledOrders(mode: Mode): ProductId[] {
  const ids: ProductId[] = products.map(p => p.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, rules[mode].count);
}
function answer(s: State, selected: ProductId | null): State {
  const correct = selected === s.orders[s.index];
  const combo = correct ? s.combo + 1 : 0;
  const points = correct ? 20 + Math.min(combo - 1, 4) * 10 : 0;
  const answers = [...s.answers, { product: s.orders[s.index], selected, correct, points }];
  return { ...s, selected, answers, combo, score: s.score + points, phase: answers.length === s.orders.length ? "result" : "feedback" };
}
export function reducer(s: State, a: Action): State {
  if (a.type === "reset") return initialState(s.mode);
  if (a.type === "start") {
    if (s.phase !== "ready" || a.orders.length !== rules[s.mode].count) return s;
    return { ...initialState(s.mode), phase: "playing", orders: a.orders, now: a.now, end: a.now + rules[s.mode].duration, customerEnd: a.now + rules[s.mode].patience };
  }
  if (s.phase === "ready" || s.phase === "result") return s;
  if (a.type === "select") return s.phase === "playing" ? { ...s, selected: a.id } : s;
  const current = { ...s, now: a.now };
  if (s.mode === "online" && a.now >= s.end) return { ...current, phase: "result" };
  if (s.phase === "playing" && s.mode === "online" && a.now >= s.customerEnd) return answer(current, null);
  if (a.type === "deliver" && s.phase === "playing" && s.selected) return answer(current, s.selected);
  if (a.type === "next" && s.phase === "feedback") return { ...current, phase: "playing", index: s.index + 1, selected: null, customerEnd: a.now + rules[s.mode].patience };
  return current;
}
