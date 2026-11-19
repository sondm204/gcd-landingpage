import { test, expect } from "./game-fixture";

const names: Record<string, string> = { pot: "Bình gốm", silk: "Khăn lụa", basket: "Giỏ mây", fan: "Quạt giấy", hat: "Nón lá", dragonfly: "Chuồn chuồn tre" };

test("multiple customers, ordered tray editing, delivery to any customer and replay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/game/craft-shop?mode=event");
  await page.getByRole("button", { name: "Mở cửa tiệm →" }).click();
  await expect(page.locator(".craft-waiting-customer")).toHaveCount(3);
  await expect(page.locator(".craft-products button")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Giao hàng →" })).toBeDisabled();
  // Select/remove/clear before serving the second customer first.
  await page.getByRole("button", { name: "Thêm Bình gốm", exact: true }).click();
  await page.getByRole("button", { name: /Bỏ món 1:/ }).click();
  await expect(page.locator(".craft-tray button")).toHaveCount(0);
  await page.getByRole("button", { name: "Thêm Nón lá", exact: true }).click();
  await page.getByRole("button", { name: "Bỏ hết", exact: true }).click();
  for (const id of [2, 1, 3, 4, 5, 6]) {
    const customer = page.locator(`[data-customer-id="${id}"]`);
    const items = await customer.locator(".craft-order-items li").evaluateAll(es => es.map(e => e.getAttribute("data-product")!));
    for (const item of items) await page.getByRole("button", { name: `Thêm ${names[item]}`, exact: true }).click();
    await expect(page.locator(".craft-tray button")).toHaveCount(items.length);
    await page.getByRole("button", { name: "Giao hàng →" }).click();
    await expect(customer).toHaveCount(0);
  }
  await expect(page.locator(".craft-stats > div").nth(1)).toContainText("60");
  await expect(page.locator(".craft-waiting-customer")).toHaveCount(3);
  await expect(page.locator(".craft-result")).toHaveCount(0);
  await page.clock.fastForward(61000);
  await page.clock.runFor(600);
  await expect(page.getByRole("heading", { name: "Một phút làm chủ tiệm" })).toBeVisible();
  await expect(page.locator(".craft-result-stats")).toContainText("60");
  await expect(page.locator(".craft-result-stats")).toContainText("6");
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mở cửa tiệm →" })).toBeVisible();
});

test("wrong delivery, angry expressions, individual expiries, global timeout and narrow viewport", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/game/craft-shop");
  await page.getByRole("button", { name: "Mở cửa tiệm →" }).click();
  // All orders contain at least two items: one item cannot match.
  await page.getByRole("button", { name: "Thêm Bình gốm", exact: true }).click();
  await page.getByRole("button", { name: "Giao hàng →" }).click();
  await expect(page.getByRole("status")).toContainText("Chưa khớp đơn nào");
  await expect(page.locator(".craft-waiting-customer")).toHaveCount(3);
  await page.clock.fastForward(18000);
  await expect(page.locator('[data-customer-id="1"]')).toHaveClass(/is-angry/);
  await expect(page.locator('[data-customer-id="1"] .craft-mood')).toHaveText("Nhanh lên nhé!");
  await page.screenshot({ path: "test-results/craft-shop-angry-mobile.png", fullPage: true });
  await page.clock.fastForward(7000);
  // Advance animation frames as well as timers so exit animations can complete.
  await page.clock.runFor(600);
  await expect(page.locator('[data-customer-id="1"]')).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("hết kiên nhẫn");
  await expect(page.locator('[data-customer-id="4"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.clock.fastForward(60000);
  await page.clock.runFor(600);
  await expect(page.getByRole("heading", { name: "Một phút làm chủ tiệm" })).toBeVisible();
});
