"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.resolve(__dirname, "../source/js/main.js"), "utf8")
  .split("// 通用平滑滚动")[0];

function node() {
  return {
    attributes: {},
    dataset: {},
    hidden: false,
    checked: false,
    textContent: "",
    value: "",
    blurCount: 0,
    focusCount: 0,
    dispatchCount: 0,
    classList: {
      add() {},
      remove() {},
      toggle() { return false; }
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    blur() { this.blurCount += 1; },
    focus() { this.focusCount += 1; },
    dispatchEvent() { this.dispatchCount += 1; return true; },
    querySelector() { return null; }
  };
}

function runtime({ local = true } = {}) {
  const input = node();
  input.attributes["aria-label"] = "站内搜索";
  input.dataset.searchAllPlaceholder = "站内搜索";
  input.dataset.searchBlogPlaceholder = "在 博客 中搜索";
  const wrapper = node();
  const result = node();
  result.replaceChildren = function () { this.cleared = true; };
  const group = node();
  const allOption = node();
  const blogOption = node();
  const currentOption = node();
  const allRadio = node();
  const blogRadio = node();
  const currentRadio = node();
  const currentLabel = node();
  allRadio.name = blogRadio.name = currentRadio.name = "site-search-scope";
  allRadio.value = "all";
  blogRadio.value = "blog";
  currentRadio.value = "current";
  allOption.querySelector = selector => selector === 'input[type="radio"]' ? allRadio : null;
  blogOption.querySelector = selector => selector === 'input[type="radio"]' ? blogRadio : null;
  currentOption.querySelector = selector => {
    if (selector === 'input[type="radio"]') return currentRadio;
    if (selector === "[data-search-scope-current-label]") return currentLabel;
    return null;
  };

  const dialogListeners = {};
  const dialog = node();
  dialog.open = false;
  dialog.showModal = function () { this.open = true; };
  dialog.close = function () { this.open = false; };
  dialog.addEventListener = (type, listener) => { dialogListeners[type] = listener; };
  dialog.querySelector = selector => ({
    ".search-input": input,
    ".search-wrapper": wrapper,
    ".search-result": result,
    ".search-dialog__scope": local ? group : null,
    '[data-search-scope-option="all"]': local ? allOption : null,
    '[data-search-scope-option="blog"]': local ? blogOption : null,
    '[data-search-scope-option="current"]': local ? currentOption : null
  })[selector] || null;

  const shell = node();
  const root = node();
  root.dataset.leftbarState = "expanded";
  const documentListeners = {};
  const document = {
    documentElement: root,
    activeElement: node(),
    getElementById(id) { return id === "site-search-dialog" ? dialog : null; },
    querySelector(selector) { return selector === ".site-shell" ? shell : null; },
    querySelectorAll() { return []; },
    addEventListener(type, listener) { documentListeners[type] = listener; }
  };
  const context = {
    console,
    document,
    window: {
      matchMedia() {
        return { matches: false, addEventListener() {} };
      }
    },
    localStorage: { setItem() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout,
    Event: class Event {
      constructor(type, options) {
        this.type = type;
        this.bubbles = options?.bubbles === true;
      }
    },
    ctx: { date_suffix: {} }
  };
  vm.runInNewContext(
    `${SOURCE}\nthis.__search = { openSearch, applySearchScope, configureSearchScope };`,
    context
  );
  return {
    controller: context.__search,
    dialog,
    dialogListeners,
    documentListeners,
    group,
    input,
    options: { all: allOption, blog: blogOption, current: currentOption },
    radios: { all: allRadio, blog: blogRadio, current: currentRadio },
    currentLabel
  };
}

function dispatchShellClick(state, trigger) {
  trigger.closest = selector => selector === '[data-shell-action]' ? trigger : null;
  state.documentListeners.click({
    target: trigger,
    preventDefault() {}
  });
}

test("搜索浮层仅在键盘打开后恢复触发按钮焦点", () => {
  const pointerState = runtime();
  const pointerTrigger = node();
  pointerTrigger.dataset.shellAction = "open-search";
  pointerState.documentListeners.pointerdown();
  dispatchShellClick(pointerState, pointerTrigger);
  const pointerClose = node();
  pointerClose.dataset.shellAction = "close-search";
  dispatchShellClick(pointerState, pointerClose);
  assert.equal(pointerTrigger.focusCount, 0);
  assert.equal(pointerTrigger.blurCount, 1);

  const keyboardState = runtime();
  const keyboardTrigger = node();
  keyboardTrigger.dataset.shellAction = "open-search";
  keyboardState.documentListeners.keydown({ key: "Enter" });
  dispatchShellClick(keyboardState, keyboardTrigger);
  const keyboardClose = node();
  keyboardClose.dataset.shellAction = "close-search";
  dispatchShellClick(keyboardState, keyboardClose);
  assert.equal(keyboardTrigger.focusCount, 1);
  assert.equal(keyboardTrigger.blurCount, 0);
});

test("Topic 打开时显示三选项并默认当前专栏", () => {
  const state = runtime();
  state.controller.openSearch({
    dataset: {
      searchDomain: "topic:stellar",
      searchDomainLabel: "Stellar 专栏",
      searchDomainBlog: "true",
      searchPlaceholder: "在 Stellar 专栏 中搜索"
    }
  });

  assert.equal(state.group.hidden, false);
  assert.equal(state.options.blog.hidden, false);
  assert.equal(state.options.current.hidden, false);
  assert.equal(state.radios.current.checked, true);
  assert.equal(state.currentLabel.textContent, "Stellar 专栏");
  assert.equal(state.input.dataset.domain, "topic:stellar");
  assert.equal(state.input.placeholder, "在 Stellar 专栏 中搜索");
});

test("切换搜索域保留关键词、更新 placeholder 并立即重搜", () => {
  const state = runtime();
  state.controller.openSearch({
    dataset: {
      searchDomain: "topic:stellar",
      searchDomainLabel: "Stellar 专栏",
      searchDomainBlog: "true",
      searchPlaceholder: "在 Stellar 专栏 中搜索"
    }
  });
  state.input.value = "配置";

  state.dialogListeners.change({ target: state.radios.blog });
  assert.equal(state.input.value, "配置");
  assert.equal(state.input.dataset.domain, "blog");
  assert.equal(state.input.dataset.algoliaFilterPath, undefined);
  assert.equal(state.input.placeholder, "在 博客 中搜索");
  assert.equal(state.input.dispatchCount, 1);

  state.dialogListeners.change({ target: state.radios.all });
  assert.equal(state.input.value, "配置");
  assert.equal(state.input.dataset.domain, "");
  assert.equal(state.input.placeholder, "站内搜索");
  assert.equal(state.input.dispatchCount, 2);
});

test("Wiki 显示双选项，独立 Page 隐藏整行并回到全站", () => {
  const state = runtime();
  state.controller.openSearch({
    dataset: {
      searchDomain: "wiki:stellar",
      searchDomainLabel: "Stellar",
      searchDomainBlog: "false",
      searchPlaceholder: "在 Stellar 中搜索"
    }
  });
  assert.equal(state.group.hidden, false);
  assert.equal(state.options.blog.hidden, true);
  assert.equal(state.options.current.hidden, false);
  assert.equal(state.input.dataset.domain, "wiki:stellar");
  assert.equal(state.input.dataset.algoliaFilterPath, undefined);

  state.controller.openSearch({ dataset: {} });
  assert.equal(state.group.hidden, true);
  assert.equal(state.input.dataset.domain, "");
  assert.equal(state.input.dataset.algoliaFilterPath, undefined);
  assert.equal(state.input.placeholder, "站内搜索");
});

test("Blog 显示全站与博客并在每次打开时重置为博客", () => {
  const state = runtime();
  const trigger = {
    dataset: {
      searchDomain: "blog",
      searchDomainLabel: "博客",
      searchDomainBlog: "true",
      searchPlaceholder: "在 博客 中搜索"
    }
  };
  state.controller.openSearch(trigger);
  state.controller.applySearchScope(state.dialog, "all");
  assert.equal(state.input.dispatchCount, 0);
  state.controller.openSearch(trigger);

  assert.equal(state.group.hidden, false);
  assert.equal(state.options.blog.hidden, false);
  assert.equal(state.options.current.hidden, true);
  assert.equal(state.radios.blog.checked, true);
  assert.equal(state.input.dataset.domain, "blog");
});

test("Algolia 没有搜索域行并保持现有 URL filter", () => {
  const state = runtime({ local: false });
  state.controller.openSearch({
    dataset: {
      algoliaFilterPath: "/wiki/stellar/",
      searchPlaceholder: "在 Stellar 中搜索"
    }
  });
  assert.equal(state.input.dataset.algoliaFilterPath, "/wiki/stellar/");
  assert.equal(state.input.placeholder, "在 Stellar 中搜索");
});
