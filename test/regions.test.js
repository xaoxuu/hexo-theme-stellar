"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { cascadeRegion, resolveLeftbar, resolveRegions } = require("../scripts/lib/regions");
const { resolveWidget } = require("../scripts/lib/widget-registry");
const { composeUiClasses } = require("../scripts/lib/ui-capabilities");

let ejsRenderer;
global.hexo = {
  extend: {
    renderer: {
      register(extension, output, registered) {
        assert.equal(extension, "ejs");
        assert.equal(output, "html");
        ejsRenderer = registered;
      }
    }
  }
};
require("hexo-renderer-ejs");
delete global.hexo;

const REGION_WIDGETS_TEMPLATE = path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs");

function renderRegionWidgets(locals) {
  const text = fs.readFileSync(REGION_WIDGETS_TEMPLATE, "utf8");
  return ejsRenderer({ path: REGION_WIDGETS_TEMPLATE, text }, {
    page: {},
    toc: () => "",
    icon: () => "",
    __: value => value,
    ui_classes: composeUiClasses,
    escape_html: value => String(value),
    brandConfig() {
      throw new Error("双 Brand 渲染不应绕过 PageViewModel");
    },
    partial(name, partialLocals) {
      if (name === "../sidebar/brand") {
        const brand = partialLocals.brandModel;
        return brand ? `<a class="brand-wrap"><span class="brand-name">${brand.name}</span></a>` : "";
      }
      return "";
    },
    ...locals
  }).trim();
}

test("Region 使用最后一个显式 widgets 整体覆盖，省略字段继续继承", () => {
  const layers = [
    { leftbar: { widgets: ["site_brand", "menu"] } },
    { leftbar: { brand: false } },
    { leftbar: { widgets: ["tree"] } },
    { rightbar: { widgets: ["toc"] } }
  ];
  assert.deepEqual(cascadeRegion(layers, "leftbar"), ["tree"]);
  assert.deepEqual(cascadeRegion([...layers, { leftbar: { widgets: [] } }], "leftbar"), []);
  assert.deepEqual(cascadeRegion([{ topbar: { widgets: ["site_brand", "menu"] } }], "topbar"), ["site_brand", "menu"]);
});

test("Leftbar 固定字段逐层覆盖，widgets 不重置外壳且 enabled:false 关闭整栏", () => {
  const resolved = resolveLeftbar([
    { leftbar: { enabled: true, brand: "site_brand", menu: true, footer: { actions: true }, widgets: ["recent"] } },
    { leftbar: { brand: false } },
    { leftbar: { widgets: ["tree"] } },
    { leftbar: { footer: { actions: false } } }
  ]);
  assert.deepEqual(resolved, {
    enabled: true,
    brand: false,
    menu: true,
    footer: { actions: false },
    widgets: ["tree"]
  });

  const disabled = resolveRegions({
    layers: [
      { leftbar: { enabled: true, widgets: ["recent"] } },
      { leftbar: { enabled: false } }
    ]
  });
  assert.equal(disabled.leftbar.enabled, false);
  assert.deepEqual(disabled.leftbar.widgets, []);
});

test("/about/ 同类页面覆盖内容 Widgets 后仍保留固定设置入口外壳", () => {
  const result = resolveRegions({
    profile: "page",
    catalog: { recent: { layout: "recent" } },
    layers: [
    { leftbar: { enabled: true, brand: "site_brand", menu: true, footer: { actions: true }, widgets: ["global"] } },
      { leftbar: { widgets: ["recent"] } },
      { leftbar: { widgets: ["recent"] } }
    ]
  });
  assert.deepEqual(result.leftbar.widgets.map(widget => widget.id), ["recent"]);
  assert.equal(result.leftbar.brand, "site_brand");
  assert.equal(result.leftbar.menu, true);
  assert.equal(result.leftbar.footer.actions, true);
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  assert.match(template, /site-region__settings[\s\S]*partial\('\.\.\/widgets\/settings'/);
  assert.match(template, /leftbar:fixed:settings/);
  assert.doesNotMatch(template, /leftbar:fixed:profile|widgets\/profile/);
});

test("Region 不去重、不排序并冻结最终实例", () => {
  const result = resolveRegions({
    profile: "post",
    defaultState: "collapsed",
    catalog: { recent: { layout: "recent" } },
    layers: [{ leftbar: { widgets: ["recent", "recent"] } }]
  });
  assert.deepEqual(result.leftbar.widgets.map(widget => widget.id), ["recent", "recent"]);
  assert.equal(result.leftbar.defaultState, "collapsed");
  assert.equal(result.leftbar.brand, "site_brand");
  assert.equal(result.leftbar.menu, true);
  assert.deepEqual(result.leftbar.footer, { actions: true });
  assert.notEqual(result.leftbar.widgets[0].instanceId, result.leftbar.widgets[1].instanceId);
  assert.equal(Object.isFrozen(result.leftbar.widgets), true);
});

test("Widget 能力不支持目标 Region 时警告并跳过，空 Region 仍保留对象", () => {
  const result = resolveRegions({
    profile: "blog_index",
    layers: [{ topbar: { widgets: [{ layout: "timeline" }] } }]
  });
  assert.deepEqual(result.topbar, { widgets: [] });
  assert.deepEqual(result.leftbar, { widgets: [] });
  assert.deepEqual(result.rightbar, { widgets: [] });
  assert.equal(result.warnings.length, 1);
  assert.deepEqual(result.warnings[0], {
    code: "unsupported_widget_presentation",
    widget: "timeline",
    layout: "timeline",
    region: "topbar",
    supported: ["leftbar", "rightbar", "drawer"],
    profile: "blog_index"
  });
});

test("未声明能力的自定义 Widget 默认仅支持 Leftbar、Rightbar 与 Drawer", () => {
  const catalog = { custom: { layout: "custom" } };
  assert.equal(resolveWidget("custom", catalog, { region: "leftbar" }).instance.presentation, "leftbar");
  assert.equal(resolveWidget("custom", catalog, { region: "topbar" }).instance, null);
});

test("内容 Widget 不进入 Rail，TOC 仍支持 Topbar 紧凑入口", () => {
  assert.equal(resolveWidget("toc", { toc: { layout: "toc" } }, { region: "topbar" }).instance.presentation, "topbar");
  for (const layout of ["toc", "tree", "tagtree", "timeline"]) {
    const widget = resolveWidget(layout, { [layout]: { layout } }, { region: "leftbar" }).instance;
    assert.equal(widget.presentations.includes("leftbarRail"), false);
  }
});

test("Topbar TOC 使用专属原生弹层且内容 Widget 不生成 Rail 展开入口", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  const client = fs.readFileSync(path.resolve(__dirname, "../source/js/main.js"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");
  assert.match(template, /<details class="topbar-toc">/);
  assert.match(template, /topbar-toc-popover/);
  assert.match(template, /ui_classes\('region-compact-action'\)[\s\S]*class="ui-icon"/);
  assert.match(template, /ui_classes\('toc-link', 'interactive'\)/);
  assert.match(client, /a\.className = 'toc-link ' \+ ctx\.ui\.classes\.interactive/);
  assert.match(client, /function toggleToc\(trigger\)[\s\S]*classList\.toggle\('is-active', collapsed\)[\s\S]*setAttribute\('aria-pressed', String\(collapsed\)\)/);
  assert.doesNotMatch(template, /widget\.layout === 'toc'[\s\S]{0,500}toggleDrawer/);
  assert.doesNotMatch(template, /widget-instance__rail-trigger|expand-rail-widget/);
  assert.doesNotMatch(client, /widget-instance__rail-trigger|expandRailWidget|expand-rail-widget/);
  assert.doesNotMatch(css, /widget-instance__rail-trigger/);
});

test("Widget 实例不能以内联 presentations 绕过类型能力", () => {
  const timeline = resolveWidget({ layout: "timeline", presentations: ["topbar"] }, {}, { region: "topbar" });
  assert.equal(timeline.instance, null);
  assert.deepEqual(timeline.warning.supported, ["leftbar", "rightbar", "drawer"]);

  const custom = resolveWidget({ override: "custom", presentations: ["topbar"] }, {
    custom: { layout: "markdown", presentations: ["leftbar", "rightbar", "drawer"] }
  }, { region: "topbar" });
  assert.equal(custom.instance, null);
});

test("Settings 是设置入口 Widget，支持 Topbar；旧 Profile ID 被拒绝", () => {
  const topbar = resolveWidget("settings", {}, { region: "topbar" }).instance;
  const leftbar = resolveWidget("settings", {}, { region: "leftbar", contentOnly: true });
  const rightbar = resolveWidget("settings", {}, { region: "rightbar" });
  const retired = resolveWidget("profile", {}, { region: "topbar" });

  assert.equal(topbar.system, true);
  assert.equal(topbar.layout, "settings");
  assert.equal(topbar.presentation, "topbar");
  assert.equal(leftbar.instance, null);
  assert.equal(leftbar.warning.code, "fixed_leftbar_widget");
  assert.equal(rightbar.instance, null);
  assert.deepEqual(Array.from(rightbar.warning.supported), ["topbar", "leftbar", "leftbarRail", "drawer"]);
  assert.equal(retired.instance, null);
  assert.equal(retired.warning.code, "unknown_widget");
});

test("Site Brand 与 Collection Brand 是共享 partial、来源独立的系统 Widget", () => {
  const site = resolveWidget("site_brand", {}, { region: "topbar" }).instance;
  const collection = resolveWidget("collection_brand", {}, { region: "topbar" }).instance;
  const ambiguous = resolveWidget("brand", {}, { region: "topbar" });

  assert.equal(site.layout, "brand");
  assert.equal(site.item.brandSource, "site");
  assert.equal(collection.layout, "brand");
  assert.equal(collection.item.brandSource, "collection");
  assert.equal(ambiguous.instance, null);
  assert.equal(ambiguous.warning.code, "unknown_widget");
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  assert.match(template, /brandModel\(item\.brandSource\)/);
  assert.match(template, /partial\('\.\.\/sidebar\/brand'/);
  assert.doesNotMatch(template, /site_brand\.ejs|collection_brand\.ejs/);
});

test("wiki_home 已退出 Widget Registry，返回入口由 Brand partial 承载", () => {
  const retired = resolveWidget("wiki_home", {}, { region: "leftbar", contentOnly: true });
  assert.equal(retired.instance, null);
  assert.equal(retired.warning.code, "unknown_widget");

  const widgetsTemplate = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  const brandTemplate = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/sidebar/brand.ejs"), "utf8");
  assert.doesNotMatch(widgetsTemplate, /wiki_home|wiki-home/);
  assert.match(brandTemplate, /brand-navigation/);
  assert.match(brandTemplate, /layoutBrandNavigation\(\)[\s\S]*class="brand-wrap"/);
});

test("Topbar 与 Leftbar 从独立模型渲染 Brand partial，缺少 Collection 时安全跳过", () => {
  const viewModel = {
    render: {
      layout: {
        brands: {
          site: { name: "XAOXUU" },
          collection: { name: "Stellar" }
        }
      }
    }
  };
  const siteWidget = resolveWidget("site_brand", {}, { region: "topbar" }).instance;
  const topbar = renderRegionWidgets({
    region: "topbar",
    state: {},
    widgets: [siteWidget],
    viewModel
  });
  const leftbar = renderRegionWidgets({
    region: "leftbar",
    state: { brand: "collection_brand", menu: false, footer: { actions: false } },
    widgets: [],
    viewModel
  });
  const missingCollection = renderRegionWidgets({
    region: "leftbar",
    state: { brand: "collection_brand", menu: false, footer: { actions: false } },
    widgets: [],
    viewModel: {
      render: { layout: { brands: { site: { name: "XAOXUU" }, collection: null } } }
    }
  });

  assert.match(topbar, /widget-instance--brand[\s\S]*brand-wrap[\s\S]*XAOXUU/);
  assert.doesNotMatch(topbar, /Stellar/);
  assert.match(leftbar, /widget-instance--brand[\s\S]*brand-wrap[\s\S]*Stellar/);
  assert.doesNotMatch(leftbar, /XAOXUU/);
  assert.doesNotMatch(`${topbar}${leftbar}`, /site-brand|collection-brand/);
  assert.doesNotMatch(missingCollection, /widget-instance--brand|brand-wrap|XAOXUU/);
});

test("Search 已退出 Region Widget Catalog", () => {
  for (const region of ["topbar", "leftbar", "rightbar"]) {
    const resolved = resolveWidget({ layout: "search" }, {}, { region, contentOnly: region === "leftbar" });
    assert.equal(resolved.instance, null);
    assert.equal(resolved.warning.code, "retired_region_widget");
    assert.deepEqual(Array.from(resolved.warning.supported), []);
  }
});

test("Spacer 是仅支持 Topbar 的系统 Widget", () => {
  const topbar = resolveWidget("spacer", {}, { region: "topbar" }).instance;
  const leftbar = resolveWidget("spacer", {}, { region: "leftbar" });
  const rightbar = resolveWidget("spacer", {}, { region: "rightbar" });

  assert.equal(topbar.system, true);
  assert.deepEqual(Array.from(topbar.presentations), ["topbar"]);
  assert.equal(leftbar.instance, null);
  assert.deepEqual(Array.from(leftbar.warning.supported), ["topbar"]);
  assert.equal(rightbar.instance, null);
});

test("Leftbar 固定 Brand、Menu、Actions、Settings 与控制栏", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  const actions = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/widgets/actions.ejs"), "utf8");
  assert.match(template, /<footer class="site-region__footer">/);
  assert.match(template, /<header class="site-region__header/);
  assert.match(template, /class="site-region__body/);
  assert.match(template, /site-region__footer-actions/);
  assert.match(template, /partial\('\.\.\/sidebar\/brand'/);
  assert.match(template, /partial\('\.\.\/sidebar\/menu'/);
  assert.match(template, /partial\('\.\.\/widgets\/actions'/);
  assert.match(template, /partial\('\.\.\/widgets\/settings'/);
  assert.match(template, /class="site-region__system ui-collection" data-layout="inline" data-variant="nav" data-density="compact"/);
  assert.match(template, /ui_classes\('leftbar-state-toggle', 'collectionItem', 'is-icon-only'\)/);
  assert.match(actions, /class="region-actions social-wrap ui-collection" data-layout="inline" data-variant="nav" data-density="compact"/);
  assert.match(actions, /triggerClass: ui_classes\('social', 'collectionItem', 'is-icon-only'\)/);
  assert.match(actions, /<a class="\$\{ui_classes\('social', 'collectionItem', 'is-icon-only'\)\}"/);
  assert.match(actions, /<button type="button" class="\$\{ui_classes\('social', 'collectionItem', 'is-icon-only'\)\}"/);
  assert.match(actions, /<span class="social-spacer" aria-hidden="true"><\/span>/);
  assert.doesNotMatch(actions, /social-spacer[^>]*ui-collection__item/);
  assert.doesNotMatch(template, /isWikiLeftbar|systemWidgets/);
  assert.doesNotMatch(template, /site-region__zone--bottom/);
});

test("Search 由唯一 Menu Item 复用页面范围与共享 Dialog", () => {
  const menu = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/sidebar/menu.ejs"), "utf8");
  const layout = fs.readFileSync(path.resolve(__dirname, "../layout/layout.ejs"), "utf8");
  assert.match(menu, /menuItem\?\.type === 'search'/);
  assert.match(menu, /search\.provider/);
  assert.match(menu, /data-shell-action': 'open-search'/);
  assert.match(menu, /render\.layout\.algoliaFilterPath/);
  assert.match(layout, /partial\('_partial\/search\/dialog'\)/);
  assert.match(layout, /item\?\.type === 'search'/);
});

test("Leftbar 内容区保留普通 Widget 顺序并拒绝固定外壳项", () => {
  const { resolveRegionWidgets } = require("../scripts/lib/widget-registry");
  const result = resolveRegionWidgets(["menu", "site_brand", "collection_brand", { layout: "recent" }, "actions", "settings"], {}, { region: "leftbar", contentOnly: true });
  assert.deepEqual(result.instances.map(widget => widget.id), ["recent"]);
  assert.deepEqual(result.warnings.map(warning => warning.code), ["fixed_leftbar_widget", "fixed_leftbar_widget", "fixed_leftbar_widget", "fixed_leftbar_widget", "fixed_leftbar_widget"]);
});

test("Leftbar 桌面控制栏使用独立 Solar 图标，移动端 Dock 保留特殊图标", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/regions/widgets.ejs"), "utf8");
  const dock = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/menubtn.ejs"), "utf8");
  assert.match(template, /leftbar-state-toggle[\s\S]*icon\('default:leftbar-toggle'/);
  assert.match(template, /leftbar-state-toggle[\s\S]*class="ui-icon"/);
  assert.match(dock, /site-dock__button--leftbar[\s\S]*icon\('default:leftbar'/);
});
