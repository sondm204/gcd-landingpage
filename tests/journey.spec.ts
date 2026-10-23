import { test, expect } from "@playwright/test";

test("opening clouds cover the screen, dissolve and leave the hero usable", async ({ page }) => {
  await page.goto("/");
  const intro = page.locator(".cloud-intro");
  await expect(intro).toBeVisible();
  await intro.evaluate((el) => el.getAnimations({ subtree: true }).forEach((animation) => {
    animation.pause();
    animation.currentTime = 0;
  }));
  await page.locator(".intro-cloud-bank img").first().evaluate((img) => (img as HTMLImageElement).decode());
  const bounds = await intro.boundingBox();
  expect(bounds).toEqual({ x: 0, y: 0, width: 1440, height: 1000 });
  await expect(page.locator(".intro-mist")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/cloud-intro-start.png" });
  await intro.evaluate((el) => el.getAnimations({ subtree: true }).forEach((animation) => {
    animation.currentTime = 1800;
  }));
  await page.screenshot({ path: "test-results/cloud-intro-middle.png" });
  await intro.evaluate((el) => el.getAnimations({ subtree: true }).forEach((animation) => animation.play()));
  await expect(intro).toHaveCount(0, { timeout: 6000 });
  await page.getByRole("button", { name: "Tạm dừng chuyển động khung cảnh" }).click();
  await expect(intro).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Bước vào hành trình" })).toBeVisible();
});

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

test("station elements float in separately when scrolled into view", async ({ page }) => {
  await page.goto("/");
  const station = page.locator("#tranh-bien");
  const title = station.getByRole("heading", { level: 2 });
  const description = station.locator(".station-copy > p");
  await expect(title).toHaveClass(/reveal-pending/);
  await expect(title).not.toHaveClass(/is-visible/);
  await expect(description).not.toHaveClass(/is-visible/);
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveClass(/is-visible/);
  await expect(description).toHaveClass(/is-visible/);
  await expect(title).toHaveCSS("opacity", "1");
  await expect(description).toHaveCSS("opacity", "1");
  await expect(station.locator(".station-art")).toHaveClass(/is-visible/);
});

test("sponsor and registration journey dots become active after navigation", async ({ page }) => {
  await page.goto("/");
  const dots = page.getByRole("navigation", { name: "Các điểm dừng" });
  const sponsor = dots.getByRole("link", { name: "Nhà tài trợ" });
  const registration = dots.getByRole("link", { name: "Đăng ký" });

  await sponsor.click();
  await expect(page).toHaveURL(/#nha-tai-tro$/);
  await expect(sponsor).toHaveAttribute("aria-current", "location");

  await registration.click();
  await expect(page).toHaveURL(/#loi-hen$/);
  await expect(registration).toHaveAttribute("aria-current", "location");
  await expect(sponsor).not.toHaveAttribute("aria-current", "location");
});

test("desktop journey, program details, saved itinerary and download", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Gốc rễ Việt");
  await expect(page.locator(".hero-art img")).toBeVisible();
  await expect(page.locator(".hero-art img")).toHaveJSProperty("complete", true);
  await expect(page.locator(".cloud-intro")).toHaveCount(0, { timeout: 6000 });
  await page.screenshot({ path: "test-results/desktop-hero.png" });
  await page.getByRole("button", { name: "Khám phá điểm dừng" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Từ câu chuyện địa phương đến kết nối toàn cầu" })).toBeVisible();
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
  await expect(page.locator(".cloud-intro")).toHaveCount(0, { timeout: 6000 });
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
  await page.getByRole("button", { name: "Bắt đầu hành trình của bạn" }).click();
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
  await expect(page.locator(".cloud-intro")).not.toBeVisible();
  expect(await page.locator(".cloud-one").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  await expect(page.locator(".scene-fallback")).toBeVisible({ timeout: 25_000 });
  await page.getByRole("button", { name: "02 Tháp Rùa" }).click();
  await expect(page.getByRole("heading", { name: "Tháp Rùa", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dừng tự xoay" })).toHaveCount(0);
  expect(await page.locator(".ticker > div").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
