"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("settings contribution follows the optional mount contract", async () => {
  const file = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/settings.js"));
  const module = await import(`${file.href}?test=${Date.now()}`);

  assert.equal(typeof module.mount, "function");
  assert.equal(module.mount({ querySelector: () => null }, {}), undefined);
});
