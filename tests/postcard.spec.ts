import { test, expect } from "./game-fixture";

test("game 5 keeps a live draft, validates words and sends a private letter without video", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game");
  await page.getByRole("button", { name: "Khám phá chặng 5: Đại sứ di sản" }).click();
  await page.getByRole("link", { name: "Chơi thử Đại sứ di sản →" }).click();
  await expect(page.locator(".site-header")).toHaveCount(0);
  await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.locator(".post-field select").selectOption("9");
  await page.getByRole("button", { name: /Vươn xa/ }).click();
  const input = page.locator("textarea");
  await input.fill("word ".repeat(21));
  await expect(page.locator(".post-word-count")).toContainText("21/20");
  await expect(page.getByRole("button", { name: "Gửi thư →", exact: true })).toBeDisabled();
  await input.fill("Discover Vietnam through its living heritage.");
  await page.getByPlaceholder("Tên hoặc biệt danh của bạn").fill("Linh");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("gcd-postcard-draft-v1") || "{}").sender)).toBe("Linh");
  await page.reload(); await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await expect(input).toHaveValue(/Discover Vietnam/);
  await expect(page.locator("select")).toHaveValue("9");
  await expect(page.getByRole("button", { name: /Vươn xa/ })).toHaveAttribute("aria-pressed", "true");
  const sending = page.waitForRequest(request => request.method() === "POST" && /\/api\/game\/attempts\//.test(request.url()));
  await page.getByRole("button", { name: "Gửi thư →", exact: true }).click();
  expect((await sending).postDataJSON()).toMatchObject({ message: "Discover Vietnam through its living heritage.", frame: "horizon", place: 9, sender: "Linh" });
  await expect(page.getByRole("heading", { name: "Thư đã được gửi!" })).toBeVisible();
  await expect(page.locator(".game-run-result")).toContainText("100 điểm");
  await expect(page.locator("video, .post-record, a[download]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: "test-results/postcard-sent-mobile.png", fullPage: true });
});

test("a permanently closed letter attempt does not block opening another attempt", async ({ page }) => {
  let first = true;
  await page.route("**/api/game/attempts/*", async route => {
    if (first) { first = false; await route.fulfill({ status: 409, json: { error: "Lượt chơi đã đóng." } }); }
    else await route.fulfill({ json: { score: 100 } });
  });
  await page.goto("/game/postcard");
  await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.locator("textarea").fill("Discover Vietnam with me.");
  await page.getByRole("button", { name: "Gửi thư →", exact: true }).click();
  await page.getByRole("button", { name: "Mở lượt khác" }).click();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("gcd-game-pending:")).length)).toBe(0);
  await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.getByRole("button", { name: "Gửi thư →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thư đã được gửi!" })).toBeVisible();
});
