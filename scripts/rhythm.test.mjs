import { test } from "node:test";
import assert from "node:assert/strict";
import { DURATION, MAX_SCORE, unitsForNote, unitsForStreak, scoreFromUnits, GOOD, HOLD_RELEASE, beatInterval, beats, travelTime, noteIsVisible, initialState, notes, reducer } from "../app/game/rhythm/engine.ts";
const start = () => reducer(initialState(), { type: "start" });
const isolated = (note, scoreUnits = 4000) => ({ ...start(), scoreUnits, score: scoreFromUnits(scoreUnits), judgments: notes.map(n => n.id === note.id ? null : "miss") });
const hold = notes.find(n => n.duration > 0);
const tap = notes[0];
test("successive notes earn more and mistakes reset the streak bonus", () => {
  const seed = () => ({ ...start(), judgments: notes.map(n => n.id < 4 ? null : "miss") });
  const hit = (s, n) => reducer(reducer(s, { type: "hit", lane: n.lane, elapsed: n.at }), { type: "release", lane: n.lane, elapsed: n.at + 1 });
  let s = hit(seed(), notes[0]); const first = s.scoreUnits;
  s = hit(s, notes[1]); assert(s.scoreUnits - first > first); assert.equal(s.combo, 2);
  const uninterrupted = hit(s, notes[2]);
  let broken = reducer(s, { type: "hit", lane: 3, elapsed: notes[1].at + 200 });
  assert.equal(broken.combo, 0); assert.equal(broken.maxCombo, 2);
  const previous = broken.scoreUnits; broken = hit(broken, notes[2]);
  assert.equal(broken.scoreUnits - previous, unitsForNote(1)); assert.equal(broken.combo, 1);
  assert(uninterrupted.scoreUnits > broken.scoreUnits);
  let missed = reducer(s, { type: "tick", elapsed: notes[2].at + GOOD + 1 });
  assert.equal(missed.combo, 0); missed = hit(missed, notes[3]); assert.equal(missed.combo, 1);
});
const perfectActions = notes.flatMap(n => [
  { type: "hit", lane: n.lane, elapsed: n.at },
  { type: "release", lane: n.lane, elapsed: n.at + (n.duration || 1) }
]).sort((a, b) => a.elapsed - b.elapsed);

test("60-second deterministic chart speeds up and has safe long notes", () => {
  assert.equal(DURATION, 60000);
  assert.equal(new Set(notes.map(n => n.id)).size, notes.length);
  assert(notes.every(n => Number.isInteger(n.lane) && n.lane >= 0 && n.lane <= 3 && n.at > 0 && n.at + n.duration + GOOD < DURATION));
  assert(notes.filter(n => n.duration).length >= 10);
  const lastTap = notes.findLastIndex((n, i) => i < notes.length - 1 && !n.duration);
  assert(notes[lastTap + 1].at - notes[lastTap].at < notes[1].at - notes[0].at);
  assert(beatInterval(50000) < beatInterval(10000));
  assert(travelTime(50000) < travelTime(10000));
  notes.filter(n => n.duration).forEach(n => {
    const next = notes.find(other => other.id > n.id && other.lane === n.lane);
    assert(!next || n.at + n.duration + GOOD <= next.at);
  });
});

test("following notes remain visible behind the long tail, with time to switch buttons", () => {
  for (const n of notes.filter(n => n.duration)) {
    const next = notes[n.id + 1];
    if (!next) continue;
    const end = n.at + n.duration;
    assert(next.at - GOOD >= end + 120);
    assert(next.at - end < travelTime(end));
    for (const elapsed of [n.at, n.at + n.duration / 2, end - 1]) {
      const tail = 80 - (end - elapsed) / travelTime(elapsed) * 80;
      assert(notes.filter(other => other.id > n.id).every(other => 80 - (other.at - elapsed) / travelTime(elapsed) * 80 < tail));
    }
    // The beat continues under the hold/rest, and playable notes stay on that grid.
    assert(beats.some(at => at > n.at && at < next.at));
    assert(beats.includes(next.at));
    let s = reducer(isolated(n), { type: "hit", lane: n.lane, elapsed: n.at });
    s = reducer(s, { type: "tick", elapsed: end });
    assert.equal(s.score, scoreFromUnits(4100));
  }
});

test("perfect run scores exactly 300 points, including holds and increasing streak bonuses", () => {
  let s = start();
  for (const a of perfectActions) s = reducer(s, a);
  assert.equal(s.combo, notes.length);
  assert.equal(s.maxCombo, notes.length);
  assert.equal(s.score, MAX_SCORE);
  assert.equal(s.phase, "playing");
  s = reducer(s, { type: "tick", elapsed: DURATION });
  assert.equal(s.phase, "result");
  assert(s.judgments.every(j => j === "perfect"));
  assert.deepEqual(reducer(s, { type: "hit", lane: 0, elapsed: DURATION + 10 }), s);
});

test("visible notes can be pressed early without aiming for a hit line", () => {
  for (const offset of [-1200, -500, -160, -75, 75, 160]) {
    const s = reducer(isolated(tap), { type: "hit", lane: tap.lane, elapsed: tap.at + offset });
    assert.equal(s.judgments[tap.id], "perfect");
    assert.equal(s.score, scoreFromUnits(4100));
  }
});

test("each missed note costs half a note exactly once, score never drops below zero", () => {
  let s = reducer(isolated(tap), { type: "tick", elapsed: tap.at + GOOD + 1 });
  assert.equal(s.score, scoreFromUnits(3950)); assert.equal(s.combo, 0);
  s = reducer(s, { type: "tick", elapsed: DURATION }); assert.equal(s.score, scoreFromUnits(3950));
  s = reducer(start(), { type: "tick", elapsed: DURATION });
  assert.equal(s.score, 0); assert(s.judgments.every(j => j === "miss"));
});

test("only the earliest unfinished visible note can be pressed, including during holds", () => {
  const elapsed = 500;
  assert(noteIsVisible(notes[0], elapsed) && noteIsVisible(notes[1], elapsed));
  let s = reducer(start(), { type: "hit", lane: notes[1].lane, elapsed });
  assert.equal(s.wrong, 1);
  assert.equal(s.judgments[1], null);
  s = reducer(s, { type: "release", lane: notes[1].lane, elapsed });
  s = reducer(s, { type: "hit", lane: notes[0].lane, elapsed });
  s = reducer(s, { type: "release", lane: notes[0].lane, elapsed });
  s = reducer(s, { type: "hit", lane: notes[1].lane, elapsed: elapsed + 121 });
  assert.equal(s.combo, 2);
  assert.equal(s.judgments[1], "perfect");

  s = reducer(isolated(hold), { type: "hit", lane: hold.lane, elapsed: hold.at - 500 });
  assert.equal(s.holds[hold.lane]?.noteId, hold.id);
  s = { ...s, judgments: s.judgments.map((j, id) => id === hold.id + 1 ? null : j) };
  s = reducer(s, { type: "hit", lane: notes[hold.id + 1].lane, elapsed: hold.at + hold.duration - 100 });
  assert.equal(s.wrong, 1);
  assert.equal(s.judgments[hold.id + 1], null);
});

test("normalized score stays in 0–300, accumulates without per-note rounding, and penalizes partial runs", () => {
  assert.equal(scoreFromUnits(-5), 0);
  assert.equal(scoreFromUnits(unitsForStreak(notes.length) * 2), 300);
  let s = start();
  for (const a of perfectActions) {
    s = reducer(s, a);
    assert(s.score >= 0 && s.score <= 300);
  }
  assert.equal(s.scoreUnits, unitsForStreak(notes.length));
  assert.equal(s.score, 300);
  let partial = start();
  for (const a of perfectActions.filter(a => a.elapsed >= notes[1].at)) partial = reducer(partial, a);
  assert(partial.score < 300);
  assert(partial.judgments.includes("miss"));
});

test("hold head gives no points until completion; repeated down/tick cannot rescore", () => {
  let s = reducer(isolated(hold), { type: "hit", lane: hold.lane, elapsed: hold.at });
  assert.equal(s.score, scoreFromUnits(4000)); assert.equal(s.judgments[hold.id], null);
  s = reducer(s, { type: "hit", lane: hold.lane, elapsed: hold.at + 50 });
  s = reducer(s, { type: "tick", elapsed: hold.at + hold.duration });
  assert.equal(s.score, scoreFromUnits(4100)); assert.equal(s.judgments[hold.id], "perfect");
  s = reducer(s, { type: "release", lane: hold.lane, elapsed: hold.at + hold.duration + 1 });
  s = reducer(s, { type: "tick", elapsed: DURATION }); assert.equal(s.score, scoreFromUnits(4100));
});

test("releasing early fails a long note once; release tolerance has an explicit boundary", () => {
  for (const [offset, grade, score] of [[HOLD_RELEASE, "perfect", scoreFromUnits(4100)], [HOLD_RELEASE + 1, "miss", scoreFromUnits(3950)], [hold.duration - 1, "miss", scoreFromUnits(3950)]]) {
    let s = reducer(isolated(hold), { type: "hit", lane: hold.lane, elapsed: hold.at });
    s = reducer(s, { type: "release", lane: hold.lane, elapsed: hold.at + hold.duration - offset });
    assert.equal(s.judgments[hold.id], grade); assert.equal(s.score, score);
    s = reducer(s, { type: "tick", elapsed: DURATION }); assert.equal(s.score, score);
  }
});

test("holding a lane before a note arrives cannot catch it automatically", () => {
  let s = reducer(isolated(hold), { type: "hit", lane: hold.lane, elapsed: hold.at - 2000 });
  s = reducer(s, { type: "hit", lane: hold.lane, elapsed: hold.at });
  s = reducer(s, { type: "tick", elapsed: hold.at + hold.duration });
  assert.equal(s.judgments[hold.id], "miss"); assert.equal(s.score, scoreFromUnits(3900));
});

test("pause freezes game; active holds must be pressed again after resume", () => {
  let s = reducer(isolated(hold), { type: "hit", lane: hold.lane, elapsed: hold.at });
  s = reducer(s, { type: "tick", elapsed: hold.at + 100 });
  s = reducer(s, { type: "pause" });
  assert.deepEqual(reducer(s, { type: "tick", elapsed: DURATION }), s);
  assert.deepEqual(reducer(s, { type: "hit", lane: hold.lane, elapsed: hold.at + 300 }), s);
  assert.equal(s.pressed[hold.lane], false);
  const resumed = reducer(s, { type: "resume" });
  s = reducer(resumed, { type: "hit", lane: hold.lane, elapsed: resumed.elapsed + 100 });
  s = reducer(s, { type: "tick", elapsed: hold.at + hold.duration });
  assert.equal(s.judgments[hold.id], "perfect"); assert.equal(s.score, scoreFromUnits(4100));
  s = reducer(resumed, { type: "tick", elapsed: hold.at + hold.duration + 1000 });
  assert.equal(s.judgments[hold.id], "miss"); assert.equal(s.score, scoreFromUnits(3950));
});

test("countdown ignores input, reset clears all holds, expiry grades every note", () => {
  let s = reducer(start(), { type: "hit", lane: 0, elapsed: -1000 });
  assert.equal(s.wrong, 0); assert(s.pressed.every(p => !p));
  s = reducer(s, { type: "tick", elapsed: DURATION + 10000 });
  assert.equal(s.elapsed, DURATION); assert(s.judgments.every(j => j === "miss"));
  assert.deepEqual(reducer(s, { type: "reset" }), initialState());
});
