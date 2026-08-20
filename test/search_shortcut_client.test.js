'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SHORTCUT_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/search/shortcut.js'),
  'utf8'
);

function createRuntime(options = {}) {
  const listeners = {};
  const input = options.hasInput === false ? null : {
    value: 'Stellar',
    selectionStart: 2,
    selectionEnd: 5,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    closest() {
      return this;
    },
  };
  const leftbarToggle = {};
  const document = {
    readyState: options.readyState || 'complete',
    getElementById(id) {
      return id === 'search-input' ? input : null;
    },
    querySelector(selector) {
      return selector === '.mobile-only.leftbar-toggle' ? leftbarToggle : null;
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
  };
  const window = {
    getComputedStyle() {
      return { display: options.narrow ? 'block' : 'none' };
    },
  };

  vm.runInNewContext(SHORTCUT_SOURCE, { document, window });

  function dispatch(overrides = {}) {
    const state = { prevented: false };
    const event = {
      key: 'k',
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      isComposing: false,
      defaultPrevented: false,
      target: {
        closest() {
          return null;
        },
      },
      preventDefault() {
        state.prevented = true;
      },
      ...overrides,
    };
    listeners.keydown(event);
    return state;
  }

  return { input, listeners, dispatch };
}

test('桌面端 Command+K 与 Ctrl+K 聚焦搜索框并保留输入状态', () => {
  for (const modifiers of [{ metaKey: true }, { ctrlKey: true }]) {
    const runtime = createRuntime();
    const state = runtime.dispatch(modifiers);

    assert.equal(state.prevented, true);
    assert.equal(runtime.input.focusCount, 1);
    assert.equal(runtime.input.value, 'Stellar');
    assert.equal(runtime.input.selectionStart, 2);
    assert.equal(runtime.input.selectionEnd, 5);
  }
});

test('搜索框已聚焦时仍阻止浏览器接管快捷键', () => {
  const runtime = createRuntime();
  const state = runtime.dispatch({ ctrlKey: true, target: runtime.input });

  assert.equal(state.prevented, true);
  assert.equal(runtime.input.focusCount, 1);
});

test('窄屏或搜索框缺失时保留浏览器默认行为', () => {
  const narrowRuntime = createRuntime({ narrow: true });
  const narrowState = narrowRuntime.dispatch({ ctrlKey: true });
  assert.equal(narrowState.prevented, false);
  assert.equal(narrowRuntime.input.focusCount, 0);

  const missingRuntime = createRuntime({ hasInput: false });
  const missingState = missingRuntime.dispatch({ ctrlKey: true });
  assert.equal(missingState.prevented, false);
});

test('其它编辑区域与输入法组合状态不接管快捷键', () => {
  const editableRuntime = createRuntime();
  const editableTarget = {
    closest() {
      return {};
    },
  };
  const editableState = editableRuntime.dispatch({ ctrlKey: true, target: editableTarget });
  assert.equal(editableState.prevented, false);
  assert.equal(editableRuntime.input.focusCount, 0);

  const composingRuntime = createRuntime();
  const composingState = composingRuntime.dispatch({ ctrlKey: true, isComposing: true });
  assert.equal(composingState.prevented, false);
  assert.equal(composingRuntime.input.focusCount, 0);
});

test('错误按键、附加修饰键和已处理事件不触发搜索', () => {
  const cases = [
    { key: 'j', ctrlKey: true },
    { key: 'k' },
    { key: 'k', ctrlKey: true, altKey: true },
    { key: 'k', metaKey: true, shiftKey: true },
    { key: 'k', ctrlKey: true, defaultPrevented: true },
  ];

  cases.forEach((event) => {
    const runtime = createRuntime();
    const state = runtime.dispatch(event);
    assert.equal(state.prevented, false);
    assert.equal(runtime.input.focusCount, 0);
  });
});

test('脚本在 DOM 就绪后只注册一个键盘监听器', () => {
  const runtime = createRuntime({ readyState: 'loading' });
  assert.equal(typeof runtime.listeners.DOMContentLoaded, 'function');
  assert.equal(runtime.listeners.keydown, undefined);

  runtime.listeners.DOMContentLoaded();
  assert.equal(typeof runtime.listeners.keydown, 'function');
});
