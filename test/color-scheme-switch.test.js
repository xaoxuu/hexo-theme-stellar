"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("color-scheme-switch contribution installs and removes its runtime entry", async () => {
  const file = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/color-scheme-switch.mjs"));
  const module = await import(`${file.href}?test=${Date.now()}`);
  const attributes = new Map();
  const listeners = new Set();
  const mediaQuery = {
    matches: false,
    addEventListener(_type, listener) { listeners.add(listener); },
    removeEventListener(_type, listener) { listeners.delete(listener); }
  };
  const windowRef = {
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init.detail; }
    },
    localStorage: { getItem: () => null, setItem() {} },
    matchMedia: () => mediaQuery
  };
  const documentRef = {
    nodeType: 9,
    defaultView: windowRef,
    documentElement: {
      getAttribute: name => attributes.get(name) || null,
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: name => attributes.delete(name)
    },
    dispatchEvent() {}
  };

  const cleanup = module.mount(documentRef, {
    extension: { config: { messages: {} } },
    legacy: { stellar: {} }
  });
  assert.equal(typeof windowRef.setColorScheme, "function");
  assert.equal(listeners.size, 1);

  cleanup();
  assert.equal("setColorScheme" in windowRef, false);
  assert.equal(listeners.size, 0);
});
