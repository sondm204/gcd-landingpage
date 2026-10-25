import { test, expect } from "@playwright/test";

test("Sketchfab autoplay, camera controls and responsive embed", async ({ page }) => {
  // Exercise our API integration without depending on Sketchfab availability.
  await page.route("https://static.sketchfab.com/api/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.Sketchfab = class {
      init(id, options) {
        let camera = { position: [0, -10, 6], target: [0, 0, 0] };
        const record = () => document.documentElement.dataset.testCamera = JSON.stringify(camera);
        document.documentElement.dataset.testOptions = JSON.stringify(options);
        record();
        options.success({
          start() { document.documentElement.dataset.testStarts = String(Number(document.documentElement.dataset.testStarts || 0) + 1); },
          stop() { document.documentElement.dataset.testStops = String(Number(document.documentElement.dataset.testStops || 0) + 1); },
          addEventListener(event, callback) { setTimeout(callback, 0); },
          recenterCamera(callback) { callback(null); },
          getCameraLookAt(callback) { callback(null, camera); },
          setCameraLookAt(position, target) { camera = { position, target }; record(); }
        });
      }
    };`,
  }));
  await page.route("https://sketchfab.com/models/**/embed**", (route) => route.fulfill({ body: "<html><body>3D viewer</body></html>", contentType: "text/html" }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  const frame = page.locator(".sketchfab-stage iframe");
  await expect(frame).toHaveAttribute("src", /transparent=1/);
  await expect(frame).toHaveAttribute("allowfullscreen", "");
  await expect(frame).toHaveAttribute("src", /autostart=1/);
  await expect(page.locator(".sketchfab-credit")).toHaveCount(0);
  const readCamera = () => page.locator("html").getAttribute("data-test-camera");
  const zoomIn = page.getByRole("button", { name: "Phóng to mô hình", exact: true });
  await expect(zoomIn).toBeEnabled();
  expect(Number(await page.locator("html").getAttribute("data-test-starts"))).toBeGreaterThan(0);
  const stops = await page.locator("html").getAttribute("data-test-stops");
  await page.locator("#khoi-hanh").scrollIntoViewIfNeeded();
  await page.locator("#khong-gian").scrollIntoViewIfNeeded();
  expect(await page.locator("html").getAttribute("data-test-stops")).toBe(stops);
  const initial = await readCamera();
  await zoomIn.click();
  expect(await readCamera()).not.toBe(initial);
  await page.getByRole("button", { name: "Thu nhỏ mô hình", exact: true }).click();
  const restored = JSON.parse((await readCamera())!);
  const original = JSON.parse(initial!);
  restored.position.forEach((value: number, index: number) => expect(value).toBeCloseTo(original.position[index], 6));
  await page.getByRole("button", { name: "Xoay trái", exact: true }).click();
  expect(await readCamera()).not.toBe(initial);
  await page.getByRole("button", { name: "Đặt lại góc nhìn", exact: true }).click();
  await expect.poll(readCamera).toBe(initial);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const box = await frame.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
    expect(box!.height).toBeGreaterThanOrEqual(width > 600 ? 338 : 298);
  }
  for (const item of [
    { tab: "02 Tháp Rùa", id: "a22adcd051914e2e911debf0730cab28", author: "minhduc26119931" },
    { tab: "03 Ngọ Môn", id: "4a1866001d034611a47b9116695da1d2", author: "Đào Minh Đức" },
    { tab: "04 Nhà hát Thành phố", id: "4267a8d941414589bc49f899c9c9d61f" },
    { tab: "05 Chùa Cầu", id: "59d89d40238c445f8316364b5fa45acd" },
    { tab: "06 Khuê Văn Các", id: "e448a20cb453475ab52b7a6486eae671" },
    { tab: "07 Lăng Tự Đức", id: "978f8e7afd9a4aebb738339c9f0087a0" },
    { tab: "08 Nhà thờ Chính toà", id: "b02a72b4468b4cceb1db4f2cc394d182" },
    { tab: "09 Trống đồng Đông Sơn", id: "7e38e31e0ac64f43a2035aecfc32f6b2" },
    { tab: "10 Nón lá", id: "08338678a712414fbdbf392e6d8ce53e" },
    { tab: "11 Bia tiến sĩ", id: "7aac2b6d65764a519fdbc71ceb03227f" },
    { tab: "01 Chùa Một Cột", id: "9b2562f8884141c0b1777e1a1c05887c", author: "inucaboo" },
  ]) {
    await page.getByRole("button", { name: item.tab, exact: true }).click();
    await expect(frame).toHaveAttribute("src", new RegExp(item.id));
    await expect(frame).toHaveCount(1);
    await expect(zoomIn).toBeEnabled();
    const before = await readCamera();
    await zoomIn.click();
    expect(await readCamera()).not.toBe(before);
    await page.getByRole("button", { name: "Đặt lại góc nhìn", exact: true }).click();
    await expect.poll(readCamera).toBe(before);
  }
});
