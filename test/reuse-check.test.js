"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { checkReuseSources, runProjectCheck } = require("../ci/check-reuse-contracts");
const rules = require("../ci/reuse-rules");
const { UI_CAPABILITIES } = require("../scripts/lib/ui-capabilities");

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

test("项目扫描使用仓库相对路径匹配控件例外，仍报告未分类控件", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-reuse-controls-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [tag, exceptions] of [["a", rules.PLAIN_LINK_EXCEPTIONS], ["button", rules.PLAIN_CONTROL_EXCEPTIONS]]) {
    for (const exception of exceptions) {
      const file = path.join(root, exception.file);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, `<${tag} class="${exception.selector}">fixture</${tag}>\n`);
    }
  }
  assert.deepEqual(runProjectCheck(root), []);

  const file = rules.PLAIN_CONTROL_EXCEPTIONS[0].file;
  fs.appendFileSync(path.join(root, file), '<button class="fixture-unclassified">fixture</button>\n');
  const errors = runProjectCheck(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].startsWith(`${file}:`));
  assert.match(errors[0], /unclassified control.*fixture-unclassified/);
});

test("项目扫描保留事实所有者排除项，仍报告消费方直接拼写能力类", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-reuse-owners-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const owners = new Set([
    ...rules.RAW_CAPABILITY_EXCLUSIONS,
    ...rules.PROTECTED_LITERALS.flatMap(rule => rule.excludedFiles || [])
  ]);
  for (const file of owners) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "..", file), target);
  }
  assert.deepEqual(runProjectCheck(root), []);

  const file = "source/js/fixture-consumer.js";
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const classes = Object.values(UI_CAPABILITIES).find(value => value.includes(" "));
  fs.writeFileSync(target, `const classes = ${JSON.stringify(classes)};\n`);
  const errors = runProjectCheck(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].startsWith(`${file}:`));
  assert.match(errors[0], /raw UI capability/);
});
