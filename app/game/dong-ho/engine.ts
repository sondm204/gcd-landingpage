export const SIZE = 8;
export const MAX_LAYERS = 20;
export const DURATION = 180_000;
export const inks = ["#d8a53c", "#b74b35", "#4e785c", "#272c32"];
export function inkForLayers(layers: number) { return inks[Math.min(3, Math.floor(layers / 5))]; }
export const shapes = [
  [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]],
] as const;
export type Piece = { id: number; shape: number };
export type State = { phase: "ready" | "playing" | "result"; board: number[]; pieces: Piece[]; selected: number | null; layers: number; score: number; seed: number; serial: number; cleared: number[]; moves: number; message: string; end: number; now: number };
export type Action = ({ type: "start"; seed: number } | { type: "select"; id: number } | { type: "place"; row: number; col: number; id: number } | { type: "reset" } | { type: "finish" } | { type: "tick" }) & { now?: number };
export function initialState(): State { return { phase: "ready", board: Array(64).fill(0), pieces: [], selected: null, layers: 0, score: 0, seed: 1, serial: 0, cleared: [], moves: 0, message: "", end: 0, now: 0 }; }
export function fits(board: number[], shape: number, row: number, col: number): boolean {
  return Number.isInteger(row) && Number.isInteger(col) && shapes[shape].every(([x, y]) => row + y >= 0 && row + y < SIZE && col + x >= 0 && col + x < SIZE && board[(row + y) * SIZE + col + x] === 0);
}
export function hasMove(board: number[], pieces: Piece[]): boolean { return pieces.some(p => board.some((_, i) => fits(board, p.shape, Math.floor(i / SIZE), i % SIZE))); }
export function previewCells(shape: number, row: number, col: number): number[] {
  // Clip in two dimensions BEFORE flattening; col 8 must never become next row's col 0.
  return shapes[shape].flatMap(([x, y]) => {
    const r = row + y, c = col + x;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? [r * SIZE + c] : [];
  });
}
export function completedLines(board: number[]) {
  const rows = Array.from({ length: SIZE }, (_, row) => row).filter(row => board.slice(row * SIZE, row * SIZE + SIZE).every(Boolean));
  const cols = Array.from({ length: SIZE }, (_, col) => col).filter(col => Array.from({ length: SIZE }, (_, row) => board[row * SIZE + col]).every(Boolean));
  return { rows, cols, cells: board.flatMap((_, i) => rows.includes(Math.floor(i / SIZE)) || cols.includes(i % SIZE) ? [i] : []) };
}
function deal(s: State): State {
  let seed = s.seed;
  const pieces = Array.from({ length: 3 }, (_, index) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { id: s.serial + index + 1, shape: Math.floor(seed / 4294967296 * shapes.length) };
  });
  return { ...s, seed, pieces, serial: s.serial + 3, selected: null };
}
export function reducer(s: State, a: Action): State {
  if (a.type === "reset") return initialState();
  if (a.type === "start") return s.phase === "ready" ? { ...deal({ ...initialState(), seed: a.seed >>> 0 }), now: a.now ?? 0, end: (a.now ?? 0) + DURATION, phase: "playing", message: "Chọn khối rồi chạm ô đặt, hoặc kéo lên ván." } : s;
  if (s.phase !== "playing") return s;
  s = { ...s, now: a.now ?? s.now };
  if (s.now >= s.end) return { ...s, phase: "result", selected: null, message: "Hết 3 phút! Đây là bức tranh bạn đã mở được." };
  if (a.type === "tick") return s;
  if (a.type === "finish") return s.layers >= 1 ? { ...s, phase: "result" } : s;
  if (a.type === "select") return s.pieces.some(p => p.id === a.id) ? { ...s, selected: a.id } : s;
  const piece = s.pieces.find(p => p.id === a.id);
  if (!piece || !fits(s.board, piece.shape, a.row, a.col)) return { ...s, message: "Khối chưa vừa: chọn vùng trống đủ chỗ, không chồng lên mực cũ." };
  const board = [...s.board];
  shapes[piece.shape].forEach(([x, y]) => { board[(a.row + y) * SIZE + a.col + x] = Math.min(4, Math.floor(s.layers / 5) + 1); });
  // Detect both axes before clearing; a crossing row/column counts as two lines.
  const { rows, cols, cells: cleared } = completedLines(board);
  cleared.forEach(i => { board[i] = 0; });
  const layers = Math.min(MAX_LAYERS, s.layers + rows.length + cols.length);
  let next: State = { ...s, board, layers, selected: null, pieces: s.pieces.filter(p => p.id !== piece.id), cleared, moves: s.moves + 1,
    score: layers * 10,
    message: cleared.length ? `In thêm ${layers - s.layers} lớp! Bức tranh đã mở ${layers}/${MAX_LAYERS} phần.` : "Đã đặt khối. Lấp đầy hàng hoặc cột để mở tranh." };
  if (layers >= MAX_LAYERS) return { ...next, phase: "result", message: "Đã mở đủ 20 phần của bức tranh!" };
  if (!next.pieces.length) next = deal(next);
  if (!hasMove(next.board, next.pieces)) return { ...next, phase: "result", message: "Ván đã hết chỗ cho các khối còn lại." };
  return next;
}
