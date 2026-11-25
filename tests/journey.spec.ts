import { test, expect } from "@playwright/test";

test("opening clouds dissolve and leave registration usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cloud-intro")).toBeVisible();
  await expect(page.locator(".cloud-intro")).toHaveCount(0, { timeout: 7000 });
  await expect(page.locator(".hero-art video")).toBeVisible();
  await expect(page.locator(".hero-actions a").first()).toHaveAttribute("href", "/register");
  await expect(page.locator(".hero-actions a").first()).toBeInViewport();
});

test("hero actions fit desktop, tablet, narrow phones and landscape", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const viewport of [
    { width: 1440, height: 1000 }, { width: 768, height: 1024 },
    { width: 390, height: 844 }, { width: 320, height: 640 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const hero = await page.locator(".hero-immersive").boundingBox();
    expect(hero?.height).toBe(viewport.height);
    await expect(page.locator(".hero-actions a").first()).toBeInViewport();
    await expect(page.locator(".hero-schedule-link")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "test-results/hero-landscape.png" });
});

test("details and saved itinerary keep keyboard focus and download", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const explore = page.getByRole("button", { name: "Khám phá điểm dừng", exact: true }).first();
  await explore.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Từ câu chuyện địa phương đến kết nối toàn cầu");
  await page.keyboard.press("Escape");
  await expect(explore).toBeFocused();
  const save = page.locator(".invitation-actions").getByRole("button", { name: "Lưu hành trình", exact: true });
  await save.click();
  const dialog = page.getByRole("dialog");
  const boxes = dialog.getByRole("checkbox");
  await boxes.nth(1).uncheck();
  await dialog.getByRole("button", { name: "Lưu hành trình", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("được lưu");
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: /^Tải bản lưu/ }).click();
  expect((await download).suggestedFilename()).toBe("hanh-trinh-di-san.txt");
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  await page.reload();
  await save.click();
  await expect(boxes.nth(1)).not.toBeChecked();
  await boxes.nth(0).uncheck();
  await boxes.nth(2).uncheck();
  await expect(dialog.getByRole("button", { name: "Lưu hành trình", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: /^Tải bản lưu/ })).toBeDisabled();
  expect(errors).toEqual([]);
});

test("shortcuts lead to programs and mobile menu links to registration", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator('.journey-shortcuts a[href="#tranh-bien"]').click();
  await expect(page).toHaveURL(/#tranh-bien$/);
  await expect(page.locator("#title-tranh-bien")).toBeInViewport();
  for (const id of ["hoi-cho", "doi-thoai", "khong-gian", "lich-trinh", "loi-hen"]) {
    await page.locator("#" + id).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const menu = page.locator(".menu-toggle");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await page.locator("#site-navigation").getByRole("link", { name: "Đăng ký tham gia sự kiện", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator(".event-registration form")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveAttribute("aria-expanded", "false");
});

test("3D selector keeps eleven models and selection state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  const tabs = page.getByRole("group", { name: "Chọn di sản", exact: true });
  await expect(tabs.getByRole("button")).toHaveCount(11);
  await tabs.getByRole("button", { name: "02 Tháp Rùa" }).click();
  await expect(page.locator(".sketchfab-stage iframe")).toHaveAttribute("src", /a22adcd051914e2e911debf0730cab28/);
  await expect(page.locator(".landmark-caption h3")).toHaveText("Tháp Rùa");
  await tabs.getByRole("button", { name: "03 Ngọ Môn" }).click();
  await expect(page.locator(".landmark-caption h3")).toHaveText("Ngọ Môn");
  await expect(tabs.getByRole("button", { name: "03 Ngọ Môn" })).toHaveAttribute("aria-pressed", "true");
});

test("journey progress follows sponsor and registration anchors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const dots = page.locator(".journey-dots");
  const sponsor = dots.getByRole("link", { name: "Nhà tài trợ", exact: true });
  const registration = dots.getByRole("link", { name: "Đăng ký", exact: true });
  await sponsor.click();
  await expect(sponsor).toHaveAttribute("aria-current", "location");
  await registration.click();
  await expect(registration).toHaveAttribute("aria-current", "location");
  await expect(sponsor).not.toHaveAttribute("aria-current", "location");
});

test("reduced motion keeps content usable without ambient animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-immersive")).toHaveAttribute("data-running", "false");
  await expect(page.locator(".cloud-intro")).not.toBeVisible();
  await expect(page.locator(".hero-art video")).toHaveJSProperty("paused", true);
  expect(await page.locator(".ticker > div").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await page.locator("#hoi-cho").scrollIntoViewIfNeeded();
  await expect(page.locator("#title-hoi-cho")).toBeVisible();
});

test("guest and sponsor carousels retain their manual controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const guest = page.locator(".guest-story.is-active h3");
  const initial = await guest.textContent();
  await page.getByRole("button", { name: "Khách mời tiếp theo", exact: true }).click();
  await expect(guest).not.toHaveText(initial!);
  await page.getByRole("button", { name: "Khách mời trước", exact: true }).click();
  await expect(guest).toHaveText(initial!);
  const sponsor = page.locator(".sponsor-feature-copy h3");
  const firstSlide = await sponsor.textContent();
  await page.getByRole("button", { name: "Slide tiếp theo", exact: true }).click();
  await expect(sponsor).not.toHaveText(firstSlide!);
  await page.getByRole("button", { name: "Slide trước", exact: true }).click();
  await expect(sponsor).toHaveText(firstSlide!);
});
