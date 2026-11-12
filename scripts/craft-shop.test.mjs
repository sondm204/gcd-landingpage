import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, reducer, shuffledOrders } from "../app/game/craft-shop/engine.ts";
const orders = ["pot", "silk", "basket", "fan", "hat"];
const start = (mode = "online") => reducer(initialState(mode), { type: "start", orders: orders.slice(0, mode === "online" ? 5 : 3), now: 1000 });
const deliver = (s, id, now = 2000) => reducer(reducer(s, { type: "select", id }), { type: "deliver", now });
test("perfect online run scores 200 and duplicate deliveries do not count", () => {
  let s = start();
  for (let i = 0; i < 5; i++) {
    s = deliver(s, orders[i], 2000 + i * 1000);
    assert.deepEqual(reducer(s, { type: "deliver", now: 2000 + i * 1000 }), s);
    if (i < 4) s = reducer(s, { type: "next", now: 2000 + i * 1000 });
  }
  assert.equal(s.score, 200); assert.equal(s.phase, "result"); assert.equal(s.answers.filter(a => a.correct).length, 5);
});
test("wrong item consumes an order and resets combo", () => {
  let s = deliver(start(), "pot");
  s = reducer(s, { type: "next", now: 3000 });
  s = deliver(s, "hat", 4000);
  assert.equal(s.combo, 0); assert.equal(s.score, 20); assert.equal(s.answers.length, 2);
});
test("deadline wins over a late click, including after tab suspension", () => {
  let s = reducer(start(), { type: "select", id: "pot" });
  s = reducer(s, { type: "deliver", now: 13000 });
  assert.equal(s.answers[0].selected, null); assert.equal(s.score, 0);
  s = reducer(s, { type: "tick", now: 61000 });
  assert.equal(s.phase, "result");
});
test("global timer runs during feedback; reset clears the run", () => {
  const s = reducer(deliver(start(), "pot"), { type: "next", now: 61000 });
  assert.equal(s.phase, "result"); assert.equal(s.answers.length, 1);
  assert.deepEqual(reducer(s, { type: "reset" }), initialState("online"));
});
test("event mode has three orders and no invented time limit", () => {
  let s = start("event");
  s = reducer(s, { type: "tick", now: 999999 }); assert.equal(s.phase, "playing");
  for (let i = 0; i < 3; i++) { s = deliver(s, orders[i], 999999 + i); if (i < 2) s = reducer(s, { type: "next", now: 999999 + i }); }
  assert.equal(s.phase, "result"); assert.equal(s.answers.filter(a => a.correct).length, 3);
});
test("shuffled rounds contain unique valid products of the right length", () => {
  for (const mode of ["online", "event"]) { const ids = shuffledOrders(mode); assert.equal(new Set(ids).size, mode === "online" ? 5 : 3); assert.ok(ids.every(id => orders.includes(id))); }
});
