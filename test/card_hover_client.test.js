"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("card-hover contribution loads, mounts, and unmounts through the runtime adapter", async () => {
  const file = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/card-hover.js"));
  const module = await import(`${file.href}?test=${Date.now()}`);
  const calls = [];
  const previousWindow = globalThis.window;
  globalThis.window = {
    stellar: {
      cardHover: {
        mountAll(root) { calls.push(["mount", root]); },
        unmountAll(root) { calls.push(["unmount", root]); }
      }
    }
  };
  const root = {};
  try {
    const cleanup = await module.mount(root, {
      assets: { async script(asset) { calls.push(["asset", asset]); } },
      extension: { config: { assets: { js: "/card-hover.js" } } }
    });
    cleanup();
  } finally {
    globalThis.window = previousWindow;
  }

  assert.deepEqual(calls, [
    ["asset", "/card-hover.js"],
    ["mount", root],
    ["unmount", root]
  ]);
});
