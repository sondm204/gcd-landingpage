export const MAX_WORDS = 20;
export const frames = [
  { id: "roots", name: "Cội nguồn", paper: "#f7f1e2", ink: "#244e42", accent: "#b88139" },
  { id: "vermilion", name: "Sắc Việt", paper: "#fff3e5", ink: "#8b302b", accent: "#bd8b44" },
  { id: "horizon", name: "Vươn xa", paper: "#edf4fa", ink: "#153d68", accent: "#9c753a" },
] as const;
export type Draft = { place: number; frame: string; message: string; sender: string };
export const initialDraft: Draft = { place: 0, frame: "roots", message: "", sender: "" };
export function wordCount(text: string) { return (text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length; }
export function validMessage(text: string) { const count = wordCount(text); return count > 0 && count <= MAX_WORDS && text.trim().length <= 240; }
export function restoreDraft(value: string | null, placeCount: number): Draft {
  try {
    const d = JSON.parse(value || "null");
    if (!d || !Number.isInteger(d.place) || d.place < 0 || d.place >= placeCount || !frames.some(f => f.id === d.frame) || typeof d.message !== "string" || typeof d.sender !== "string") return { ...initialDraft };
    return { place: d.place, frame: d.frame, message: d.message.slice(0, 240), sender: d.sender.slice(0, 40) };
  } catch { return { ...initialDraft }; }
}
