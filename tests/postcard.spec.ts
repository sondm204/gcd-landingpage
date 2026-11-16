import { test, expect } from "@playwright/test";
test.use({ launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } });
test("lobby opens game 5; live preview, word limit, draft restore and PNG download", async ({ page }) => {
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
  await expect(page.getByRole("link", { name: "Tải postcard của tôi ↓" })).toHaveCount(0);
  await input.fill("Discover Vietnam through its living heritage and share the stories that connect us all.");
  await page.getByPlaceholder("Tên hoặc biệt danh của bạn").fill("Linh");
  await expect(page.getByRole("link", { name: "Tải postcard của tôi ↓" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("gcd-postcard-draft-v1") || "{}").sender)).toBe("Linh");
  await page.reload(); await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await expect(input).toHaveValue(/Discover Vietnam/);
  await expect(page.locator("select")).toHaveValue("9");
  await expect(page.getByRole("button", { name: /Vươn xa/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Tải postcard của tôi ↓" })).toBeVisible();
  const download = page.waitForEvent("download"); await page.getByRole("link", { name: "Tải postcard của tôi ↓" }).click();
  const file = await download; expect(file.suggestedFilename()).toBe("heritage-postcard.png");
  await file.saveAs("test-results/postcard-export.png");
  await expect(page.getByRole("heading", { name: "Câu chuyện đã sẵn sàng" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: "test-results/postcard-mobile.png", fullPage: true });
});
test("camera denial is recoverable and never blocks the postcard", async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); }; });
  await page.goto("/game/postcard?mode=event"); await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.locator("textarea").fill("Discover the beautiful heritage of Vietnam.");
  await expect(page.getByRole("link", { name: "Tải postcard của tôi ↓" })).toBeVisible();
  await page.getByRole("link", { name: "Tải postcard của tôi ↓" }).click();
  await page.getByRole("button", { name: "Quay clip 15 giây" }).click();
  await expect(page.locator(".post-record").getByRole("alert")).toContainText("Chưa mở được camera/micro");
  await expect(page.getByRole("link", { name: "Tải lại postcard ↓" })).toBeVisible();
  await page.screenshot({ path: "test-results/postcard-desktop.png", fullPage: true });
});

test("optional video automatically stops at 15 seconds and releases the camera", async ({ page }) => {
  await page.addInitScript(() => {
    const media = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const state = window as typeof window & { postcardTracks: MediaStreamTrack[] };
    navigator.mediaDevices.getUserMedia = async constraints => { const stream = await media(constraints); state.postcardTracks = stream.getTracks(); return stream; };
  });
  await page.goto("/game/postcard"); await page.getByRole("button", { name: "Viết câu chuyện của tôi →" }).click();
  await page.locator("textarea").fill("Let Vietnam inspire your next adventure.");
  await page.getByRole("link", { name: "Tải postcard của tôi ↓" }).click();
  await page.getByRole("button", { name: "Quay clip 15 giây" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tải clip ↓" })).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => (window as typeof window & { postcardTracks: MediaStreamTrack[] }).postcardTracks.every(t => t.readyState === "ended"))).toBe(true);
  const video = await page.locator(".post-record video").getAttribute("src"); expect(video).toMatch(/^blob:/);
});
