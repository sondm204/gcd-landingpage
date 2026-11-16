export const DURATION = 60000;
export const LEAD_IN = 3000;
export const PERFECT = 75;
export const GOOD = 160;
export const HOLD_RELEASE = 80;
const RESUME_GRACE = 750;
// Both the soundtrack and chart follow this gradual 100 → 200 BPM ramp.
export const beatInterval = (elapsed: number) => 600 - 300 * Math.min(1, Math.max(0, elapsed / DURATION));
export const travelTime = (elapsed: number) => 2200 - 800 * Math.min(1, Math.max(0, elapsed / DURATION));
export type Note = { id: number; lane: number; at: number; duration: number };
const pattern = [0, 1, 2, 1, 3, 2, 0, 3, 1, 0, 2, 3, 2, 1, 3, 0];
export const beats: number[] = [];
for (let at = 1200; at < DURATION; at += beatInterval(at)) beats.push(Math.round(at));
const chart: Note[] = [];
let nextAllowedAt = 0;
for (const at of beats) {
  if (at < nextAllowedAt || at >= DURATION - 1000) continue;
  const id = chart.length;
  const duration = id % 7 === 4 ? Math.floor(Math.min(1200, beatInterval(at) * 2, DURATION - 500 - at)) : 0;
  chart.push({ id, lane: pattern[id % pattern.length], at, duration: duration >= 600 ? duration : 0 });
  if (duration >= 600) {
    const end = at + duration;
    // Following notes still scroll into view behind the tail on every lane.
    // Their earliest valid press must leave time to release and change buttons.
    nextAllowedAt = end + GOOD + 120;
  }
}
export const notes: Note[] = chart;
export const MAX_SCORE = 300;
export const unitsForNote = (streak: number) => 100 + Math.max(0, streak - 1);
export const unitsForStreak = (length: number) => length * (length + 199) / 2;
const MAX_UNITS = unitsForStreak(notes.length);
// Keep integer rhythm units; normalize only the displayed score to avoid rounding drift.
export const scoreFromUnits = (units: number) => Math.round(Math.min(MAX_SCORE, Math.max(0, units) / MAX_UNITS * MAX_SCORE));
export const pointsForNextNote = (streak: number) => unitsForNote(streak + 1) / MAX_UNITS * MAX_SCORE;
function scoring(units: number) { const scoreUnits = Math.max(0, Math.min(MAX_UNITS, units)); return { scoreUnits, score: scoreFromUnits(scoreUnits) }; }
export type Grade = "perfect" | "good" | "miss";
type Hold = { noteId: number; grade: Exclude<Grade, "miss">; resumeUntil: number | null };
export type State = {
  phase: "ready" | "playing" | "paused" | "result";
  elapsed: number; judgments: (Grade | null)[]; holds: (Hold | null)[]; pressed: boolean[];
  score: number; scoreUnits: number; combo: number; maxCombo: number; feedback: string;
  lastLane: number; feedbackId: number; wrong: number; lastInput: number[];
};
export type Action = { type: "start" } | { type: "reset" } | { type: "pause" } | { type: "resume" }
  | { type: "tick"; elapsed: number } | { type: "hit"; lane: number; elapsed: number }
  | { type: "release"; lane: number; elapsed: number };
export function initialState(): State {
  return { phase: "ready", elapsed: -LEAD_IN, judgments: notes.map(() => null), holds: [null, null, null, null], pressed: [false, false, false, false], score: 0, scoreUnits: 0, combo: 0, maxCombo: 0, feedback: "Sẵn sàng bắt nhịp", lastLane: -1, feedbackId: 0, wrong: 0, lastInput: [-9999, -9999, -9999, -9999] };
}
function judge(s: State, id: number, grade: Grade): State {
  if (s.judgments[id] !== null) return s;
  const judgments = [...s.judgments]; judgments[id] = grade;
  const holds = [...s.holds];
  if (holds[notes[id].lane]?.noteId === id) holds[notes[id].lane] = null;
  const combo = grade === "miss" ? 0 : s.combo + 1;
  return { ...s, judgments, holds, combo, maxCombo: Math.max(combo, s.maxCombo), ...scoring(s.scoreUnits + (grade === "miss" ? -50 : unitsForNote(combo))), feedback: grade === "miss" ? "Trượt · Ngắt chuỗi" : grade === "perfect" ? "Tuyệt!" : "Được!", feedbackId: s.feedbackId + 1, lastLane: grade === "miss" ? -1 : notes[id].lane };
}
function advance(s: State, elapsed: number): State {
  let next = { ...s, elapsed: Math.min(DURATION, elapsed) };
  // Resolve chronologically even if a render frame skips several notes.
  const events: { id: number; at: number; grade: Grade }[] = [];
  notes.forEach(note => {
    if (next.judgments[note.id] !== null) return;
    const hold = next.holds[note.lane];
    if (hold?.noteId === note.id) {
      if (next.pressed[note.lane] && elapsed >= note.at + note.duration) events.push({ id: note.id, at: note.at + note.duration, grade: hold.grade });
      else if ((!next.pressed[note.lane] && elapsed > (hold.resumeUntil ?? -Infinity)) || elapsed >= DURATION) events.push({ id: note.id, at: hold.resumeUntil ?? elapsed, grade: "miss" });
    } else if (elapsed > note.at + GOOD || elapsed >= DURATION) events.push({ id: note.id, at: note.at + GOOD, grade: "miss" });
  });
  events.sort((a, b) => a.at - b.at).forEach(e => { next = judge(next, e.id, e.grade); });
  return elapsed >= DURATION ? { ...next, phase: "result", pressed: [false, false, false, false] } : next;
}
export function reducer(s: State, a: Action): State {
  if (a.type === "reset") return initialState();
  if (a.type === "start") return s.phase === "ready" ? { ...initialState(), phase: "playing" } : s;
  if (a.type === "pause") return s.phase === "playing" ? { ...s, phase: "paused", pressed: [false, false, false, false] } : s;
  if (a.type === "resume") return s.phase === "paused" ? { ...s, phase: "playing", holds: s.holds.map(h => h ? { ...h, resumeUntil: s.elapsed + RESUME_GRACE } : null) } : s;
  if (s.phase !== "playing") return s;
  const next = advance(s, Math.max(s.elapsed, a.elapsed));
  if (a.type === "tick" || next.phase !== "playing" || next.elapsed < 0 || !Number.isInteger(a.lane) || a.lane < 0 || a.lane > 3) return next;
  const pressed = [...next.pressed];
  const hold = next.holds[a.lane];
  if (a.type === "release") {
    pressed[a.lane] = false;
    const released = { ...next, pressed };
    return hold ? judge(released, hold.noteId, next.elapsed >= notes[hold.noteId].at + notes[hold.noteId].duration - HOLD_RELEASE ? hold.grade : "miss") : released;
  }
  if (pressed[a.lane]) return next;
  pressed[a.lane] = true;
  if (hold) {
    const holds = [...next.holds]; holds[a.lane] = { ...hold, resumeUntil: null };
    return advance({ ...next, pressed, holds }, next.elapsed);
  }
  if (next.elapsed - next.lastInput[a.lane] < 120) return { ...next, pressed };
  const lastInput = [...next.lastInput]; lastInput[a.lane] = next.elapsed;
  const note = notes.filter(n => n.lane === a.lane && next.judgments[n.id] === null && Math.abs(n.at - next.elapsed) <= GOOD)
    .sort((a1, b) => Math.abs(a1.at - next.elapsed) - Math.abs(b.at - next.elapsed))[0];
  if (!note) return { ...next, pressed, lastInput, wrong: next.wrong + 1, ...scoring(next.scoreUnits - 50), combo: 0, feedback: "Lệch nhịp", feedbackId: next.feedbackId + 1, lastLane: -1 };
  const grade = Math.abs(note.at - next.elapsed) <= PERFECT ? "perfect" : "good";
  if (note.duration) {
    const holds = [...next.holds]; holds[a.lane] = { noteId: note.id, grade, resumeUntil: null };
    return { ...next, pressed, lastInput, holds, feedback: "Giữ đến hết đuôi nốt…", feedbackId: next.feedbackId + 1, lastLane: a.lane };
  }
  return judge({ ...next, pressed, lastInput }, note.id, grade);
}
