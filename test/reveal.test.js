"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadModule() {
  const file = pathToFileURL(path.join(__dirname, "../source/js/runtime/extensions/reveal.mjs"));
  return import(`${file.href}?test=${Date.now()}-${Math.random()}`);
}

function createElement(id) {
  const animations = [];
  return {
    id,
    animate(keyframes, options) {
      const animation = {
        canceled: false,
        cancel() { this.canceled = true; }
      };
      animations.push({ animation, keyframes, options });
      return animation;
    },
    animations
  };
}

function createFixture(options = {}) {
  const elements = options.elements || [createElement("first"), createElement("second")];
  const observers = [];
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.unobserved = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(element) { this.observed.push(element); }
    unobserve(element) { this.unobserved.push(element); }
    disconnect() { this.disconnected = true; }
  }
  const windowRef = {
    matchMedia() { return { matches: options.reduceMotion === true }; }
  };
  if (options.intersectionObserver !== false) {
    windowRef.IntersectionObserver = FakeIntersectionObserver;
  }
  const root = {
    nodeType: 9,
    defaultView: windowRef,
    querySelectorAll(selector) {
      assert.equal(selector, ".slide-up");
      return elements;
    }
  };
  return { elements, observers, root };
}

test("reveal 在观察器不可用或减少动态效果时保持内容默认可见", async () => {
  const module = await loadModule();
  for (const options of [{ intersectionObserver: false }, { reduceMotion: true }]) {
    const fixture = createFixture(options);
    const cleanup = module.mount(fixture.root);
    assert.equal(typeof cleanup, "function");
    assert.equal(fixture.observers.length, 0);
    assert.deepEqual(fixture.elements.map(element => element.animations.length), [0, 0]);
    cleanup();
  }
});

test("reveal 首次观察时已在视口内的元素保持可见且不播放动画", async () => {
  const module = await loadModule();
  const fixture = createFixture();
  const cleanup = module.mount(fixture.root);
  const observer = fixture.observers[0];

  observer.callback(fixture.elements.map(target => ({ target, isIntersecting: true })), observer);

  assert.deepEqual(fixture.elements.map(element => element.animations.length), [0, 0]);
  assert.deepEqual(observer.unobserved, fixture.elements);

  cleanup();
});

test("reveal 独立处理一次大步滚动进入视口的不连续元素", async () => {
  const module = await loadModule();
  const elements = [createElement("first"), createElement("skipped"), createElement("third")];
  const fixture = createFixture({ elements });
  const cleanup = module.mount(fixture.root);
  const observer = fixture.observers[0];

  assert.deepEqual(observer.observed, elements);
  observer.callback(elements.map(target => ({ target, isIntersecting: false })), observer);
  assert.deepEqual(elements.map(element => element.animations.length), [0, 0, 0]);

  observer.callback([
    { target: elements[0], isIntersecting: true },
    { target: elements[1], isIntersecting: false },
    { target: elements[2], isIntersecting: true }
  ], observer);

  assert.equal(elements[0].animations.length, 1);
  assert.equal(elements[1].animations.length, 0);
  assert.equal(elements[2].animations.length, 1);
  assert.deepEqual(observer.unobserved, [elements[0], elements[2]]);
  assert.deepEqual(elements[0].animations[0].keyframes, [
    { opacity: 0, transform: "translateY(8px) scale(1)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ]);
  assert.deepEqual(elements[0].animations[0].options, {
    delay: 0,
    duration: 1000,
    easing: "ease-out",
    fill: "backwards"
  });
  assert.equal(elements[2].animations[0].options.delay, 100);

  cleanup();
  assert.equal(observer.disconnected, true);
  assert.equal(elements[0].animations[0].animation.canceled, true);
  assert.equal(elements[2].animations[0].animation.canceled, true);
});
