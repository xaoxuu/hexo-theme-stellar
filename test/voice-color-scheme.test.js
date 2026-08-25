"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../source/js/plugins/voice.js"), "utf8");

function load() {
  const context = vm.createContext({ console });
  vm.runInContext(source, context, { filename: "source/js/plugins/voice.js" });
  return context;
}

test("Voice 配色优先使用显式 data-theme，auto 才跟随系统", () => {
  const context = load();
  const attributes = new Map();
  const documentRef = { documentElement: { getAttribute: key => attributes.get(key) || null } };
  const mediaQuery = { matches: true };

  assert.equal(context.isDarkColorScheme(documentRef, mediaQuery), true);
  attributes.set("data-theme", "light");
  assert.equal(context.isDarkColorScheme(documentRef, mediaQuery), false);
  attributes.set("data-theme", "dark");
  mediaQuery.matches = false;
  assert.equal(context.isDarkColorScheme(documentRef, mediaQuery), true);
});

test("Voice 配色监听器同时清理文档事件与系统监听", () => {
  const context = load();
  const calls = [];
  const documentRef = {
    addEventListener(type) { calls.push(`document:add:${type}`); },
    removeEventListener(type) { calls.push(`document:remove:${type}`); }
  };
  const mediaQuery = {
    addEventListener(type) { calls.push(`media:add:${type}`); },
    removeEventListener(type) { calls.push(`media:remove:${type}`); }
  };
  const cleanup = context.listenColorScheme(documentRef, mediaQuery, () => {});
  cleanup();
  assert.deepEqual(calls, [
    "document:add:stellar:color-scheme-change",
    "media:add:change",
    "document:remove:stellar:color-scheme-change",
    "media:remove:change"
  ]);
});
