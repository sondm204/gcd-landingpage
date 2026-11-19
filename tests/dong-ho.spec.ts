import { test, expect } from "./game-fixture";
import { fits, initialState, reducer, type State } from "../app/game/dong-ho/engine";

test("three-minute countdown ends round and hydration is clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/game/dong-ho");
  await page.getByRole("button", { name: "Mở ván in →" }).click();
  await expect(page.getByRole("timer")).toHaveText("3:00");
  await page.clock.fastForward(179000);
  await expect(page.getByRole("timer")).toHaveText("0:01");
  await page.clock.fastForward(1000); await page.clock.runFor(400);
  await expect(page.locator(".print-result")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.getByText("Hết 3 phút! Đây là bức tranh bạn đã mở được.", { exact: true })).toBeVisible();
  expect(errors.filter(e => /hydrat|didn't match/i.test(e))).toEqual([]);
});

async function opening(page: import("@playwright/test").Page, mode = "online") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(`/game/dong-ho?mode=${mode}`);
  await page.getByRole("button", { name: "Mở ván in →" }).click();
}
function bestMove(s: State) {
  let best: { value: number; id: number; row: number; col: number; next: State } | undefined;
  for (const p of s.pieces) for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8), col = i % 8;
    if (!fits(s.board, p.shape, row, col)) continue;
    const next = reducer(s, { type: "place", id: p.id, row, col });
    const value = (next.layers - s.layers) * 10000 - i;
    if (!best || value > best.value) best = { value, id: p.id, row, col, next };
  }
  return best!;
}
test("reveal image overlays through board interactions, show score and replay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await opening(page);
  let state = reducer(initialState(), { type: "start", seed: 0 });
  await expect(page.locator(".print-mini-art .print-photo-overlays > span")).toHaveCount(20);
  while (state.layers < 2) {
    const move = bestMove(state);
    await page.locator(".print-tray button").nth(state.pieces.findIndex(p => p.id === move.id)).click();
    await page.locator(".print-cell").nth(move.row * 8 + move.col).click();
    state = move.next;
  }
  await expect(page.locator(".print-mini-art .revealed")).toHaveCount(state.layers);
  await page.getByRole("button", { name: "Chốt kết quả ✓" }).click();
  await expect(page.getByRole("heading", { name: "Bạn đã đánh thức sắc màu" })).toBeVisible();
  await expect(page.locator(".print-result-stats")).toContainText(String(state.score));
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mở ván in →" })).toBeVisible();
});
test("event mode can stop after one layer; no horizontal/vertical page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await opening(page, "event");
  let state = reducer(initialState(), { type: "start", seed: 0 });
  while (state.layers < 1) {
    const move = bestMove(state);
    await page.locator(".print-tray button").nth(state.pieces.findIndex(p => p.id === move.id)).click();
    await page.locator(".print-cell").nth(move.row * 8 + move.col).click();
    state = move.next;
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole("button", { name: "Chốt kết quả ✓" }).click();
  await expect(page.getByRole("heading", { name: "Bạn đã đánh thức sắc màu" })).toBeVisible();
});
test("drag placement and keyboard selection work without consuming an invalid drop", async ({ page }) => {
  await opening(page);
  const block = page.locator(".print-tray button").first();
  const start = (await block.locator("svg").boundingBox())!;
  const target = (await page.locator(".print-cell").first().boundingBox())!;
  const unit = Math.min(start.width / 2, start.height);
  await page.mouse.move(start.x + (start.width - unit * 2) / 2 + unit / 2, start.y + start.height / 2);
  await page.mouse.down();
  const second = (await page.locator(".print-cell").nth(1).boundingBox())!;
  const lift = second.x - target.x + 22;
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2 + lift, { steps: 8 });
  const ghost = (await page.locator(".print-drag-ghost > span").first().boundingBox())!;
  expect(Math.abs(ghost.x - target.x)).toBeLessThan(1);
  expect(Math.abs(ghost.y - target.y)).toBeLessThan(1);
  await page.mouse.up();
  await expect(page.locator(".print-tray button")).toHaveCount(2);
  await page.locator(".print-tray button").first().focus();
  await page.keyboard.press("Enter");
  await page.locator(".print-cell").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".print-tray button")).toHaveCount(2);
  await expect(page.getByRole("status")).toContainText("Khối chưa vừa");
});
