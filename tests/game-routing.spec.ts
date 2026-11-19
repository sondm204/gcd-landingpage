import { test, expect } from "./game-fixture";

test("game routes share the locale layout and preserve tab and anchor when switching", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/en/game?tab=online#chon-chang");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html html")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Heritage Passport", exact: true })).toHaveAttribute("href", "/en/game");
  await expect(page.locator(".game-stageCard:visible")).toHaveCount(5);
  await page.getByRole("button", { name: "Tiếng Việt", exact: true }).click();
  await expect(page).toHaveURL(/\/game\?tab=online#chon-chang$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator(".game-stageCard:visible")).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("English game navigation keeps the locale and hides the header only inside games", async ({ page }) => {
  await page.goto("/en/game");
  await page.locator('.game-stageCard[data-stage="craft"]').click();
  const play = page.locator("dialog[open] .game-craftPlay");
  await expect(play).toHaveAttribute("href", "/en/game/craft-shop?mode=online");
  await play.click();
  await expect(page).toHaveURL(/\/en\/game\/craft-shop\?mode=online$/);
  await expect(page.locator(".craft-intro")).toBeVisible();
  await expect(page.locator(".site-header")).toHaveCount(0);
  await page.goto("/en/game/leaderboard");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.getByRole("link", { name: "Heritage Passport", exact: true })).toHaveAttribute("href", "/en/game");
});

test("localized passport admin sign-in preserves the pending gift QR", async ({ page }) => {
  const code = "ab".repeat(32);
  await page.route("**/api/game/passport/admin", route => route.fulfill({ status: 401, json: { error: "Đăng nhập quản trị để tiếp tục." } }));
  await page.goto(`/en/game/admin#card=${code}`);
  const login = page.getByRole("link", { name: "Đăng nhập quản trị →", exact: true });
  await expect(login).toHaveAttribute("href", `/en/game/admin/login#card=${code}`);
  await login.click();
  await expect(page).toHaveURL(`/en/game/admin/login#card=${code}`);
  await expect(page.getByRole("button", { name: "Admin sign-in", exact: true })).toBeVisible();
  await expect(page.locator(".game-account-gate")).toHaveCount(0);
});
