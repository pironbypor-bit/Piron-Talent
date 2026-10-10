import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLocale, translate } from "./core.ts";

test("falls back to English and fills values", () => {
  assert.equal(translate(null, "{n} quotes", { n: 3 }), "3 quotes");
  assert.equal(translate({ "{n} quotes": "{n} X" }, "{n} quotes", { n: 3 }), "3 X");
  assert.equal(translate(null, "Open@@status"), "Open");
});

test("locale: cookie, then browser language, then English", () => {
  assert.equal(resolveLocale("km", "en-US"), "km");
  assert.equal(resolveLocale(null, "km-KH,en;q=0.8"), "km");
  assert.equal(resolveLocale(null, "th-TH"), "en");
  assert.equal(resolveLocale("fr", null), "en");
});
