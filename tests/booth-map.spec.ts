import { test, expect } from "@playwright/test";
import { conceptPositions } from "../lib/booths/types";
import { boothMapBounds } from "../app/booths/components/booth-map-layout";

test("display positions retain their groups and never overlap", () => {
  const positions = conceptPositions().filter(p => !p.code.startsWith("BTC"));
  for (const [index, position] of positions.entries()) {
    const a = boothMapBounds(position);
    expect(a.x).toBeGreaterThanOrEqual(88);
    expect(a.x + a.w).toBeLessThanOrEqual(1568);
    expect(a.y + a.h).toBeLessThanOrEqual(1390);
    if (position.code.startsWith("VH")) expect(a.x + a.w).toBeLessThan(500);
    if (position.code.startsWith("TT")) expect(a.x).toBeGreaterThan(720);
    for (const other of positions.slice(index + 1)) {
      const b = boothMapBounds(other);
      const overlaps = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      expect(overlaps, `${position.code} overlaps ${other.code}`).toBe(false);
    }
  }
});

test.beforeEach(async ({ page }) => {
  const positions = conceptPositions().map(p => ({ ...p, is_booked: p.id === 4, is_locked: p.id === 3, pending_count: p.id === 2 ? 2 : 0 }));
  await page.route("**/api/booths", route => route.fulfill({ json: { configured: true, positions } }));
  await page.route("**/api/booths/admin/session", route => route.fulfill({ json: { admin: null } }));
});

test("map preserves booth selection and booking states", async ({ page }) => {
  await page.goto("/booths");
  const map = page.locator(".booth-wayfinding");
  await expect(map.locator(".booth-map-spot")).toHaveCount(32);
  await expect(map.locator(".booth-map-service")).toHaveCount(5);
  await expect(map.locator('g[data-code="TM03"]')).toHaveClass(/is-locked/);
  await expect(map.locator('g[data-code="TM04"]')).toHaveClass(/is-booked/);
  await map.locator('g[data-code="TT06"]').click();
  await expect(page.locator(".booth-form-heading h2")).toHaveText("TT06 – Gian đổi quà");
  await expect(map.locator(".booth-map-selection")).toContainText("TT06 – Gian đổi quà");
  await map.locator('g[data-code="TM02"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".booth-form-heading h2")).toHaveText("TM02");
  await expect(map.locator(".booth-map-selection")).toContainText("2 đề xuất");
  await map.locator(".booth-plan-drawing").screenshot({ path: "test-results/booth-wayfinding-desktop.png" });
});

test("mobile expanded map supports zoom, selection, Escape and focus return", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/booths");
  const expand = page.getByRole("button", { name: "Mở rộng", exact: true });
  await expand.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".booth-map-canvas")).toHaveCSS("min-width", "1080px");
  await dialog.getByRole("button", { name: "Phóng to sơ đồ", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Đặt lại sơ đồ", exact: true })).toHaveText("150%");
  await dialog.getByRole("button", { name: "Đặt lại sơ đồ", exact: true }).click();
  await dialog.locator('g[data-code="TT06"]').click();
  await expect(dialog.locator(".booth-map-selection")).toContainText("Gian đổi quà");
  await page.screenshot({ path: "test-results/booth-wayfinding-mobile-expanded.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(expand).toBeFocused();
  await expect(page.locator(".booth-form-heading h2")).toHaveText("TT06 – Gian đổi quà");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expand.click();
  await page.getByRole("dialog").getByRole("button", { name: "Xong", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("English map labels and expanded controls stay localized", async ({ page }) => {
  await page.goto("/en/booths");
  await page.getByRole("button", { name: "Expand", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Gift collection", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
