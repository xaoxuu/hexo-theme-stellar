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
  const trigger = options.hasInput === false ? null : {
    clickCount: 0,
    click() { this.clickCount += 1; },
  };
  const leftbarToggle = {};
  const document = {
    readyState: options.readyState || 'complete',
    querySelector(selector) {
      if (selector === '[data-shell-action="open-search"]') return trigger;
      return selector === '[data-shell-action="toggle-leftbar-drawer"]' ? leftbarToggle : null;
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    removeEventListener(type, handler) {
      if (listeners[type] === handler) delete listeners[type];
    },
  };
  const window = {
    getComputedStyle() {
      return { display: options.narrow ? 'block' : 'none' };
    },
  };

  vm.runInNewContext(SHORTCUT_SOURCE, { document, window });
  const cleanup = window.stellarSearchShortcut.mount(document);

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

  return { trigger, listeners, dispatch, cleanup };
}

test('所有断点 Command+K 与 Ctrl+K 打开共享搜索浮层', () => {
  for (const modifiers of [{ metaKey: true }, { ctrlKey: true }]) {
    const runtime = createRuntime();
    const state = runtime.dispatch(modifiers);

    assert.equal(state.prevented, true);
    assert.equal(runtime.trigger.clickCount, 1);
  }
  const narrowRuntime = createRuntime({ narrow: true });
  assert.equal(narrowRuntime.dispatch({ ctrlKey: true }).prevented, true);
  assert.equal(narrowRuntime.trigger.clickCount, 1);
});

test('搜索框已聚焦时不抢占编辑快捷键', () => {
  const runtime = createRuntime();
  const state = runtime.dispatch({ ctrlKey: true, target: { closest() { return {}; } } });

  assert.equal(state.prevented, false);
  assert.equal(runtime.trigger.clickCount, 0);
});

test('搜索入口缺失时保留浏览器默认行为', () => {
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
  assert.equal(editableRuntime.trigger.clickCount, 0);

  const composingRuntime = createRuntime();
  const composingState = composingRuntime.dispatch({ ctrlKey: true, isComposing: true });
  assert.equal(composingState.prevented, false);
  assert.equal(composingRuntime.trigger.clickCount, 0);
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
    assert.equal(runtime.trigger.clickCount, 0);
  });
});

test('显式 mount 只注册一个键盘监听器且 cleanup 可释放', () => {
  const runtime = createRuntime();
  assert.equal(typeof runtime.listeners.keydown, 'function');
  runtime.cleanup();
  assert.equal(runtime.listeners.keydown, undefined);
});
