"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("reveal contribution keeps the runtime mount contract when no targets exist", async () => {
  const file = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/reveal.js"));
  const module = await import(`${file.href}?test=${Date.now()}`);
  const cleanup = module.mount({
    querySelectorAll: () => [],
    defaultView: {}
  });

  assert.equal(typeof cleanup, "function");
  assert.doesNotThrow(cleanup);
});
