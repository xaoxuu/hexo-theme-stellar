'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const GALAXY_SOURCE = fs.readFileSync(path.join(__dirname, '../source/js/plugins/galaxy.js'), 'utf8');

function createGlRecorder() {
  const calls = [];
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    BLEND: 8,
    SRC_ALPHA: 9,
    ONE_MINUS_SRC_ALPHA: 10,
    COLOR_BUFFER_BIT: 11,
    TRIANGLES: 12,
    createShader() { return {}; },
    shaderSource() {},
    compileShader() {},
    getShaderParameter() { return true; },
    getShaderInfoLog() { return ''; },
    deleteShader() {},
    createProgram() { return {}; },
    attachShader() {},
    linkProgram() {},
    getProgramParameter() { return true; },
    getProgramInfoLog() { return ''; },
    deleteProgram() {},
    getUniformLocation(program, name) { return name; },
    getAttribLocation() { return 0; },
    createBuffer() { return {}; },
    bindBuffer() {},
    bufferData() {},
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    useProgram() {},
    enable() {},
    blendFunc() {},
    clearColor() {},
    uniform2f(name, x, y) { calls.push(['uniform2f', name, x, y]); },
    uniform1f(name, value) { calls.push(['uniform1f', name, value]); },
    uniform1i(name, value) { calls.push(['uniform1i', name, value]); },
    uniform3f(name, x, y, z) { calls.push(['uniform3f', name, x, y, z]); },
    viewport() {},
    clear() {},
    drawArrays() {},
    deleteBuffer() {},
    getExtension() { return null; }
  };
  return { gl, calls };
}

function createCanvas(params) {
  const recorder = createGlRecorder();
  const contextOptions = [];
  const background = {
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() {
      return { width: 1200, height: 640, left: 0, top: 0 };
    }
  };
  const hero = {
    addEventListener() {},
    removeEventListener() {}
  };
  const canvas = {
    dataset: {},
    parentElement: background,
    width: 0,
    height: 0,
    closest() { return hero; },
    getAttribute(name) {
      return name === 'data-galaxy-params' ? params : null;
    },
    getContext(type, options) {
      contextOptions.push({ type, options });
      return recorder.gl;
    }
  };
  return { canvas, calls: recorder.calls, contextOptions };
}

function createRuntime() {
  const frames = [];
  const window = {
    stellar: {},
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame(callback) {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame() {}
  };
  const document = {
    hidden: false,
    addEventListener() {},
    removeEventListener() {}
  };
  vm.runInContext(GALAXY_SOURCE, vm.createContext({ window, document, console }));
  return { galaxy: window.stellar.galaxy, frames };
}

function lastCall(calls, method, uniform) {
  return calls.filter(item => item[0] === method && item[1] === uniform).at(-1);
}

test('Galaxy 缺失参数时使用完整默认值', () => {
  const runtime = createRuntime();
  const target = createCanvas('{}');

  runtime.galaxy.mountAll([target.canvas]);
  runtime.frames.shift()(1000);

  assert.deepEqual(lastCall(target.calls, 'uniform2f', 'uFocal'), ['uniform2f', 'uFocal', 0.5, 0.5]);
  assert.deepEqual(lastCall(target.calls, 'uniform2f', 'uRotation'), ['uniform2f', 'uRotation', 1, 0]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uDensity'), ['uniform1f', 'uDensity', 2]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uHueShift'), ['uniform1f', 'uHueShift', 140]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uStarSpeed'), ['uniform1f', 'uStarSpeed', 0.2]);
  assert.deepEqual(lastCall(target.calls, 'uniform1i', 'uMouseRepulsion'), ['uniform1i', 'uMouseRepulsion', 1]);
  assert.deepEqual(lastCall(target.calls, 'uniform1i', 'uTransparent'), ['uniform1i', 'uTransparent', 1]);
  assert.equal(target.contextOptions[0].options.alpha, true);
});

test('Galaxy 逐项规范化自定义参数并忽略未知值', () => {
  const runtime = createRuntime();
  const params = JSON.stringify({
    focal: [2, -1],
    rotation: [0.25, -0.5],
    starSpeed: 4,
    density: -1,
    hueShift: -20,
    speed: 1.5,
    glowIntensity: 'bright',
    saturation: 0.8,
    mouseRepulsion: false,
    twinkleIntensity: -0.2,
    rotationSpeed: -0.3,
    repulsionStrength: 0.4,
    autoCenterRepulsion: 0.2,
    transparent: false,
    unknown: 999
  });
  const target = createCanvas(params);

  runtime.galaxy.mountAll([target.canvas]);
  runtime.frames.shift()(1000);

  assert.deepEqual(lastCall(target.calls, 'uniform2f', 'uFocal'), ['uniform2f', 'uFocal', 1, 0]);
  assert.deepEqual(lastCall(target.calls, 'uniform2f', 'uRotation'), ['uniform2f', 'uRotation', 0.25, -0.5]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uStarSpeed'), ['uniform1f', 'uStarSpeed', 0.4]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uDensity'), ['uniform1f', 'uDensity', 2]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uHueShift'), ['uniform1f', 'uHueShift', 340]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uSpeed'), ['uniform1f', 'uSpeed', 1.5]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uGlowIntensity'), ['uniform1f', 'uGlowIntensity', 0.2]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uTwinkleIntensity'), ['uniform1f', 'uTwinkleIntensity', 0.1]);
  assert.deepEqual(lastCall(target.calls, 'uniform1f', 'uRotationSpeed'), ['uniform1f', 'uRotationSpeed', -0.3]);
  assert.deepEqual(lastCall(target.calls, 'uniform1i', 'uMouseRepulsion'), ['uniform1i', 'uMouseRepulsion', 0]);
  assert.deepEqual(lastCall(target.calls, 'uniform1i', 'uTransparent'), ['uniform1i', 'uTransparent', 0]);
  assert.equal(target.contextOptions[0].options.alpha, false);
});

test('Galaxy 每个 Canvas 使用独立参数，非法 JSON 只回退当前实例', () => {
  const runtime = createRuntime();
  const first = createCanvas('{invalid json');
  const second = createCanvas(JSON.stringify({ density: 5, hueShift: 400 }));

  runtime.galaxy.mountAll([first.canvas, second.canvas]);

  assert.deepEqual(lastCall(first.calls, 'uniform1f', 'uDensity'), ['uniform1f', 'uDensity', 2]);
  assert.deepEqual(lastCall(first.calls, 'uniform1f', 'uHueShift'), ['uniform1f', 'uHueShift', 140]);
  assert.deepEqual(lastCall(second.calls, 'uniform1f', 'uDensity'), ['uniform1f', 'uDensity', 5]);
  assert.deepEqual(lastCall(second.calls, 'uniform1f', 'uHueShift'), ['uniform1f', 'uHueShift', 40]);
});

test('WebGL 不可用时不标记挂载或启动动画帧', () => {
  const runtime = createRuntime();
  const target = createCanvas('{}');
  target.canvas.getContext = function () { return null; };

  runtime.galaxy.mountAll([target.canvas]);

  assert.equal(target.canvas.dataset.galaxyMounted, undefined);
  assert.equal(runtime.frames.length, 0);
});
