"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function filesUnder(relativePath) {
  const root = path.join(ROOT, relativePath);
  const output = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else output.push(path.relative(ROOT, absolute));
    }
  };
  visit(root);
  return output;
}

test("UI capability 注册表是组合类名的唯一事实入口", () => {
  const { UI_CAPABILITIES, composeUiClasses } = require("../scripts/lib/ui-capabilities");

  assert.deepEqual(UI_CAPABILITIES, {
    interactive: "ui-interactive",
    interactiveSpotlight: "ui-interactive card-hover card-hover--spotlight",
    collectionItem: "ui-collection__item ui-interactive card-hover card-hover--spotlight",
    spotlight: "card-hover card-hover--spotlight",
    hoverCard: "card-hover card-hover--spotlight card-hover--tilt"
  });
  assert.equal(Object.isFrozen(UI_CAPABILITIES), true);
  assert.equal(composeUiClasses("brand-stat"), "brand-stat ui-interactive card-hover card-hover--spotlight");
  assert.equal(composeUiClasses("toc-link", "interactive"), "toc-link ui-interactive");
  assert.equal(composeUiClasses("post-card", "hoverCard", "wiki featured"), "post-card card-hover card-hover--spotlight card-hover--tilt wiki featured");
  assert.equal(composeUiClasses("ui-interactive", "interactiveSpotlight"), "ui-interactive card-hover card-hover--spotlight");
  assert.throws(() => composeUiClasses("control", "unknown"), /unknown UI capability: unknown/);
});

test("ui_classes helper 复用同一注册表并保留默认交互能力", () => {
  const registered = new Map();
  global.hexo = {
    extend: {
      helper: {
        register(name, helper) {
          registered.set(name, helper);
        }
      }
    }
  };
  const helperPath = path.join(ROOT, "scripts/helpers/ui_classes.js");
  delete require.cache[helperPath];
  require(helperPath);
  delete global.hexo;

  assert.deepEqual(Array.from(registered.keys()).sort(), ["ui_capabilities", "ui_classes"]);
  assert.equal(registered.get("ui_classes")("brand-stat"), "brand-stat ui-interactive card-hover card-hover--spotlight");
  assert.equal(registered.get("ui_classes")("toc-link", "interactive"), "toc-link ui-interactive");
  assert.equal(Object.isFrozen(registered.get("ui_capabilities")()), true);
});

test("浏览器 ctx 从同一 UI capability 注册表投影动态节点类名", () => {
  const defines = read("layout/_partial/scripts/defines.ejs");

  assert.match(defines, /ui:\s*\{\s*classes:\s*<%- JSON\.stringify\(ui_capabilities\(\)\) %>\s*\}/);
});

test("当前 UI 交互热点只通过 capability 入口组合类名", () => {
  assert.match(read("layout/_partial/sidebar/brand.ejs"), /ui_classes\('brand-stat'\)/);
  assert.match(read("layout/_partial/components/collection-item.ejs"), /ui_classes\('', 'collectionItem'/);
  assert.match(read("layout/_partial/dropdown.ejs"), /ui_classes\('dropdown-item', 'collectionItem'\)/);
  assert.match(read("layout/_partial/widgets/actions.ejs"), /ui_classes\('social', 'collectionItem', 'is-icon-only'\)/);
  assert.match(read("layout/_partial/widgets/recent.ejs"), /ui_classes\('cap-action'\)/);
  assert.match(read("layout/_partial/widgets/toc.ejs"), /ui_classes\('cap-action'\)/);
  assert.match(read("layout/_partial/regions/widgets.ejs"), /ui_classes\('region-compact-action'\)/);
  assert.match(read("source/js/search/local-search.js"), /ctx\.ui\.classes\.interactiveSpotlight/);
  assert.match(read("source/js/search/algolia-search.js"), /ctx\.ui\.classes\.interactiveSpotlight/);

  const protectedBundles = [
    "ui-interactive card-hover card-hover--spotlight",
    "ui-collection__item ui-interactive card-hover card-hover--spotlight",
    "card-hover card-hover--spotlight",
    "card-hover card-hover--spotlight card-hover--tilt"
  ];
  const files = [
    ...filesUnder("layout"),
    ...filesUnder("scripts/tags/lib"),
    ...filesUnder("source/js")
  ];
  for (const file of files) {
    const source = read(file);
    for (const bundle of protectedBundles) {
      assert.equal(source.includes(bundle), false, `${file} 不应硬编码 ${bundle}`);
    }
  }
});
