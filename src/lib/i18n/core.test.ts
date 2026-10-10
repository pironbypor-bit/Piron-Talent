import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLocale, translate } from "./core.ts";

test("falls back to English and fills values", () => {
  assert.equal(translate(null, "{n} quotes", { n: 3 }), "3 quotes");
  assert.equal(translate({ "{n} quotes": "{n} X" }, "{n} quotes", { n: 3 }), "3 X");
  assert.equal(translate(null, "Open@@status"), "Open");
});

test("locale: the device's cookie, else Khmer", () => {
  assert.equal(resolveLocale("km"), "km");
  assert.equal(resolveLocale("en"), "en");
  assert.equal(resolveLocale(null), "km");
  assert.equal(resolveLocale("fr"), "km");
});
