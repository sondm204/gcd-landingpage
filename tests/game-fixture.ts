import { test as base, expect } from "@playwright/test";
export type { Page } from "@playwright/test";
// Client gameplay regressions use an isolated account transport. Real Next.js auth/replay
// is covered by scripts/test-games-app.mjs, and database races by test-booths-db.mjs.
export const test = base.extend({ page: async ({ page }, runFixture) => {
  await page.route("**/api/game/**", async route => {
    const url = new URL(route.request().url());
    let body: unknown = {};
    if (url.pathname === "/api/game/session") body = { player: { id: "11111111-1111-4111-8111-111111111111", display_name: "Gameplay Tester" }, usage: [] };
    else if (url.pathname === "/api/game/attempts") { const request = route.request().postDataJSON(); body = { attempt: { id: "22222222-2222-4222-8222-222222222222", seed: 0, game: request.game, mode: request.mode, attempt_number: 1, status: "started", started_at: new Date().toISOString() } }; }
    else if (url.pathname.startsWith("/api/game/attempts/")) body = { score: 100 };
    else if (url.pathname === "/api/game/leaderboard") body = { entries: [], total: 0 };
    await route.fulfill({ json: body });
  });
  await runFixture(page);
} });
export { expect };
