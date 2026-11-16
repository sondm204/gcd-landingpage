import { test, expect } from "@playwright/test";
import { DURATION, MAX_SCORE, unitsForStreak, scoreFromUnits, GOOD, notes } from "../app/game/rhythm/engine";

async function setup(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    // Keep the browser audio clock deterministic while exercising real pointer/keyboard handlers.
    const clock = window as typeof window & { rhythmTime: number };
    clock.rhythmTime = 0;
    Object.defineProperty(AudioContext.prototype, "currentTime", { get: () => clock.rhythmTime });
  });
  await page.goto("/game/rhythm");
  await page.getByRole("button", { name: "Lên sân khấu →" }).click();
  await expect(page.locator(".rhythm-countdown")).toBeVisible();
}
async function time(page: import("@playwright/test").Page, milliseconds: number) {
  await page.evaluate(ms => { (window as typeof window & { rhythmTime: number }).rhythmTime = (ms + 3000) / 1000; }, milliseconds);
  await expect(page.locator(".rhythm-stage")).toHaveAttribute("data-elapsed", String(milliseconds));
}
test("tap and hold with pointer and keyboard, score at most 300, complete 60 seconds and replay", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const actions = notes.flatMap(n => [{ n, down: true, at: n.at }, { n, down: false, at: n.at + (n.duration || 1) }]).sort((a, b) => a.at - b.at);
  let completed = 0;
  for (const action of actions) {
    const { n, down, at } = action;
    await time(page, at);
    if (n.duration || n.id === 0) {
      if (down) {
        const box = await page.locator(".rhythm-pads button").nth(n.lane).boundingBox();
        await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await page.mouse.down();
      } else await page.mouse.up();
    } else if (down) await page.keyboard.down(["d", "f", "j", "k"][n.lane]);
    else await page.keyboard.up(["d", "f", "j", "k"][n.lane]);
    if (down && n.duration) {
      await expect(page.locator(".rhythm-pads button").nth(n.lane)).toHaveAttribute("data-holding", "true");
      if (n === notes.find(note => note.duration)) {
        await page.screenshot({ path: "test-results/rhythm-long-note.png" });
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(844);
      }
    }
    if ((down && !n.duration) || (!down && n.duration)) completed++;
    await expect(page.locator(".rhythm-stats > span").nth(2)).toContainText(`${completed}/${notes.length}`);
    await expect(page.locator(".rhythm-stats > span").first().locator("b")).toHaveText(String(scoreFromUnits(unitsForStreak(completed))));
  }
  await page.evaluate(ms => { (window as typeof window & { rhythmTime: number }).rhythmTime = (ms + 3000) / 1000; }, DURATION);
  await expect(page.getByRole("heading", { name: "Giai điệu của bạn" })).toBeVisible();
  await expect(page.locator(".rhythm-result")).toContainText(`${notes.length}/${notes.length}`);
  await expect(page.locator(".rhythm-result-score")).toHaveText(`${MAX_SCORE}/ ${MAX_SCORE} điểm`);
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lên sân khấu →" })).toBeVisible();
});
test("pause and tab hiding freeze play; untouched round ends with zero hits; mobile fits", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page); await time(page, 500);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".rhythm-pads button").first().dispatchEvent("pointerdown", { button: 0 });
  await page.getByRole("button", { name: "Tiếp tục →" }).click();
  await time(page, 2000);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); });
  await page.getByRole("button", { name: "Tiếp tục →" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.evaluate(ms => { (window as typeof window & { rhythmTime: number }).rhythmTime = (ms + 3000) / 1000; }, DURATION);
  await expect(page.getByRole("heading", { name: "Giai điệu của bạn" })).toBeVisible();
  await expect(page.locator(".rhythm-result")).toContainText(`0/${notes.length}`);
});

test("miss penalty and touch hold cancellation apply once, even outside the pad", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page);
  await time(page, notes[0].at);
  await page.locator(".rhythm-pads button").nth(notes[0].lane).click();
  await expect(page.locator(".rhythm-stats > span").first().locator("b")).toHaveText(String(scoreFromUnits(100)));
  await time(page, notes[1].at + GOOD + 1);
  await expect(page.locator(".rhythm-stats > span").first().locator("b")).toHaveText(String(scoreFromUnits(50)));
  const n = notes.find(note => note.duration)!;
  await time(page, n.at);
  const pad = page.locator(".rhythm-pads button").nth(n.lane);
  const box = await pad.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box!.x + box!.width / 2, y: box!.y + 20, id: 1 }] });
  await expect(pad).toHaveAttribute("data-holding", "true");
  await page.screenshot({ path: "test-results/rhythm-compact-hold.png" });
  await time(page, n.at + 100);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 2, y: 180, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expect(pad).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(`.rhythm-falling-note[data-note-id="${n.id}"]`)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(568);
});

test("keyboard long note survives pause only after pressing again, then scores once", async ({ page }) => {
  await setup(page);
  const n = notes.find(note => note.duration)!;
  const key = ["d", "f", "j", "k"][n.lane];
  const pad = page.locator(".rhythm-pads button").nth(n.lane);
  await time(page, n.at);
  await page.keyboard.down(key);
  await expect(pad).toHaveAttribute("data-holding", "true");
  await time(page, n.at + 50);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("0,75 giây");
  await page.keyboard.up(key);
  await page.getByRole("button", { name: "Tiếp tục →" }).click();
  await expect(pad).toHaveAttribute("aria-pressed", "false");
  await time(page, n.at + 100);
  await page.keyboard.down(key);
  await expect(pad).toHaveAttribute("data-holding", "true");
  await time(page, n.at + n.duration);
  await page.keyboard.up(key);
  await expect(page.locator(".rhythm-stats > span").first().locator("b")).toHaveText(String(scoreFromUnits(100)));
  await expect(pad).toHaveAttribute("aria-pressed", "false");
});

test("following notes scroll visibly behind the hold tail and reach the line after release", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const n = notes.find(note => note.duration)!;
  const next = notes[n.id + 1];
  const held = page.locator(`.rhythm-falling-note[data-note-id="${n.id}"]`);
  const following = page.locator(`.rhythm-falling-note[data-note-id="${next.id}"] .rhythm-note-block`);
  await time(page, n.at);
  await page.keyboard.down(["d", "f", "j", "k"][n.lane]);
  for (const at of [n.at, n.at + Math.floor(n.duration / 2), n.at + n.duration - 1]) {
    await time(page, at);
    await expect(held).toBeVisible();
    if (at > n.at) {
      await expect(following).toBeVisible();
      const tailBox = await held.locator(".rhythm-note-tail").boundingBox();
      const nextBox = await following.boundingBox();
      expect(nextBox!.y + nextBox!.height).toBeLessThan(tailBox!.y);
    }
  }
  await time(page, n.at + n.duration);
  await page.keyboard.up(["d", "f", "j", "k"][n.lane]);
  await expect(held).toHaveCount(0);
  await expect(following).toBeVisible();
  await time(page, next.at);
  await page.keyboard.press(["d", "f", "j", "k"][next.lane]);
  await expect(page.locator(".rhythm-stats > span").first().locator("b")).toHaveText(String(scoreFromUnits(unitsForStreak(2))));
});
