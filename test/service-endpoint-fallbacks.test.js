"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    },
    contains(name) { return values.has(name); }
  };
}

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function consoleSpy() {
  const calls = [];
  return {
    calls,
    console: {
      error(...args) { calls.push(["error", ...args]); },
      warn(...args) { calls.push(["warn", ...args]); }
    }
  };
}

function loadScript(relativePath, extra = {}) {
  const listeners = new Map();
  const window = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    dispatchEvent() {}
  };
  const context = vm.createContext(Object.assign({
    window,
    document: { readyState: "loading", querySelectorAll() { return []; } },
    localStorage: storage(),
    fetch: async () => { throw new Error("offline"); },
    console
  }, extra));
  vm.runInContext(fs.readFileSync(path.join(ROOT, relativePath), "utf8"), context, { filename: relativePath });
  return { context, listeners };
}

function ratingElement() {
  const stars = Array.from({ length: 5 }, (_, index) => ({
    dataset: { value: String(index + 1) },
    classList: classList(),
    addEventListener() {}
  }));
  const avg = { textContent: "(0.0)" };
  const count = { textContent: "0" };
  return {
    dataset: { id: "post", api: "https://rating.example.com" },
    classList: classList(),
    querySelectorAll(selector) { return selector === ".star" ? stars : []; },
    querySelector(selector) {
      if (selector === ".avg") return avg;
      if (selector === ".count") return count;
      return null;
    },
    stars,
    avg,
    count
  };
}

function voteElement() {
  const up = { textContent: "0" };
  const down = { textContent: "0" };
  const upButton = { classList: classList(), addEventListener() {} };
  const downButton = { classList: classList(), addEventListener() {} };
  return {
    dataset: { id: "post", api: "https://vote.example.com" },
    classList: classList(),
    querySelector(selector) {
      if (selector === ".up") return up;
      if (selector === ".down") return down;
      if (selector === ".vote-up") return upButton;
      if (selector === ".vote-down") return downButton;
      return null;
    },
    up,
    down,
    upButton,
    downButton
  };
}

function flush() {
  return new Promise(resolve => setImmediate(resolve));
}

test("Site Info 对网络和响应解析失败保持静默", async () => {
  for (const mode of ["network", "json"]) {
    const spy = consoleSpy();
    let caught = false;
    const utils = {
      request(_element, _url, callback) {
        const promise = mode === "network"
          ? Promise.reject(new Error("offline"))
          : Promise.resolve().then(() => callback({ json: async () => { throw new Error("invalid json"); } }));
        const originalCatch = promise.catch.bind(promise);
        promise.catch = handler => {
          caught = true;
          return originalCatch(handler);
        };
        return promise;
      }
    };
    const { context } = loadScript("source/js/services/siteinfo.js", { utils, console: spy.console });
    const link = {
      nodeType: 1,
      dataset: { api: "https://site.example.com" },
      removeAttribute() {},
      getAttribute() { return "title,icon,desc"; },
      querySelector() { return null; }
    };
    context.setCardLink([link]);
    await flush();
    assert.equal(caught, true);
    assert.deepEqual(spy.calls, []);
  }
});

test("Rating 成功加载，远程失败静默并撤销乐观状态", async () => {
  const spy = consoleSpy();
  let response = {
    ok: true,
    status: 200,
    json: async () => ({ rating: { 5: 2, 3: 1 } })
  };
  const { context } = loadScript("source/js/services/rating.js", {
    console: spy.console,
    fetch: async () => response
  });
  const element = ratingElement();
  await context.loadRating(element);
  assert.equal(element.avg.textContent, "(4.3)");
  assert.equal(element.count.textContent, "3");

  response = { ok: false, status: 503, json: async () => ({}) };
  await context.loadRating(element);
  assert.equal(element.avg.textContent, "(4.3)");

  context.fetch = async () => { throw new Error("offline"); };
  await context.submitRating(element, "5");
  assert.equal(context.localStorage.getItem("rating-post"), null);
  assert.equal(element.classList.contains("rated"), false);
  assert.deepEqual(spy.calls, []);
});

test("Vote 成功加载，解析和提交失败静默并回滚", async () => {
  const spy = consoleSpy();
  let response = {
    ok: true,
    status: 200,
    json: async () => ({ votes: { up: 4, down: 2 } })
  };
  const { context } = loadScript("source/js/services/vote.js", {
    console: spy.console,
    fetch: async () => response
  });
  const element = voteElement();
  await context.loadVote(element);
  assert.equal(element.up.textContent, 4);
  assert.equal(element.down.textContent, 2);

  response = { ok: true, status: 200, json: async () => { throw new Error("invalid json"); } };
  await context.loadVote(element);
  assert.equal(element.up.textContent, 4);
  assert.equal(element.down.textContent, 2);

  context.fetch = async () => ({ ok: false, status: 503 });
  context.submitVote(element, "up");
  await flush();
  assert.equal(element.up.textContent, 4);
  assert.equal(context.localStorage.getItem("vote-post"), null);
  assert.equal(element.classList.contains("voted"), false);
  assert.deepEqual(spy.calls, []);
});
