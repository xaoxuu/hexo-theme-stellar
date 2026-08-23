/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

test("图标 selector adapter 在卸载时中止未完成请求", () => {
  let aborted = false;
  let fetchOptions;
  class Controller {
    constructor() { this.signal = {}; }
    abort() { aborted = true; }
  }
  const icon = {
    isConnected: true,
    getAttribute() { return "default:test"; }
  };
  const script = { src: "https://example.com/js/icons.js?v=alpha" , getAttribute() { return ""; } };
  let adapter;
  const windowRef = {
    location: { href: "https://example.com/" },
    dispatchEvent(event) { adapter = event.detail; }
  };
  windowRef.window = windowRef;
  vm.runInNewContext(source("source/js/icons.js"), {
    AbortController: Controller,
    CustomEvent: class CustomEvent { constructor(_name, options) { this.detail = options.detail; } },
    URL,
    console,
    document: { currentScript: script },
    fetch(_url, options) { fetchOptions = options; return new Promise(() => {}); },
    window: windowRef
  });
  assert.equal(adapter.feature, "deferredIcons");
  const cleanup = adapter.mount({
    querySelectorAll() { return [icon]; }
  });
  assert.equal(fetchOptions.signal instanceof Object, true);
  cleanup();
  assert.equal(aborted, true);
});

test("dropdown selector adapter 卸载 observer、全局监听和 RAF", () => {
  const calls = [];
  class Observer {
    constructor() { calls.push("observer:new"); }
    observe() { calls.push("observer:observe"); }
    disconnect() { calls.push("observer:disconnect"); }
  }
  function eventTarget(name) {
    return {
      addEventListener(type) { calls.push(`${name}:add:${type}`); },
      removeEventListener(type) { calls.push(`${name}:remove:${type}`); }
    };
  }
  const body = {
    nodeType: 1,
    matches() { return false; },
    querySelectorAll() { return []; }
  };
  const documentRef = Object.assign(eventTarget("document"), {
    body,
    documentElement: { contains() { return true; }, clientWidth: 1024, clientHeight: 768 },
    createElement() { return { className: "", remove() {} }; }
  });
  const windowRef = Object.assign(eventTarget("window"), {
    MutationObserver: Observer,
    requestAnimationFrame() { calls.push("raf:add"); return 1; },
    cancelAnimationFrame() { calls.push("raf:cancel"); },
    visualViewport: eventTarget("viewport"),
    dispatchEvent(event) { this.adapter = event.detail; }
  });
  windowRef.window = windowRef;
  vm.runInNewContext(source("source/js/plugins/dropdown.js"), {
    CustomEvent: class CustomEvent { constructor(_name, options) { this.detail = options.detail; } },
    MutationObserver: Observer,
    console,
    document: documentRef,
    window: windowRef
  });
  assert.equal(windowRef.adapter.feature, "dropdown");
  const cleanup = windowRef.adapter.mount({ nodeType: 9, body });
  assert.equal(calls.includes("observer:observe"), true);
  cleanup();
  assert.equal(calls.includes("observer:disconnect"), true);
  assert.equal(calls.includes("document:remove:click"), true);
  assert.equal(calls.includes("window:remove:resize"), true);
  assert.equal(calls.includes("viewport:remove:scroll"), true);
});
