import { test, expect } from "@playwright/test";

test("full-screen hero covers the viewport and ambient motion can pause", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".hero-immersive");
  await expect(page.locator(".hero-art img")).toHaveJSProperty("complete", true);
  expect(await page.locator(".hero-art img").evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const bounds = await hero.boundingBox();
    expect(bounds?.x).toBe(0);
    expect(bounds?.y).toBe(0);
    expect(bounds?.width).toBe(viewport.width);
    expect(bounds?.height).toBeGreaterThanOrEqual(viewport.height);
    const background = await page.locator(".hero-art img").boundingBox();
    expect(background!.width).toBeGreaterThanOrEqual(viewport.width);
    expect(background!.height).toBeGreaterThanOrEqual(viewport.height);
    await expect(page.getByRole("link", { name: "Bước vào hành trình" })).toBeInViewport();
  }
  const cloud = page.locator(".cloud-one");
  const before = await cloud.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  expect(await cloud.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
  await page.getByRole("button", { name: "Tạm dừng chuyển động khung cảnh" }).click();
  await expect(hero).toHaveAttribute("data-running", "false");
  const stopped = await cloud.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  expect(await cloud.evaluate((el) => getComputedStyle(el).transform)).toBe(stopped);
  expect(await page.locator(".boat-course").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.getByRole("button", { name: "Bật chuyển động khung cảnh" }).click();
  await expect(hero).toHaveAttribute("data-running", "true");
  await page.locator("#hoi-cho").scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-running", "false");
});

test("desktop journey, program details, saved itinerary and download", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Việt Nam");
  await expect(page.locator(".hero-art img")).toBeVisible();
  await expect(page.locator(".hero-art img")).toHaveJSProperty("complete", true);
  await page.waitForTimeout(1400); // Let the entrance choreography complete before the visual capture.
  await page.screenshot({ path: "test-results/desktop-hero.png" });
  await page.getByRole("button", { name: "Khám phá điểm dừng" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Một phiên chợ, ngàn câu chuyện" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Khám phá điểm dừng" }).first()).toBeFocused();
  await page.getByRole("button", { name: "Hẹn một chuyến đi" }).click();
  const boxes = page.getByRole("checkbox");
  await boxes.nth(1).uncheck();
  await page.getByRole("button", { name: "Lưu hành trình", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("được lưu");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải bản lưu" }).click();
  expect((await download).suggestedFilename()).toBe("hanh-trinh-di-san.txt");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Hẹn một chuyến đi" }).click();
  await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
  await page.getByRole("checkbox").nth(0).uncheck();
  await page.getByRole("checkbox").nth(2).uncheck();
  await expect(page.getByRole("button", { name: "Lưu hành trình", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tải bản lưu" })).toBeDisabled();
  expect(errors).toEqual([]);
});

test("3D models render, switch and respond to controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("heading", { name: "Chùa Một Cột", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dừng tự xoay" }).click();
  await page.getByRole("button", { name: "Xoay trái", exact: true }).click();
  await page.getByRole("button", { name: "Xoay phải", exact: true }).click();
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/desktop-3d.png" });
  await page.getByRole("button", { name: "02 Tháp Rùa" }).click();
  await expect(page.getByRole("heading", { name: "Tháp Rùa", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "03 Ngọ Môn" }).click();
  await expect(page.getByRole("heading", { name: "Ngọ Môn", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "03 Ngọ Môn" })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("mobile navigation, no horizontal overflow and itinerary dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "test-results/mobile-hero.png", fullPage: false });
  await page.getByRole("button", { name: "Mở menu" }).click();
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Điểm hẹn" }).click();
  await expect(page.getByRole("button", { name: "Mở menu" })).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#hoi-cho$/);
  for (const id of ["hoi-cho", "tranh-bien", "doi-thoai", "khong-gian", "loi-hen"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "test-results/mobile-full.png", fullPage: true });
  await page.locator("#loi-hen").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Hẹn mình ở con đường di sản" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-passport.png" });
  await page.getByRole("button", { name: "Đóng cửa sổ" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("reduced motion and WebGL unavailable keep the journey usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".hero-immersive")).toHaveAttribute("data-running", "false");
  expect(await page.locator(".cloud-one").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  await expect(page.locator(".scene-fallback")).toBeVisible({ timeout: 25_000 });
  await page.getByRole("button", { name: "02 Tháp Rùa" }).click();
  await expect(page.getByRole("heading", { name: "Tháp Rùa", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dừng tự xoay" })).toHaveCount(0);
  expect(await page.locator(".ticker > div").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
