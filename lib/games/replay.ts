import { z } from "zod";
import * as craft from "@/app/game/craft-shop/engine";
import * as print from "@/app/game/dong-ho/engine";
import * as rhythm from "@/app/game/rhythm/engine";
import * as place from "@/app/game/place/engine";
import { frames, validMessage } from "@/app/game/postcard/model";
import type { Attempt } from "./types";
import { GameError } from "./server";

const time = z.number().finite().min(0).max(6 * 3600000);
const seed = z.number().int().min(0).max(4294967295);
const id = z.number().int().min(0).max(100000);
const product = z.enum(["pot", "silk", "basket", "fan", "hat", "dragonfly"]);
const craftAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), now: time, seed, orders: z.array(z.object({ id, items: z.array(product).min(2).max(3) }).strict()).length(3) }).strict(),
  z.object({ type: z.literal("select"), now: time, id: product }).strict(),
  z.object({ type: z.literal("remove"), now: time, index: z.number().int().min(0).max(2) }).strict(),
  ...["tick", "deliver", "clear"].map(type => z.object({ type: z.literal(type), now: time }).strict()),
]);
const printAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), now: time, seed }).strict(),
  z.object({ type: z.literal("select"), now: time, id }).strict(),
  z.object({ type: z.literal("place"), now: time, id, row: z.number().int().min(-10).max(16), col: z.number().int().min(-10).max(16) }).strict(),
  ...["finish", "tick"].map(type => z.object({ type: z.literal(type), now: time }).strict()),
]);
const rhythmAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start") }).strict(),
  ...["pause", "resume"].map(type => z.object({ type: z.literal(type) }).strict()),
  z.object({ type: z.literal("tick"), elapsed: z.number().finite().min(-3000).max(61000) }).strict(),
  ...["hit", "release"].map(type => z.object({ type: z.literal(type), elapsed: z.number().finite().min(-3000).max(61000), lane: z.number().int().min(0).max(3) }).strict()),
]);
const placeAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), seed }).strict(),
  z.object({ type: z.literal("next") }).strict(),
  ...["loaded", "tick", "submit", "pause", "resume"].map(type => z.object({ type: z.literal(type), now: time }).strict()),
  z.object({ type: z.literal("pin"), now: time, point: z.object({ lat: z.number().finite().min(7).max(24), lon: z.number().finite().min(101).max(118) }).strict() }).strict(),
]);
export function replayResult(attempt: Attempt, input: unknown, wallTime: number) {
  const invalid = () => new GameError(400, "Dữ liệu lượt chơi không hợp lệ. Không thể ghi nhận điểm.");
  if (attempt.game === "postcard") {
    const parsed = z.object({ place: z.number().int().min(0).max(place.places.length - 1), frame: z.string(), message: z.string().max(240), sender: z.string().max(40) }).strict().safeParse(input);
    if (!parsed.success || !validMessage(parsed.data.message) || !frames.some(f => f.id === parsed.data.frame)) throw new GameError(400, "Kiểm tra lời thư (1–20 từ) và khung thiệp trước khi gửi.");
    return { score: 100, result: { place_id: place.places[parsed.data.place].id, ...parsed.data, message: parsed.data.message.trim() } };
  }
  const schema = { craft: craftAction, print: printAction, rhythm: rhythmAction, place: placeAction }[attempt.game];
  const parsed = z.array(schema).min(2).max(20000).safeParse(input);
  if (!parsed.success) throw invalid();
  const actions = parsed.data as Record<string, unknown>[];
  if (actions[0].type !== "start" || actions.slice(1).some(a => a.type === "start")) throw invalid();
  if (attempt.game !== "rhythm" && actions[0].seed !== attempt.seed) throw invalid();
  let last = attempt.game === "rhythm" ? -3000 : 0;
  for (const action of actions) {
    const at = (action.now ?? action.elapsed) as number | undefined;
    if (at !== undefined) {
      if (at < last || at > wallTime + 1500) throw invalid();
      last = at;
    }
  }
  if (attempt.game === "craft") {
    if (actions[0].now !== 0 || JSON.stringify(actions[0].orders) !== JSON.stringify(craft.shuffledOrders(attempt.seed))) throw invalid();
    const state = (actions as craft.Action[]).reduce(craft.reducer, craft.initialState(attempt.mode));
    if (state.phase !== "result") throw invalid();
    return { score: state.score, result: { delivered: state.answers.filter(a => a.correct).length, left: state.answers.filter(a => a.points < 0).length } };
  }
  if (attempt.game === "print") {
    if (actions[0].now !== 0) throw invalid();
    const state = (actions as print.Action[]).reduce(print.reducer, print.initialState());
    if (state.phase !== "result") throw invalid();
    return { score: state.score, result: { layers: state.layers, moves: state.moves } };
  }
  if (attempt.game === "rhythm") {
    if (last + 3000 > wallTime + 1500) throw invalid();
    const state = (actions as rhythm.Action[]).reduce(rhythm.reducer, rhythm.initialState());
    if (state.phase !== "result") throw invalid();
    return { score: state.score, result: { hits: state.judgments.filter(j => j === "perfect" || j === "good").length, combo: state.maxCombo } };
  }
  const state = (actions as place.Action[]).reduce(place.reducer, place.initialState(attempt.mode === "event"));
  if (state.phase !== "result") throw invalid();
  return { score: state.results.reduce((sum, r) => sum + r.score, 0), result: { close: state.results.filter(r => r.close).length, rounds: state.results } };
}
