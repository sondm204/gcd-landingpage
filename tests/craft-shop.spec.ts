import { test, expect } from "@playwright/test";

const items: Record<string, string> = { "Bát Tràng": "Bình gốm", "Vạn Phúc": "Khăn lụa", "Phú Vinh": "Giỏ mây", "Chàng Sơn": "Quạt giấy", "làng Chuông": "Nón lá" };
test("mobile player can enter from lobby, finish event mode and replay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game");
  await page.getByRole("button", { name: /Tại sự kiện/ }).click();
  await page.getByRole("button", { name: "Khám phá chặng 1: Tiệm Bách nghệ" }).click();
  await page.getByRole("link", { name: /Chơi thử Tiệm Bách nghệ/ }).click();
  await expect(page).toHaveURL(/craft-shop\?mode=event/);
  await page.getByRole("button", { name: "Mở cửa tiệm →" }).click();
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole("button", { name: "Giao hàng →" })).toBeDisabled();
    const village = await page.locator(".craft-customer strong").innerText();
    await page.getByRole("button", { name: items[village], exact: true }).click();
    await page.getByRole("button", { name: "Giao hàng →" }).click();
    if (i < 2) await page.getByRole("button", { name: "Đón khách tiếp theo →" }).click();
  }
  await expect(page.getByRole("heading", { name: "Đôi tay giữ hồn di sản" })).toBeVisible();
  await expect(page.locator(".craft-result-stats")).toContainText("3/3");
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mở cửa tiệm →" })).toBeVisible();
});

test("online timeout, wrong delivery and narrow viewport", async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/game/craft-shop");
  await page.getByRole("button", { name: "Mở cửa tiệm →" }).click();
  const village = await page.locator(".craft-customer strong").innerText();
  const wrong = Object.values(items).find(item => item !== items[village])!;
  await page.getByRole("button", { name: wrong, exact: true }).click();
  await page.getByRole("button", { name: "Giao hàng →" }).click();
  await expect(page.getByRole("status")).toContainText("Chưa đúng");
  await page.getByRole("button", { name: "Đón khách tiếp theo →" }).click();
  await page.clock.fastForward(13000);
  await expect(page.getByRole("status")).toContainText("hết thời gian chờ");
  await page.clock.fastForward(60000);
  await expect(page.getByRole("heading", { name: "Tiệm vẫn chờ bạn trở lại" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
