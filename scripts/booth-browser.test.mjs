import assert from "node:assert/strict";
import { test } from "node:test";
import { isEmbeddedBrowser } from "../lib/booths/browser.ts";

test("detects host app and Android/iOS WebView hints", () => {
  for (const ua of [
    "Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 Version/4.0 Chrome/125.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1 Zalo",
    "Mozilla/5.0 FBAN/FBIOS", "Mozilla/5.0 Instagram", "Mozilla/5.0 MicroMessenger", "Mozilla/5.0 Line/14.0",
  ]) assert.equal(isEmbeddedBrowser(ua), true, ua);
});

test("does not classify ordinary mobile or desktop browsers as WebViews", () => {
  for (const ua of [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/125.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/125.0 Safari/537.36", "",
  ]) assert.equal(isEmbeddedBrowser(ua), false, ua);
});
