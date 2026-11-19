import { test } from "node:test";
import assert from "node:assert/strict";
import { fits, hasMove, initialState, reducer, previewCells, completedLines, inkForLayers, inks } from "../app/game/dong-ho/engine.ts";
const start = () => reducer(initialState(), { type: "start", seed: 1234 });
test("three-minute deadline closes game and blocks late placements even without timer ticks", () => {
  const s = reducer(initialState(), { type: "start", seed: 1234, now: 1000 });
  assert.equal(s.end, 181000);
  const tick = reducer(s, { type: "tick", now: 180999 }); assert.equal(tick.phase, "playing");
  const timeout = reducer(s, { type: "tick", now: 181000 }); assert.equal(timeout.phase, "result");
  const late = reducer(s, { type: "place", id: s.pieces[0].id, row: 0, col: 0, now: 181001 });
  assert.equal(late.phase, "result"); assert.equal(late.moves, 0); assert.deepEqual(late.board, s.board);
  assert.deepEqual(reducer(timeout, { type: "reset" }), initialState());
});
test("overflow previews clip each axis instead of wrapping to another row", () => {
  assert.deepEqual(previewCells(1, 6, 7), [55]);
  assert.deepEqual(previewCells(1, 3, -1), [24]);
  assert.deepEqual(previewCells(2, 7, 3), [59]);
  assert.deepEqual(previewCells(2, -1, 3), [3]);
});
test("all blocks use the same palette for each five-layer stage", () => {
  for (let i = 0; i <= 20; i++) assert.equal(inkForLayers(i), inks[Math.min(3, Math.floor(i / 5))]);
});
test("projecting crossing lines highlights both without changing the board", () => {
  const board = Array(64).fill(0);
  for (let i = 1; i < 8; i++) { board[i] = 1; board[i * 8] = 1; }
  const projected = [...board]; previewCells(0, 0, 0).forEach(i => projected[i] = 1);
  const result = completedLines(projected);
  assert.deepEqual(result.rows, [0]); assert.deepEqual(result.cols, [0]);
  assert.equal(result.cells.length, 15); assert.equal(board[0], 0);
});
test("column clear, crossing lines counted simultaneously, no cell points", () => {
  let s = start(); s.board = Array(64).fill(0);
  for (let i = 0; i < 7; i++) s.board[i * 8 + 3] = 1;
  s.pieces = [{ id: 1, shape: 0 }, { id: 2, shape: 0 }];
  let n = reducer(s, { type: "place", id: 1, row: 7, col: 3 });
  assert.equal(n.layers, 1); assert.equal(n.score, 10); assert(n.board.every(v => v === 0));
  s = start(); s.board = Array(64).fill(0);
  for (let i = 1; i < 8; i++) { s.board[i] = 1; s.board[i * 8] = 1; }
  s.pieces = [{ id: 1, shape: 0 }, { id: 2, shape: 0 }];
  n = reducer(s, { type: "place", id: 1, row: 0, col: 0 });
  assert.equal(n.layers, 2); assert.equal(n.score, 20); assert.equal(n.cleared.length, 15);
  n = reducer(n, { type: "place", id: 2, row: 2, col: 2 });
  assert.equal(n.score, 20);
});
test("placement checks boundaries, collision and invalid drops do not consume blocks", () => {
  const s = start(), board = Array(64).fill(0); board[0] = 1;
  assert.equal(fits(board, 1, 0, 0), false);
  assert.equal(fits(board, 1, 0, 7), false);
  assert.equal(fits(board, 2, 7, 0), false);
  const next = reducer(s, { type: "place", id: s.pieces[0].id, row: -1, col: 0 });
  assert.deepEqual(next.board, s.board); assert.deepEqual(next.pieces, s.pieces); assert.equal(next.score, 0);
});
test("full horizontal row clears and prints a layer; cells above do not fall", () => {
  const s = start(); s.board = Array(64).fill(0); s.board.fill(1, 0, 7); s.board[16] = 2;
  s.pieces = [{ id: 1, shape: 0 }, { id: 2, shape: 1 }];
  const n = reducer(s, { type: "place", id: 1, row: 0, col: 7 });
  assert.equal(n.layers, 1); assert.equal(n.score, 10); assert.deepEqual(n.board.slice(0, 8), Array(8).fill(0)); assert.equal(n.board[16], 2);
});
test("simultaneous row clear counts both and twenty layers ends run", () => {
  const s = start(); s.board.fill(1, 0, 16); s.board[7] = s.board[15] = 0; s.layers = 18; s.score = 180;
  s.pieces = [{ id: 1, shape: 2 }];
  const n = reducer(s, { type: "place", id: 1, row: 0, col: 7 });
  assert.equal(n.layers, 20); assert.equal(n.phase, "result"); assert.equal(n.score, 200);
  assert.deepEqual(reducer(n, { type: "place", id: 1, row: 1, col: 1 }), n);
});
test("tray refills only after three pieces; seeded generation is repeatable", () => {
  let s = start(); s.pieces = [{ id: 1, shape: 0 }]; s.serial = 3;
  const n = reducer(s, { type: "place", id: 1, row: 0, col: 0 });
  assert.equal(n.pieces.length, 3); assert(n.pieces.every(p => p.id > 3));
  assert.deepEqual(n, reducer(s, { type: "place", id: 1, row: 0, col: 0 }));
  assert.equal(n.moves, 1);
});
test("game over when none fit; blocked board has no moves", () => {
  const s = start(); s.board = Array.from({ length: 64 }, (_, i) => (i + Math.floor(i / 8)) % 2 === 0 ? 1 : 0);
  s.pieces = [{ id: 1, shape: 0 }, { id: 2, shape: 5 }];
  const n = reducer(s, { type: "place", id: 1, row: 0, col: 1 });
  assert.equal(n.phase, "result"); assert.equal(n.layers, 0); assert.equal(hasMove(n.board, n.pieces), false);
  assert.deepEqual(reducer(n, { type: "reset" }), initialState());
});
