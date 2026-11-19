import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, reducer, shuffledOrders, products } from "../app/game/craft-shop/engine.ts";
const orders = [{ id: 1, items: ["pot", "silk"] }, { id: 2, items: ["hat", "hat", "fan"] }, { id: 3, items: ["basket", "dragonfly"] }];
const start = (mode = "online") => reducer(initialState(mode), { type: "start", orders, now: 1000, seed: 1234 });
const pack = (s, items, now = 2000) => items.reduce((s, id) => reducer(s, { type: "select", id, now }), s);
const deliver = (s, items, now = 2000) => reducer(pack(s, items, now), { type: "deliver", now });

test("unlimited customers replenish after every delivery; all orders award exactly ten points", () => {
  for (const mode of ["online", "event"]) {
    let s = start(mode);
    for (let i = 0; i < 100; i++) {
      const customer = s.customers[i % 3];
      s = deliver(s, customer.items);
      assert.equal(s.phase, "playing"); assert.equal(s.customers.length, 3);
      assert.equal(s.score, (i + 1) * 10); assert.equal(s.answers.at(-1).points, 10);
      const duplicate = reducer(s, { type: "deliver", now: 2000 });
      assert.equal(duplicate.score, s.score); assert.equal(duplicate.answers.length, s.answers.length);
    }
    assert.equal(s.combo, 100);
    s = reducer(s, { type: "tick", now: 61000 });
    assert.equal(s.phase, "result"); assert.equal(s.score, 1000);
    assert.equal(s.answers.filter(a => a.correct).length, 100);
  }
});
test("wrong sequence, missing/extra items retain tray and reset streak without changing score", () => {
  for (const items of [["silk", "pot"], ["pot"], ["pot", "silk", "fan"]]) {
    let s = deliver(start(), ["hat", "hat", "fan"]);
    s = deliver(s, items);
    assert.equal(s.notice.kind, "wrong"); assert.equal(s.answers.length, 1);
    assert.equal(s.score, 10); assert.equal(s.combo, 0); assert.deepEqual(s.tray, items);
  }
});
test("tray supports repeated items, removal, clear and three-item limit", () => {
  let s = pack(start(), ["hat", "hat", "fan", "pot"]);
  assert.deepEqual(s.tray, ["hat", "hat", "fan"]);
  s = reducer(s, { type: "remove", index: 1, now: 2000 }); assert.deepEqual(s.tray, ["hat", "fan"]);
  s = reducer(s, { type: "clear", now: 2000 }); assert.deepEqual(s.tray, []);
});
test("expired customers are replaced; independent timers and late clicks respect deadline", () => {
  let s = reducer(pack(start(), ["pot", "silk"]), { type: "deliver", now: 25000 });
  assert.equal(s.answers[0].id, 1); assert.equal(s.answers[0].correct, false); assert.equal(s.score, 0);
  assert.equal(s.customers.find(c => c.id === 2).expiresAt, 28000);
  assert(s.customers.some(c => c.id === 4));
  s = reducer(start(), { type: "tick", now: 32000 });
  assert.equal(s.answers.length, 3); assert.equal(s.customers.length, 3);
  assert(s.customers.every(c => c.expiresAt === 47000));
  s = reducer(s, { type: "tick", now: 32000 }); assert.equal(s.answers.length, 3);
});
test("round ends only at 60 seconds, records pending once, blocks late clicks and resets", () => {
  for (const mode of ["event", "online"]) {
    let s = start(mode); assert.equal(s.end, 61000);
    s = reducer(s, { type: "select", id: "pot", now: 61000 });
    assert.equal(s.phase, "result"); assert.equal(s.score, 0); assert.equal(s.answers.length, 3);
    assert.deepEqual(reducer(s, { type: "deliver", now: 61001 }), s);
    assert.deepEqual(reducer(s, { type: "reset" }), initialState(mode));
  }
});
test("replacement generation is deterministic and avoids identical active orders", () => {
  const state = pack(start(), orders[0].items);
  assert.deepEqual(reducer(state, { type: "deliver", now: 2000 }), reducer(state, { type: "deliver", now: 2000 }));
  let s = start();
  for (let i = 0; i < 100; i++) {
    s = deliver(s, s.customers[0].items);
    assert.equal(new Set(s.customers.map(c => c.items.join(","))).size, 3);
  }
});
test("six products, valid opening orders and new item can be delivered", () => {
  assert.equal(products.length, 6);
  assert.equal(deliver(start(), ["basket", "dragonfly"]).score, 10);
  for (let i = 0; i < 30; i++) {
    const orders = shuffledOrders(); assert.equal(orders.length, 3);
    assert.equal(new Set(orders.map(o => o.items.join(","))).size, 3);
    assert(orders.every(o => o.items.length >= 2 && o.items.length <= 3 && o.items.every(id => products.some(p => p.id === id))));
  }
});
