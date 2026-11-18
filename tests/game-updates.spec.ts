import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { products } from "../app/game/craft-shop/engine";
import { MAP_HEIGHT, MAP_WIDTH, unproject } from "../app/game/place/engine";

test("realistic product artwork is reused in orders, shelf and delivered trays", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game/craft-shop");
  for (const product of products) {
    const response = await page.request.get(`/game/craft-shop/${product.id}.webp`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/webp");
  }
  await page.getByRole("button", { name: "Mở cửa tiệm →" }).click();
  await expect(page.locator(".craft-product-art image").first()).toBeVisible();
  const order = await page.locator(".craft-waiting-customer").first().locator(".craft-order-items li").evaluateAll(items => items.map(item => item.getAttribute("data-product")));
  for (const id of order) {
    await page.getByRole("button", { name: `Thêm ${products.find(p => p.id === id)!.name}`, exact: true }).click();
  }
  await expect(page.locator(".craft-tray .craft-product-art")).toHaveCount(order.length);
  await page.screenshot({ path: "test-results/craft-realistic-mobile.png" });
  await page.getByRole("button", { name: "Giao hàng →", exact: true }).click();
  await expect(page.locator(".craft-stats > div").nth(1)).toContainText("10");
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(844);
});

test("real two-finger pinch zooms at the midpoint; touch pan and taps keep correct coordinates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game/place");
  await page.getByRole("button", { name: "Lên đường khám phá →" }).click();
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
  const map = page.locator(".place-map"), box = (await map.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const fingers = (distance: number) => [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: fingers(25) });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: fingers(60) });
  await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(200);
  const view = (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  expect(view[0] + view[2] / 2).toBeCloseTo(MAP_WIDTH / 2, 1);
  expect(view[1] + view[3] / 2).toBeCloseTo(MAP_HEIGHT / 2, 1);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeDisabled();
  const before = await map.getAttribute("viewBox");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 3 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 25, y: y + 15, id: 3 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(await map.getAttribute("viewBox")).not.toBe(before);
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeDisabled();
  const [vx, vy, vw, vh] = (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  const expected = unproject(vx + vw / 2, vy + vh / 2);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 4 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(Number(await map.getAttribute("data-guess-lat"))).toBeCloseTo(expected.lat, 4);
  expect(Number(await map.getAttribute("data-guess-lon"))).toBeCloseTo(expected.lon, 4);
  await page.screenshot({ path: "test-results/place-pinch-mobile.png" });
  await cdp.detach();
});

test("pinch is bounded to 1–4x; cancelling a gesture leaves taps usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game/place");
  await page.getByRole("button", { name: "Lên đường khám phá →" }).click();
  await expect(page.locator(".place-app")).toHaveAttribute("data-phase", "playing");
  const map = page.locator(".place-map"), box = (await map.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const fingers = (distance: number) => [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: fingers(10) });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: fingers(80) });
  await expect(map).toHaveAttribute("data-zoom", "400");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: fingers(80) });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: fingers(10) });
  await expect(map).toHaveAttribute("data-zoom", "100");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeDisabled();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 5 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("button", { name: "Chốt vị trí →" })).toBeEnabled();
  await cdp.detach();
});

test("paper motifs stay stable while typing and all three designs export complete PNGs", async ({ page }) => {
  await page.goto("/game/postcard");
  await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.locator("textarea").fill("Discover the living heritage of Vietnam.");
  await page.getByPlaceholder("Tên hoặc biệt danh của bạn").fill("Linh");
  const paper = page.locator(".post-live");
  await page.locator(".post-live-photo img").evaluate(node => (node as HTMLImageElement).decode());
  const background = await paper.evaluate(node => (node as HTMLElement).style.backgroundImage);
  await page.locator(".post-live-photo img").evaluate(node => node.setAttribute("data-stable", "true"));
  await page.locator("textarea").pressSequentially(" Welcome!", { delay: 30 });
  expect(await paper.evaluate(node => (node as HTMLElement).style.backgroundImage)).toBe(background);
  await expect(page.locator(".post-live-photo img")).toHaveAttribute("data-stable", "true");
  const hashes = new Set<string>();
  for (const [id, label] of [["roots", "Cội nguồn"], ["vermilion", "Sắc Việt"], ["horizon", "Vươn xa"]]) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(paper).toHaveAttribute("data-frame", id);
    if (id === "roots") await page.screenshot({ path: "test-results/postcard-paper-desktop.png", fullPage: true });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Tải postcard của tôi ↓" }).click();
    const file = await download, path = `test-results/postcard-paper-${id}.png`;
    await file.saveAs(path);
    const png = await readFile(path);
    expect(png.readUInt32BE(16)).toBe(1200); expect(png.readUInt32BE(20)).toBe(1500);
    hashes.add(createHash("sha256").update(png).digest("hex"));
    await page.getByRole("button", { name: "Chỉnh sửa postcard" }).click();
  }
  expect(hashes.size).toBe(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/postcard-paper-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
