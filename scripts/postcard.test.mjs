import { test } from "node:test";
import assert from "node:assert/strict";
import { initialDraft, restoreDraft, validMessage, wordCount } from "../app/game/postcard/model.ts";
test("word counter handles punctuation, apostrophes, hyphens and multiple spaces", () => {
  assert.equal(wordCount("  Vietnam's living-heritage, across\n the world! "), 5);
  assert.equal(wordCount("... — !!!"), 0);
  assert.equal(wordCount("Welcome to Hội An"), 4);
});
test("only 1 to 20 words within the character limit can be exported", () => {
  assert(!validMessage(" ")); assert(!validMessage("!!!"));
  assert(validMessage("heritage ".repeat(20))); assert(!validMessage("heritage ".repeat(21)));
  assert(!validMessage("a".repeat(241)));
});
test("saved drafts round-trip, reject malformed selections and bound text length", () => {
  const draft = { place: 9, frame: "horizon", message: "Come discover Vietnam.", sender: "Linh" };
  assert.deepEqual(restoreDraft(JSON.stringify(draft), 10), draft);
  for (const value of ["broken", "null", JSON.stringify({ ...draft, place: 99 }), JSON.stringify({ ...draft, frame: "unknown" }), JSON.stringify({ ...draft, message: {} })]) assert.deepEqual(restoreDraft(value, 10), initialDraft);
  const bounded = restoreDraft(JSON.stringify({ ...draft, message: "x".repeat(500), sender: "x".repeat(80) }), 10);
  assert.equal(bounded.message.length, 240); assert.equal(bounded.sender.length, 40);
});
