import { expect, test, type Page } from "@playwright/test";
import { MAP_HEIGHT, MAP_WIDTH, places, project } from "../app/game/place/engine";

async function begin(page: Page, event = false) {
  await page.goto(`/game/place${event ? "?mode=event" : ""}`);
  await page.getByRole("button", { name: "Lên đường khám phá →" }).click();
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
}
async function currentPlace(page: Page) {
  const src = await page.locator(".place-photo img").getAttribute("src");
  return places.find(p => src?.includes(p.image))!;
}
async function pick(page: Page, point: { lat: number; lon: number }, touch = false) {
  const p = project(point);
  const screen = await page.locator(".place-map").evaluate((svg, p) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM()!;
    const pos = new DOMPoint(p.x, p.y).matrixTransform(matrix);
    return { x: pos.x, y: pos.y };
  }, p);
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: screen.x, y: screen.y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else await page.mouse.click(screen.x, screen.y);
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeEnabled();
}

test("fourth game opens from the lobby, perfect online round and replay", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/game");
  await page.getByRole("button", { name: "Khám phá chặng 4: Đây là đâu?" }).click();
  await page.getByRole("link", { name: "Chơi thử Đây là đâu? →" }).click();
  await expect(page).toHaveURL(/\/game\/place\?mode=online$/);
  await expect(page.locator(".site-header")).toHaveCount(0);
  await page.getByRole("button", { name: "Lên đường khám phá →" }).click();
  for (let i = 0; i < 10; i++) {
    await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
    const place = await currentPlace(page);
    await expect(page.locator(".place-photo img")).toHaveAttribute("alt", `Ảnh di sản cần xác định, câu ${i + 1}`);
    await pick(page, place.point);
    if (i === 0) await page.screenshot({ path: "test-results/place-desktop.png" });
    await page.getByRole("button", { name: "Chốt vị trí →" }).click();
    await expect(page.locator(".place-answer-info")).toContainText(place.name);
    await expect(page.locator(".place-distance")).toContainText("+30 điểm");
    await expect(page.locator(".place-answer-pin")).toHaveCount(1);
    await page.getByRole("button", { name: i === 9 ? "Xem kết quả hành trình →" : "Khung hình tiếp theo →" }).click();
  }
  await expect(page.getByRole("heading", { name: "Bạn đã tìm về đúng nơi!" })).toBeVisible();
  await expect(page.locator(".place-result-score")).toContainText("300");
  await page.getByRole("button", { name: "Khám phá lần nữa" }).click();
  await expect(page.getByRole("button", { name: "Lên đường khám phá →" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile map honors zoomed/panned coordinates, drag never places a pin, keyboard adjusts it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await begin(page);
  await page.getByRole("button", { name: "Phóng to bản đồ" }).click();
  const map = page.locator(".place-map");
  const before = await map.getAttribute("viewBox");
  const box = await map.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 18, box!.y + box!.height / 2 + 12, { steps: 3 }); await page.mouse.up();
  expect(await map.getAttribute("viewBox")).not.toBe(before);
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeDisabled();
  const [x, y, w, h] = (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  const point = { lon: 101 + (x + w / 2) / MAP_WIDTH * 17, lat: 24 - (y + h / 2) / MAP_HEIGHT * 17 };
  await pick(page, point, true);
  expect(Number(await map.getAttribute("data-guess-lat"))).toBeCloseTo(point.lat, 4);
  expect(Number(await map.getAttribute("data-guess-lon"))).toBeCloseTo(point.lon, 4);
  await map.focus(); await page.keyboard.press("ArrowUp");
  expect(Number(await map.getAttribute("data-guess-lat"))).toBeGreaterThan(point.lat);
  await page.getByRole("button", { name: "Xem toàn bộ bản đồ" }).click();
  await expect(map).toHaveAttribute("data-zoom", "100");
  await page.screenshot({ path: "test-results/place-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("event mode times out with last pin, then no pin; both play and review fit small phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.clock.install(); await begin(page, true);
  const place = await currentPlace(page); await pick(page, place.point);
  await expect(page.locator(".place-hud")).toContainText("1 / 10");
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(568);
  await page.clock.fastForward(20100);
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "review");
  await expect(page.locator(".place-answer-info")).toContainText("HẾT GIỜ");
  await expect(page.locator(".place-distance")).toContainText("+30 điểm");
  await page.screenshot({ path: "test-results/place-review-small.png" });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(568);
  await page.getByRole("button", { name: "Khung hình tiếp theo →" }).click();
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
  await page.clock.fastForward(20100);
  await expect(page.locator(".place-distance")).toContainText("Chưa đặt ghim");
  await expect(page.locator(".place-distance")).toContainText("+0 điểm");
  for (let round = 2; round < 10; round++) {
    await page.getByRole("button", { name: "Khung hình tiếp theo →" }).click();
    await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
    await page.clock.fastForward(20100);
    await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "review");
  }
  await page.getByRole("button", { name: "Xem kết quả hành trình →" }).click();
  await expect(page.getByRole("heading", { name: "Bạn đã tìm về đúng nơi!" })).toBeVisible();
  await expect(page.locator(".place-result-list li")).toHaveCount(10);
});

test("image loading delays the clock, hiding tab pauses it, resume keeps pin and time", async ({ page }) => {
  await page.clock.install();
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/game/place/*.webp", async route => { await blocked; await route.continue(); });
  await page.goto("/game/place"); await page.getByRole("button", { name: "Lên đường khám phá →" }).click();
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "loading");
  await page.clock.fastForward(30000);
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "loading");
  release(); await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
  await pick(page, (await currentPlace(page)).point);
  await page.clock.fastForward(3000);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.getByRole("dialog")).toBeVisible();
  const timer = await page.getByRole("timer").innerText();
  await page.clock.fastForward(60000); await expect(page.getByRole("timer")).toHaveText(timer);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); });
  await page.getByRole("button", { name: "Tiếp tục khám phá →" }).click();
  await page.getByRole("button", { name: "Chốt vị trí →" }).click();
  await expect(page.locator(".place-distance")).toContainText("+30 điểm");
});
