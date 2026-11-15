import { test } from "node:test";
import assert from "node:assert/strict";
import { CLOSE_KM, MAX_SCORE, ROUND_COUNT, ROUND_TIME, requiredClose, distanceKm, initialState, places, pointsForDistance, project, reducer, roundOrder, unproject, validPoint } from "../app/game/place/engine.ts";
const start = (event = false) => reducer(initialState(event), { type: "start", seed: 12345 });
const loaded = (event = false) => reducer(start(event), { type: "loaded", now: 1000 });

test("coordinates round-trip through the exact map projection and reject invalid pins", () => {
  for (const p of places.map(p => p.point).concat([{ lat: 16.5, lon: 112 }, { lat: 10, lon: 114 }])) {
    const projected = project(p), back = unproject(projected.x, projected.y);
    assert(Math.abs(back.lat - p.lat) < 1e-10); assert(Math.abs(back.lon - p.lon) < 1e-10); assert(validPoint(p));
  }
  for (const p of [{ lat: NaN, lon: 108 }, { lat: 16, lon: Infinity }, { lat: 25, lon: 108 }, { lat: 16, lon: 120 }]) assert(!validPoint(p));
});
test("Haversine distances are accurate and scores decrease with distance", () => {
  const a = { lat: 21.0285, lon: 105.8542 }, b = { lat: 10.7769, lon: 106.7009 };
  assert.equal(distanceKm(a, a), 0); assert(Math.abs(distanceKm(a, b) - 1140) < 5); assert.equal(distanceKm(a, b), distanceKm(b, a));
  assert.equal(pointsForDistance(0), 30); assert(pointsForDistance(50) > pointsForDistance(100)); assert.equal(pointsForDistance(10000), 0);
});
test("rounds shuffle reproducibly without repeats; online has ten and event has two", () => {
  assert.deepEqual(roundOrder(7, false), roundOrder(7, false));
  assert.equal(new Set(roundOrder(7, false)).size, 10); assert.equal(roundOrder(7, true).length, 2);
  assert(new Set(Array.from({ length: 20 }, (_, seed) => roundOrder(seed, false).join())).size > 1);
});
test("loading images never consumes the 20-second timer; duplicate loads cannot restart it", () => {
  let s = start(); assert.equal(s.phase, "loading");
  assert.deepEqual(reducer(s, { type: "tick", now: 99999 }), s);
  s = reducer(s, { type: "loaded", now: 40000 }); assert.equal(s.deadline, 40000 + ROUND_TIME);
  assert.deepEqual(reducer(s, { type: "loaded", now: 45000 }), s);
});
test("pin remains editable until submission; double submission and pin changes after review do nothing", () => {
  let s = loaded(); const actual = places[s.order[0]].point;
  s = reducer(s, { type: "pin", point: { lat: 9, lon: 103 }, now: 2000 });
  s = reducer(s, { type: "pin", point: actual, now: 3000 });
  s = reducer(s, { type: "submit", now: 4000 }); assert.equal(s.phase, "review"); assert.equal(s.results[0].score, 30); assert(s.results[0].close);
  assert.deepEqual(reducer(s, { type: "submit", now: 4500 }), s);
  assert.deepEqual(reducer(s, { type: "pin", point: { lat: 10, lon: 107 }, now: 4500 }), s);
});
test("timeout submits only the last pin before the deadline and grades each round once", () => {
  let s = loaded(); const actual = places[s.order[0]].point;
  s = reducer(s, { type: "pin", point: actual, now: 2000 });
  s = reducer(s, { type: "pin", point: { lat: 10, lon: 103 }, now: s.deadline });
  assert.equal(s.phase, "review"); assert.equal(s.results[0].score, 30); assert(s.results[0].timedOut);
  assert.deepEqual(reducer(s, { type: "tick", now: 99999 }), s);
  s = reducer(loaded(), { type: "tick", now: 1000 + ROUND_TIME }); assert.equal(s.results[0].distance, null); assert.equal(s.results[0].score, 0);
});
test("no pin or invalid pin cannot be submitted; close means strictly below 100 km", () => {
  let s = loaded(); s = reducer(s, { type: "submit", now: 2000 }); assert.equal(s.phase, "playing");
  s = reducer(s, { type: "pin", point: { lat: NaN, lon: 0 }, now: 2000 }); assert.equal(s.pin, null);
  for (const km of [99.9, 100.1]) {
    s = loaded(); const actual = places[s.order[0]].point;
    const point = { lon: actual.lon, lat: actual.lat + km / 6371.0088 * 180 / Math.PI };
    s = reducer(s, { type: "pin", point, now: 2000 }); s = reducer(s, { type: "submit", now: 3000 });
    assert.equal(s.results[0].close, km < CLOSE_KM);
  }
});
test("pause freezes time and input, resume preserves remaining time and the pin", () => {
  let s = loaded(); s = reducer(s, { type: "pin", point: places[0].point, now: 2000 });
  s = reducer(s, { type: "pause", now: 5000 }); assert.equal(s.remaining, 16000);
  assert.deepEqual(reducer(s, { type: "tick", now: 90000 }), s);
  assert.deepEqual(reducer(s, { type: "submit", now: 90000 }), s);
  s = reducer(s, { type: "resume", now: 90000 }); assert.equal(s.deadline, 106000); assert.deepEqual(s.pin, places[0].point);
  s = reducer(s, { type: "tick", now: 105999 }); assert.equal(s.phase, "playing");
  s = reducer(s, { type: "tick", now: 106000 }); assert.equal(s.phase, "review");
});
test("round transitions clear pins, yield the expected result count, and reset cleanly", () => {
  for (const event of [false, true]) {
    let s = start(event), now = 0;
    while (s.phase !== "result") {
      s = reducer(s, { type: "loaded", now }); assert.equal(s.pin, null);
      s = reducer(s, { type: "pin", point: places[s.order[s.round]].point, now: now + 1 });
      s = reducer(s, { type: "submit", now: now + 2 }); s = reducer(s, { type: "next" }); now += 1000;
    }
    assert.equal(s.results.length, event ? 2 : 10); assert.equal(s.results.reduce((sum, r) => sum + r.score, 0), event ? 60 : 300);
    assert.deepEqual(reducer(s, { type: "reset" }), initialState(event));
  }
});

test("ten local photos span all three regions and scores never exceed 30", () => {
  assert.equal(places.length, 10); assert.equal(ROUND_COUNT, 10); assert.equal(MAX_SCORE, 30);
  assert.equal(new Set(places.map(p => p.id)).size, 10);
  const counts = Object.values(places.reduce((a,p) => ({...a,[p.region]:(a[p.region] ?? 0)+1}), {})).sort();
  assert.deepEqual(counts, [3,3,4]);
  for(const p of places) assert(validPoint(p.point));
  for(let km=0;km<=2000;km++) assert(pointsForDistance(km)>=0 && pointsForDistance(km)<=30);
  assert.equal(requiredClose(false), 7); assert.equal(requiredClose(true), 1);
});
