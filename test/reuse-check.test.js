"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { checkReuseSources } = require("../ci/check-reuse-contracts");

const FIXTURES = path.resolve(__dirname, "fixtures/reuse-check");

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

function inspect(name, options = {}) {
  return checkReuseSources({
    files: { [`fixtures/${name}`]: fixture(name) },
    controlFiles: name.endsWith(".ejs") ? [`fixtures/${name}`] : [],
    plainLinkExceptions: [],
    plainControlExceptions: [],
    protectedLiterals: [],
    ...options
  });
}

test("复用检查器接受共享能力入口", () => {
  assert.deepEqual(inspect("valid.ejs"), []);
});

test("复用检查器拒绝未分类的原生交互控件", () => {
  const errors = inspect("missing-control.ejs");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unclassified control.*fixture-action/);
});

test("复用检查器拒绝消费方直接拼写能力组合类", () => {
  const errors = inspect("raw-bundle.txt");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /raw UI capability.*interactiveSpotlight/);
});

test("复用检查器拒绝受保护语义值在消费方重新硬编码", () => {
  const errors = inspect("protected-literal.styl", {
    protectedLiterals: [{
      id: "button-radius",
      pattern: /border-radius:\s*8px\b/g,
      canonical: "$border-button",
      exceptions: []
    }]
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /protected literal.*button-radius.*\$border-button/);
});

test("复用检查器允许按文件、选择器和理由登记局部字面量", () => {
  const errors = inspect("local-literal.styl", {
    protectedLiterals: [{
      id: "button-radius",
      pattern: /border-radius:\s*8px\b/g,
      canonical: "$border-button",
      exceptions: [{
        file: "fixtures/local-literal.styl",
        selector: ".fixture-thumbnail",
        reason: "缩略图局部裁剪半径，不表达按钮语义"
      }]
    }]
  });
  assert.deepEqual(errors, []);
});

test("复用检查器允许带稳定选择器和理由的 plain-link", () => {
  const errors = inspect("plain-link.ejs", {
    plainLinkExceptions: [{
      file: "fixtures/plain-link.ejs",
      selector: "fixture-reference",
      reason: "正文引用链接不具有控件表面"
    }]
  });
  assert.deepEqual(errors, []);
});

test("复用检查器允许带稳定选择器和理由的 plain control", () => {
  const errors = inspect("missing-control.ejs", {
    plainControlExceptions: [{
      file: "fixtures/missing-control.ejs",
      selector: "fixture-action",
      reason: "局部组件按钮不消费通用控件表面"
    }]
  });
  assert.deepEqual(errors, []);
});
