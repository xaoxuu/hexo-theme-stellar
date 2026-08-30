"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  generatorPath,
  toRenderNavigation,
  toRenderRegions,
  profilePath,
  requireLayoutProfiles
} = require("../scripts/lib/layout-config");

test("Layout Profile 路径转换为 Collection 与 Hexo Generator 路径", () => {
  assert.equal(profilePath("/blog/"), "blog");
  assert.equal(profilePath("/404.html"), "404.html");
  assert.equal(generatorPath("/blog/"), "blog/index.html");
  assert.equal(generatorPath("/404.html"), "404.html");
});

test("Layout Profile 导航只投影内部 menu 字段", () => {
  assert.deepEqual(toRenderNavigation({ navigation: { activeMenu: "post" } }), { menu: "post" });
  assert.deepEqual(toRenderNavigation({ navigation: { activeMenu: null } }), {});
});

test("Layout Profile 最后显式覆盖 Widget，并按字段继承 Leftbar 外壳", () => {
  assert.deepEqual(toRenderRegions(
    { leftbar: { enabled: true, brand: "site_brand", menu: true, footer: { actions: true }, widgets: ["global"] } },
    { regions: { leftbar: { brand: false, widgets: ["recent"] }, rightbar: { widgets: ["toc"] } } }
  ), {
    topbar: { widgets: [] },
    leftbar: { enabled: true, brand: false, menu: true, footer: { actions: true }, widgets: ["recent"] },
    rightbar: { widgets: ["toc"] }
  });
});

test("Layout Profile 运行时入口缺失时立即失败", () => {
  const profiles = { home: {} };
  assert.equal(requireLayoutProfiles({ layout: { profiles } }), profiles);
  assert.throws(() => requireLayoutProfiles({}), /缺少冻结的 layout\.profiles/);
});
