'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CLIENT_SOURCE = fs.readFileSync(path.join(__dirname, '../source/js/plugins/card-hover.js'), 'utf8');

function createClassList(classes) {
  const values = new Set(classes);
  return {
    add(value) { values.add(value); },
    contains(value) { return values.has(value); },
    remove(value) { values.delete(value); }
  };
}

function createStyle() {
  const values = new Map();
  return {
    getPropertyValue(name) { return values.get(name) || ''; },
    removeProperty(name) { values.delete(name); },
    setProperty(name, value) { values.set(name, value); }
  };
}

function createCard() {
  const listeners = new Map();
  const children = [];
  let focusWithin = false;
  return {
    nodeType: 1,
    children,
    classList: createClassList(['card-hover', 'card-hover--spotlight', 'card-hover--tilt']),
    style: createStyle(),
    appendChild(child) {
      child.parentNode = this;
      children.push(child);
    },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 80 };
    },
    matches(selector) {
      if (selector === '.card-hover') return true;
      if (selector === ':focus-within') return focusWithin;
      return false;
    },
    querySelectorAll() { return []; },
    setFocusWithin(value) { focusWithin = value; },
    get listeners() { return listeners; }
  };
}

function createRuntime({ finePointer = true, reduceMotion = false } = {}) {
  const media = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const documentElement = {
    contains() { return true; },
    style: createStyle()
  };
  const document = {
    hidden: false,
    documentElement,
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    removeEventListener(type) { documentListeners.delete(type); },
    createElement() {
      const listeners = new Map();
      return {
        parentNode: null,
        addEventListener(type, listener) { listeners.set(type, listener); },
        removeEventListener(type) { listeners.delete(type); },
        setAttribute(name, value) { this[name] = value; },
        remove() {
          if (!this.parentNode) return;
          const index = this.parentNode.children.indexOf(this);
          if (index >= 0) this.parentNode.children.splice(index, 1);
          this.parentNode = null;
        },
        get listeners() { return listeners; }
      };
    },
    querySelectorAll() { return []; }
  };
  const stellar = {};
  const window = {
    CSS: { supports() { return true; } },
    stellar,
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type) { windowListeners.delete(type); },
    cancelAnimationFrame() {},
    matchMedia(query) {
      if (!media.has(query)) {
        const listeners = new Set();
        const mediaQuery = {
          matches: query.includes('prefers-reduced-motion') ? reduceMotion : finePointer,
          addEventListener(type, listener) { listeners.add(listener); },
          removeEventListener(type, listener) { listeners.delete(listener); },
          dispatch(matches) {
            this.matches = matches;
            listeners.forEach(listener => listener({ matches }));
          }
        };
        media.set(query, mediaQuery);
      }
      return media.get(query);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };
  const context = vm.createContext({
    console,
    ctx: { card_hover: { maxTilt: 3, spotlightColor: 'rgba(255, 255, 255, 0.25)' } },
    document,
    stellar,
    window
  });
  vm.runInContext(CLIENT_SOURCE, context);
  return { api: stellar.cardHover, document, documentListeners, media, windowListeners };
}

test('公开 mountAll/unmountAll/destroy 接口可挂载动态卡片并完整清理', () => {
  const card = createCard();
  const runtime = createRuntime();

  assert.equal(typeof runtime.api.mountAll, 'function');
  assert.equal(typeof runtime.api.unmountAll, 'function');
  assert.equal(typeof runtime.api.destroy, 'function');
  runtime.api.mountAll(card);

  assert.equal(card.classList.contains('is-card-hover-ready'), true);
  assert.equal(card.children.length, 1);
  const spotlight = card.children[0];
  assert.equal(spotlight.className, 'card-hover__spotlight');
  assert.equal(spotlight['aria-hidden'], 'true');
  assert.equal(spotlight.listeners.has('transitionend'), true);
  assert.deepEqual(Array.from(card.listeners.keys()).sort(), ['focusin', 'pointerenter', 'pointerleave', 'pointermove']);
  assert.equal(runtime.documentListeners.has('stellar:mdrender'), true);

  const dynamicCard = createCard();
  runtime.documentListeners.get('stellar:mdrender')({
    detail: {
      target: {
        nodeType: 1,
        matches() { return false; },
        querySelectorAll() { return [dynamicCard]; }
      }
    }
  });
  assert.equal(dynamicCard.classList.contains('is-card-hover-ready'), true);
  assert.equal(dynamicCard.children.length, 1);

  runtime.api.destroy();

  assert.equal(card.classList.contains('is-card-hover-ready'), false);
  assert.equal(card.children.length, 0);
  assert.equal(card.listeners.size, 0);
  assert.equal(spotlight.listeners.size, 0);
  assert.equal(dynamicCard.classList.contains('is-card-hover-ready'), false);
  assert.equal(dynamicCard.children.length, 0);
  assert.equal(dynamicCard.listeners.size, 0);
  assert.equal(runtime.documentListeners.size, 0);
  assert.equal(runtime.windowListeners.size, 0);
});

test('unmountAll(root) 仅清理指定容器内的动态卡片', () => {
  const firstCard = createCard();
  const secondCard = createCard();
  const runtime = createRuntime();
  runtime.api.mountAll(firstCard);
  runtime.api.mountAll(secondCard);

  const root = {
    contains(element) {
      return element === firstCard;
    }
  };
  runtime.api.unmountAll(root);

  assert.equal(firstCard.classList.contains('is-card-hover-ready'), false);
  assert.equal(firstCard.children.length, 0);
  assert.equal(firstCard.listeners.size, 0);
  assert.equal(secondCard.classList.contains('is-card-hover-ready'), true);
  assert.equal(secondCard.children.length, 1);
  assert.notEqual(secondCard.listeners.size, 0);

  runtime.api.destroy();
});

test('减少动态效果或非精细指针时不挂载动态能力', () => {
  for (const options of [
    { reduceMotion: true, finePointer: true },
    { reduceMotion: false, finePointer: false }
  ]) {
    const card = createCard();
    const runtime = createRuntime(options);
    runtime.api.mountAll(card);

    assert.equal(card.classList.contains('is-card-hover-ready'), false);
    assert.equal(card.children.length, 0);
    assert.equal(card.listeners.size, 0);
    runtime.api.destroy();
  }
});

test('指针离开时光斑停在最后位置淡出，完成后再回到中心', () => {
  const card = createCard();
  const runtime = createRuntime();
  runtime.api.mountAll(card);

  card.listeners.get('pointerenter')({ clientX: 90, clientY: 20 });
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '90px');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '20px');

  card.listeners.get('pointerleave')();
  assert.equal(card.classList.contains('is-card-hover-active'), false);
  assert.equal(card.style.getPropertyValue('--card-hover-rotate-x'), '0deg');
  assert.equal(card.style.getPropertyValue('--card-hover-rotate-y'), '0deg');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '90px');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '20px');

  const spotlight = card.children[0];
  spotlight.listeners.get('transitionend')({ target: spotlight, propertyName: 'opacity' });
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '50%');
  runtime.api.destroy();
});

test('保持焦点的卡片离开时回中，快速重新进入不受旧过渡影响', () => {
  const card = createCard();
  const runtime = createRuntime();
  runtime.api.mountAll(card);
  const spotlight = card.children[0];

  card.listeners.get('pointerenter')({ clientX: 90, clientY: 20 });
  card.setFocusWithin(true);
  card.listeners.get('pointerleave')();
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '50%');

  card.setFocusWithin(false);
  card.listeners.get('pointerenter')({ clientX: 15, clientY: 60 });
  spotlight.listeners.get('transitionend')({ target: spotlight, propertyName: 'opacity' });
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '15px');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '60px');
  runtime.api.destroy();
});

test('键盘焦点进入时立即使用居中光斑', () => {
  const card = createCard();
  const runtime = createRuntime();
  runtime.api.mountAll(card);

  card.listeners.get('pointerenter')({ clientX: 90, clientY: 20 });
  card.listeners.get('pointerleave')();
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '90px');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '20px');

  card.setFocusWithin(true);
  assert.equal(card.listeners.has('focusin'), true);
  card.listeners.get('focusin')();
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '50%');
  runtime.api.destroy();
});

test('页面隐藏、销毁和媒体条件变化会完整复位并清理', () => {
  const card = createCard();
  const runtime = createRuntime();
  runtime.api.mountAll(card);
  const spotlight = card.children[0];

  card.listeners.get('pointerenter')({ clientX: 90, clientY: 20 });
  runtime.document.hidden = true;
  runtime.documentListeners.get('visibilitychange')();
  assert.equal(card.classList.contains('is-card-hover-active'), false);
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-rotate-x'), '0deg');
  assert.equal(card.style.getPropertyValue('--card-hover-rotate-y'), '0deg');

  runtime.document.hidden = false;
  card.listeners.get('pointerenter')({ clientX: 10, clientY: 70 });
  runtime.api.destroy();
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(card.style.getPropertyValue('--card-hover-mouse-y'), '50%');
  assert.equal(card.listeners.size, 0);
  assert.equal(spotlight.listeners.size, 0);

  const motionCard = createCard();
  const motionRuntime = createRuntime();
  motionRuntime.api.mountAll(motionCard);
  const motionSpotlight = motionCard.children[0];
  motionCard.listeners.get('pointerenter')({ clientX: 80, clientY: 10 });
  motionRuntime.media.get('(prefers-reduced-motion: reduce)').dispatch(true);
  assert.equal(motionCard.style.getPropertyValue('--card-hover-mouse-x'), '50%');
  assert.equal(motionCard.style.getPropertyValue('--card-hover-mouse-y'), '50%');
  assert.equal(motionCard.classList.contains('is-card-hover-ready'), false);
  assert.equal(motionCard.listeners.size, 0);
  assert.equal(motionSpotlight.listeners.size, 0);
  motionRuntime.api.destroy();
});
