import { test, expect, type Page } from "@playwright/test";
import { conceptPositions } from "../lib/booths/types";

async function booths(page: Page, admin = false) {
  await page.route("**/api/booths", route => route.fulfill({ json: { configured: true, positions: conceptPositions() } }));
  await page.route("**/api/booths/admin/session", route => route.fulfill({ json: { admin: admin ? { email: "admin@example.test" } : null } }));
}

test("mobile booth guidance can be expanded without obscuring booking", async ({ page }) => {
  await booths(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/booths");
  const toggle = page.locator(".booth-zone-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#booth-zone-content")).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".booth-zone-card")).toHaveCount(3);
  await expect(page.locator("#booth-zone-content")).toBeVisible();
  await toggle.click();
  await expect(page.locator("#booth-zone-content")).not.toBeVisible();
  await expect(page.locator(".booth-map-card")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("home switch preserves query and section and localizes SSR metadata", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/?campaign=test#lich-trinh");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\?campaign=test#lich-trinh$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(page.locator("#schedule-title:visible")).toContainText("One day of connection.");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en$/);
  const alternate = await page.locator('link[hreflang="vi"]').getAttribute("href");
  expect(new URL(alternate!).pathname).toBe("/");
  expect(errors).toEqual([]);
});

test("English content, dialogs and navigation keep the chosen language", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Sunday, 6 December 2026", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Explore this stop", exact: true }).first().click();
  await expect(page.locator("dialog[open]")).toContainText("The fair is a starting point");
  await page.getByRole("button", { name: "Close window" }).click();
  await page.getByRole("link", { name: "Booths", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/booths$/);
  await expect(page.locator("h1:visible")).toContainText("Choose a small space.");
});

test("booth draft, files, raw category and selected position survive language switches", async ({ page }) => {
  await booths(page);
  await page.goto("/en/booths");
  await page.locator('select:visible').filter({ has: page.locator('option[value="21"]') }).first().selectOption("21");
  const form = page.locator("#booth-registration:visible");
  await form.locator('[name="brand"]').fill("My brand");
  await form.locator('[name="booth_name"]').fill("My booth");
  await form.locator('[name="category"]').selectOption({ index: 1 });
  await form.locator('[name="description"]').fill("Nội dung của chủ gian hàng — keep this unchanged.");
  await form.locator('[name="images"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=", "base64") });
  await page.getByRole("button", { name: "Tiếng Việt", exact: true }).click();
  await expect(page).toHaveURL(/\/booths$/);
  await expect(form.locator('[name="booth_name"]')).toHaveValue("My booth");
  await expect(form.locator('[name="brand"]')).toHaveValue("My brand");
  await expect(form.locator('[name="category"]')).toHaveValue("Thủ công & làng nghề");
  await expect(form.locator('[name="description"]')).toHaveValue("Nội dung của chủ gian hàng — keep this unchanged.");
  await expect.poll(() => form.locator('[name="images"]').evaluate((node: HTMLInputElement) => node.files?.[0]?.name)).toBe("logo.png");
  await expect(page.locator('.booth-form-heading:visible')).toContainText("TT01");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(form.locator('[name="booth_name"]')).toHaveValue("My booth");
  await expect(form.locator('[name="brand"]')).toHaveValue("My brand");
});

test("API error codes translate on admin sign-in", async ({ page }) => {
  await page.route("**/api/booths/admin/login", route => route.fulfill({ status: 401, json: { error: "Email hoặc mật khẩu chưa đúng.", error_code: "m0652" } }));
  await page.goto("/en/booths/admin/login");
  await page.locator('[name="email"]').fill("admin@example.test");
  await page.locator('[name="password"]').fill("invalid-password");
  await page.getByRole("button", { name: "Admin sign-in" }).click();
  await expect(page.locator('.booth-login [role="alert"]:visible')).toContainText("Incorrect email or password.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("admin approval UI is localized without translating applicant content", async ({ page }) => {
  await booths(page, true);
  await page.route("**/api/booths/admin/proposals?*", route => route.fulfill({ json: { total: 1, proposals: [{ id: "example", reference: "REF-1", position_id: 1, brand: "Thương hiệu mẫu", booth_name: "Tên gian hàng gốc", category: "Ẩm thực", contact_name: "Nguyễn Văn A", phone: "0901234567", email: "sample@example.test", description: "Nội dung gốc", status: "pending", created_at: "2026-11-15T08:30:00Z", updated_at: "2026-11-15T08:30:00Z", image_paths: [] }] } }));
  await page.goto("/en/booths");
  await expect(page.locator('.booth-admin-panel:visible')).toContainText("MANAGE BY LOCATION");
  await expect(page.locator('.booth-admin-panel:visible')).toContainText("Thương hiệu mẫu");
  await expect(page.getByRole("button", { name: "Approve & confirm TM01" })).toBeVisible();
  await page.getByRole("button", { name: "Approve & confirm TM01" }).click();
  await expect(page.locator("dialog[open]")).toContainText("Confirm location TM01?");
});

test("English mobile header fits and menu links stay localized", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en/booths/admin/login");
  await expect(page.getByRole("button", { name: "English", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Booths", exact: true })).toHaveAttribute("href", "/en/booths");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.screenshot({ path: "test-results/i18n-mobile.png", fullPage: true });
});

test("localized social images and original API paths remain available", async ({ request }) => {
  for (const path of ["/opengraph-image", "/en/opengraph-image", "/en/twitter-image"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  const response = await request.get("/api/booths");
  expect(response.headers()["content-type"]).toContain("application/json");
  expect((await request.get("/en/not-a-page")).status()).toBe(404);
});
