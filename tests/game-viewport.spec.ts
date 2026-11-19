import { test, expect } from "./game-fixture";

const games = [
  { route: "craft-shop", prefix: "craft" },
  { route: "dong-ho", prefix: "print" },
  { route: "rhythm", prefix: "rhythm" },
  { route: "place", prefix: "place" },
  { route: "postcard", prefix: "post" },
];
for (const height of [568, 740]) {
  test(`game introductions and play controls fit a phone at ${height}px without fullscreen`, async ({ page }) => {
    await page.setViewportSize({ width: height === 568 ? 320 : 390, height });
    await page.addInitScript(() => Object.defineProperty(document, "fullscreenEnabled", { value: false }));
    for (const { route, prefix } of games) {
      await page.goto(`/game/${route}`);
      const intro = page.locator(`.${prefix}-intro`);
      const start = intro.locator(`.${prefix}-primary`);
      await expect(start).toBeVisible();
      expect((await start.boundingBox())!.y).toBeGreaterThan(0);
      expect((await start.boundingBox())!.y + (await start.boundingBox())!.height, `${route} start button`).toBeLessThanOrEqual(height);
      expect(await page.evaluate(() => document.documentElement.scrollHeight), `${route} intro overflow`).toBeLessThanOrEqual(height);
      await page.locator(".game-help-trigger").click();
      await expect(page.locator(".game-help-dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".game-help-dialog")).not.toBeVisible();
      await page.screenshot({ path: `test-results/${route}-intro-${height}.png` });
      if (route === "postcard") continue;
      await start.click();
      const frame = page.locator(`.${prefix}-app`);
      const action = page.locator(route === "craft-shop" ? ".craft-delivery > .craft-primary" : route === "dong-ho" ? ".print-tray" : route === "rhythm" ? ".rhythm-pads" : ".place-bottom > .place-primary");
      await expect(frame).not.toHaveAttribute("data-phase", "ready");
      await expect(action).toBeVisible();
      expect((await action.boundingBox())!.y + (await action.boundingBox())!.height, `${route} play controls`).toBeLessThanOrEqual(height);
      expect(await page.evaluate(() => document.documentElement.scrollHeight), `${route} play overflow`).toBeLessThanOrEqual(height);
      // Browser bars can reduce the visible viewport independently of the layout viewport.
      await page.evaluate(() => {
        const visible = window.innerHeight - 70;
        Object.defineProperty(window.visualViewport!, "height", { configurable: true, value: visible });
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
      await expect(frame).toHaveCSS("height", `${height - 70}px`);
      expect((await action.boundingBox())!.y + (await action.boundingBox())!.height, `${route} controls with browser bars`).toBeLessThanOrEqual(height - 70);
      if (route === "craft-shop") {
        const shelf = await page.locator(".craft-shelf").boundingBox();
        const delivery = await page.locator(".craft-delivery").boundingBox();
        expect(shelf!.y + shelf!.height).toBeLessThanOrEqual(delivery!.y);
        for (const item of await page.locator(".craft-product svg").all()) expect((await item.boundingBox())!.height).toBeGreaterThan(20);
      }
      await page.screenshot({ path: `test-results/${route}-play-${height}.png` });
      await frame.locator('a[href="/game"]').first().click();
      await expect(page).toHaveURL(/\/game$/);
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    }
  });
}
