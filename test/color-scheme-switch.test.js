"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function createFixture(options = {}) {
  const attributes = new Map();
  if (options.theme) attributes.set("data-theme", options.theme);
  const events = [];
  const mediaListeners = new Set();
  const mediaQuery = {
    matches: options.systemDark === true,
    addEventListener(type, handler) { if (type === "change") mediaListeners.add(handler); },
    removeEventListener(type, handler) { if (type === "change") mediaListeners.delete(handler); }
  };
  const values = new Map();
  if (options.stored !== undefined) values.set("Stellar.colorScheme", options.stored);
  const storage = {
    getItem(key) {
      if (options.storageFailure) throw new Error("denied");
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (options.storageFailure) throw new Error("denied");
      values.set(key, value);
    }
  };
  const windowRef = {
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init.detail; }
    },
    matchMedia() { return mediaQuery; }
  };
  if (options.storageGetterFailure) {
    Object.defineProperty(windowRef, "localStorage", { get() { throw new Error("denied"); } });
  } else {
    windowRef.localStorage = storage;
  }
  const documentRef = {
    nodeType: 9,
    defaultView: windowRef,
    documentElement: {
      getAttribute(name) { return attributes.get(name) || null; },
      setAttribute(name, value) { attributes.set(name, value); },
      removeAttribute(name) { attributes.delete(name); }
    },
    dispatchEvent(event) { events.push(event); }
  };
  return { documentRef, windowRef, mediaQuery, mediaListeners, values, attributes, events };
}

async function loadModule() {
  const file = pathToFileURL(path.join(__dirname, "../source/js/runtime/extensions/color-scheme-switch.mjs"));
  return import(`${file.href}?test=${Date.now()}-${Math.random()}`);
}

function context(toasts) {
  return {
    extension: { config: { messages: { light: "Light", dark: "Dark", auto: "Auto" } } },
    legacy: { stellar: { toast(message) { toasts.push(message); } } }
  };
}

test("color-scheme-switch 恢复合法缓存并直接设置确定状态", async () => {
  const module = await loadModule();
  const fixture = createFixture({ stored: "dark", systemDark: false });
  const toasts = [];
  const cleanup = module.mount(fixture.documentRef, context(toasts));

  assert.equal(fixture.attributes.get("data-theme"), "dark");
  assert.equal(typeof fixture.windowRef.setColorScheme, "function");
  assert.equal(fixture.events.at(-1).detail.resolvedMode, "dark");
  assert.deepEqual(toasts, []);

  assert.equal(fixture.windowRef.setColorScheme("light"), "light");
  assert.equal(fixture.attributes.get("data-theme"), "light");
  assert.equal(fixture.values.get("Stellar.colorScheme"), "light");
  assert.equal(toasts.at(-1), "Light");

  fixture.windowRef.setColorScheme("auto");
  assert.equal(fixture.attributes.has("data-theme"), false);
  assert.equal(fixture.events.at(-1).detail.mode, "auto");
  assert.throws(() => fixture.windowRef.setColorScheme("system"), /unsupported mode system/);

  cleanup();
  assert.equal("setColorScheme" in fixture.windowRef, false);
  assert.equal(fixture.mediaListeners.size, 0);
});

test("color-scheme-switch 忽略非法缓存并降级处理存储异常", async () => {
  const module = await loadModule();
  const invalid = createFixture({ stored: "sepia", theme: "light" });
  const cleanupInvalid = module.mount(invalid.documentRef, context([]));
  assert.equal(invalid.attributes.get("data-theme"), "light");
  cleanupInvalid();

  const denied = createFixture({ storageGetterFailure: true, systemDark: true });
  const cleanupDenied = module.mount(denied.documentRef, context([]));
  assert.doesNotThrow(() => denied.windowRef.setColorScheme("dark"));
  cleanupDenied();
});

test("color-scheme-switch 仅在 auto 下响应系统配色变化", async () => {
  const module = await loadModule();
  const fixture = createFixture({ systemDark: false });
  const cleanup = module.mount(fixture.documentRef, context([]));
  const listener = [...fixture.mediaListeners][0];
  const initialCount = fixture.events.length;
  fixture.mediaQuery.matches = true;
  listener();
  assert.equal(fixture.events.length, initialCount + 1);
  assert.equal(fixture.events.at(-1).detail.resolvedMode, "dark");

  fixture.windowRef.setColorScheme("light");
  const explicitCount = fixture.events.length;
  listener();
  assert.equal(fixture.events.length, explicitCount);
  cleanup();
});
