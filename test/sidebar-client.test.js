"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.resolve(__dirname, "../source/js/main.js"), "utf8")
  .split("// 通用平滑滚动")[0];

function element() {
  return {
    attributes: {},
    dataset: {},
    inert: false,
    focusCount: 0,
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() { this.focusCount += 1; },
    querySelector() { return this.focusTarget || null; }
  };
}

function runtime(initialState = "expanded", responsive = {}) {
  const shell = element();
  const collapse = element();
  const leftToggle = element();
  const rightToggle = element();
  const leftRegion = element();
  const rightRegion = element();
  const leftItem = element();
  const rightItem = element();
  const trigger = element();
  leftRegion.focusTarget = leftItem;
  rightRegion.focusTarget = rightItem;
  const listeners = {};
  const mediaListeners = [];
  const storage = new Map();
  const matches = {
    "(max-width: 768px)": responsive.mobile === true,
    "(max-width: 1180px)": responsive.laptop === true
  };
  const controls = {
    '[data-shell-action="toggle-leftbar"]': [collapse],
    '[data-shell-action="toggle-leftbar-drawer"]': [leftToggle],
    '[data-shell-action="toggle-rightbar-drawer"]': [rightToggle]
  };
  const document = {
    documentElement: { dataset: { leftbarState: initialState } },
    activeElement: trigger,
    getElementById(id) {
      if (id === "leftbar-region") return leftRegion;
      if (id === "rightbar-region") return rightRegion;
      return null;
    },
    querySelector(selector) {
      if (selector === ".site-shell") return shell;
      return null;
    },
    querySelectorAll(selector) { return controls[selector] || []; },
    addEventListener(type, listener) { listeners[type] = listener; }
  };
  const window = {
    matchMedia(query) {
      return {
        matches: matches[query],
        addEventListener(type, listener) { if (type === "change") mediaListeners.push(listener); }
      };
    }
  };
  const context = {
    console,
    document,
    window,
    localStorage: { setItem: (key, value) => storage.set(key, value) },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout,
    ctx: { date_suffix: {} }
  };
  vm.runInNewContext(`${SOURCE}\nthis.__shell = { toggleDrawer, dismissDrawer, toggleLeftbarState, toggleLeftbar };`, context);
  return { controller: context.__shell, shell, collapse, leftToggle, rightToggle, leftRegion, rightRegion, leftItem, rightItem, trigger, listeners, mediaListeners, storage, document, matches };
}

test("Leftbar 折叠状态持久化并同步 ARIA", () => {
  const state = runtime();
  assert.equal(state.collapse.attributes["aria-expanded"], "true");
  state.controller.toggleLeftbarState();
  assert.equal(state.document.documentElement.dataset.leftbarState, "collapsed");
  assert.equal(state.storage.get("stellar:v2:leftbar-state"), "collapsed");
  assert.equal(state.collapse.attributes["aria-expanded"], "false");
  assert.equal(state.collapse.attributes["aria-label"], "Expand leftbar");
});

test("Leftbar 折叠时隐藏 Brand Navigation", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");

  assert.match(css, /leftbar-rail\(\)[\s\S]*\.widget-instance--brand[\s\S]*\.brand-navigation\s*\n\s+display: none/);
});

test("平板与手机 Drawer 互斥、设置 inert、转移焦点并由 Escape 恢复触发按钮", () => {
  const state = runtime("expanded", { laptop: true, mobile: true });
  assert.equal(state.leftRegion.inert, true);
  assert.equal(state.rightRegion.inert, true);

  state.controller.toggleDrawer("leftbar", state.trigger);
  assert.equal(state.shell.dataset.drawer, "leftbar");
  assert.equal(state.leftToggle.attributes["aria-expanded"], "true");
  assert.equal(state.leftRegion.inert, false);
  assert.equal(state.rightRegion.inert, true);
  assert.equal(state.leftItem.focusCount, 1);

  state.controller.toggleDrawer("rightbar", state.trigger);
  assert.equal(state.shell.dataset.drawer, "rightbar");
  assert.equal(state.leftToggle.attributes["aria-expanded"], "false");
  assert.equal(state.rightToggle.attributes["aria-expanded"], "true");
  assert.equal(state.leftRegion.inert, true);
  assert.equal(state.rightItem.focusCount, 1);

  state.listeners.keydown({ key: "Escape" });
  assert.equal(state.shell.dataset.drawer, undefined);
  assert.equal(state.rightToggle.attributes["aria-expanded"], "false");
  assert.equal(state.trigger.focusCount, 1);
});

test("中等宽度 Leftbar 常驻并持久化手动折叠，Rightbar 保持 Drawer", () => {
  const state = runtime("expanded", { laptop: true });
  assert.equal(state.leftRegion.inert, false);
  assert.equal(state.rightRegion.inert, true);
  assert.equal(state.collapse.attributes["aria-expanded"], "true");
  assert.equal(state.collapse.attributes["aria-label"], "Collapse leftbar");

  state.controller.toggleLeftbar(state.trigger);
  assert.equal(state.shell.dataset.drawer, undefined);
  assert.equal(state.collapse.attributes["aria-expanded"], "false");
  assert.equal(state.collapse.attributes["aria-label"], "Expand leftbar");
  assert.equal(state.document.documentElement.dataset.leftbarState, "collapsed");
  assert.equal(state.storage.get("stellar:v2:leftbar-state"), "collapsed");

  state.controller.toggleLeftbar(state.trigger);
  assert.equal(state.shell.dataset.drawer, undefined);
  assert.equal(state.collapse.attributes["aria-expanded"], "true");
  assert.equal(state.document.documentElement.dataset.leftbarState, "expanded");

  state.controller.toggleDrawer("rightbar", state.trigger);
  assert.equal(state.shell.dataset.drawer, "rightbar");
  assert.equal(state.rightToggle.attributes["aria-expanded"], "true");
  assert.equal(state.rightRegion.inert, false);
});

test("中等宽度 Main 在 Leftbar 后的剩余空间中居中", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");

  assert.doesNotMatch(css, /\n {2}\.site-shell:not\(\[data-drawer='leftbar'\]\) \.site-region--leftbar\s*\n\s+leftbar-rail\(\)/);
  assert.match(css, /@media screen and \(min-width: \(\$device-tablet \+ 1px\)\) and \(max-width: \$device-laptop\)[\s\S]*\.site-shell\[data-regions~='leftbar'\] \.site-main[\s\S]*width: unquote\('min\(var\(--width-main\), max\(0px, calc\(100% - var\(--shell-left-reserve\) - var\(--shell-side-gap\) - var\(--shell-side-gap\)\)\)\)'\)[\s\S]*margin-inline: 0[\s\S]*margin-inline-start: unquote\('calc\(var\(--shell-left-reserve\) \+ max\(var\(--shell-side-gap\), \(100% - var\(--shell-left-reserve\) - var\(--width-main\)\) \/ 2\)\)'\)/);
});

test("移动端 Leftbar Drawer 保留底部间距与可见圆角", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");

  assert.match(
    css,
    /@media screen and \(max-width: \$device-tablet\)[\s\S]*\.site-shell\[data-drawer='leftbar'\] \.site-region--leftbar\s*\n\s+top: 8px\s*\n\s+bottom: 64px\s*\n\s+height: auto/,
    "移动端 Drawer 应覆盖 Laptop 规则的固定视口高度，保留 Dock 上方的底部间距"
  );
});

test("移动端 Leftbar 始终在自身边界裁剪光效", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");
  const mobileStart = css.indexOf("@media screen and (max-width: $device-tablet)");
  const mobileEnd = css.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
  const mobileLayout = css.slice(mobileStart, mobileEnd);

  assert.match(
    mobileLayout,
    /\.site-region--leftbar\s*\n\s+position: fixed[\s\S]*?\n\s+overflow: hidden[\s\S]*?\n\s+\.site-region__surface/,
    "Leftbar 应始终在 Region 边界裁剪装饰光效"
  );
  assert.doesNotMatch(
    mobileLayout,
    /\.site-shell(?::not)?\(?(?:\[data-drawer='leftbar'\])?\)? \.site-region--leftbar\s*\n\s+overflow:/,
    "光效裁剪不应跟随 Drawer 状态切换"
  );
});

test("移动端 Main 铺满可用屏幕宽度", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");

  assert.match(
    css,
    /@media screen and \(max-width: \$device-tablet\)[\s\S]*\.site-main\s*\n\s+width: 100%\s*\n\s+max-width: none\s*\n\s+margin-inline: 0/,
    "移动端 Main 应覆盖桌面的最大宽度与自动居中边距"
  );
});

test("Main 在所有宽度与 Region 组合下保持顶部间距", () => {
  const mainCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/main.styl"), "utf8");

  assert.match(
    mainCss,
    /\.site-main\s*\n\s+position: relative\s*\n\s+padding-bottom: var\(--gap-page\)\s*\n\s+padding-top: var\(--shell-content-top-gap\)/,
    "Main 默认应保留顶部间距"
  );
  assert.doesNotMatch(mainCss, /padding-top: 0/);
  assert.doesNotMatch(mainCss, /data-regions~='topbar'/);
  assert.doesNotMatch(mainCss, /body\[data-page-type='index'\]/);
});

test("首屏恢复脚本使用版本化键并在非法缓存时回退站点默认", () => {
  const head = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/head.ejs"), "utf8");
  assert.match(head, /stellar:v2:leftbar-state/);
  assert.match(head, /value === 'collapsed' \|\| value === 'expanded'/);
  assert.match(head, /layout\.regions\.leftbar\.defaultState/);
  assert.doesNotMatch(head, /stellar:v2:sidebar-state/);
});

test("Rightbar Drawer 按内容高度展开且最大高度与 Leftbar 上下边界对齐", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");
  const breakpointStart = css.indexOf("@media screen and (max-width: $device-laptop)");
  const breakpointEnd = css.indexOf("@media screen and (min-width: ($device-tablet + 1px))", breakpointStart);
  const drawerLayout = css.slice(breakpointStart, breakpointEnd);
  const mobileStart = css.indexOf("@media screen and (max-width: $device-tablet)");
  const mobileEnd = css.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
  const mobileLayout = css.slice(mobileStart, mobileEnd);
  const rightbarStart = drawerLayout.indexOf("  .site-region--rightbar");
  const rightbarEnd = drawerLayout.indexOf("  .site-shell[data-drawer='rightbar']", rightbarStart);
  const rightbarLayout = drawerLayout.slice(rightbarStart, rightbarEnd);

  assert.match(drawerLayout, /--rightbar-drawer-top: var\(--leftbar-gap\)[\s\S]*?--rightbar-drawer-bottom: var\(--leftbar-gap\)/);
  assert.match(drawerLayout, /--rightbar-drawer-max-height: calc\(100dvh - var\(--rightbar-drawer-top\) - var\(--rightbar-drawer-bottom\)\)/);
  assert.match(mobileLayout, /--rightbar-drawer-top: 8px[\s\S]*?--rightbar-drawer-bottom: 64px/);
  assert.match(mobileLayout, /--rightbar-drawer-max-height: calc\(100dvh - var\(--rightbar-drawer-top\) - var\(--rightbar-drawer-bottom\)\)/);
  assert.match(mobileLayout, /\.site-region--leftbar[\s\S]*?bottom: 64px/);
  assert.match(mobileLayout, /\.site-shell\[data-regions~='topbar'\][\s\S]*?--rightbar-drawer-top: calc\(var\(--shell-topbar-height\) \+ 8px\)/);
  assert.match(rightbarLayout, /\.site-region--rightbar[\s\S]*?top: var\(--rightbar-drawer-top\)/);
  assert.match(rightbarLayout, /\.site-region--rightbar[\s\S]*?height: auto[\s\S]*?max-height: var\(--rightbar-drawer-max-height\)/);
  assert.match(rightbarLayout, /\.site-region__surface[\s\S]*?position: relative[\s\S]*?top: auto[\s\S]*?height: auto[\s\S]*?max-height: var\(--rightbar-drawer-max-height\)/);
  assert.match(rightbarLayout, /\.site-region__viewport[\s\S]*?height: auto[\s\S]*?max-height: var\(--rightbar-drawer-max-height\)/);
  assert.doesNotMatch(rightbarLayout, /height: calc\(100d?vh/);
  assert.doesNotMatch(rightbarLayout, /height: 100%/);
});

test("Shell 使用内容高度 Rightbar、中等宽度非对称 Main 与分阶段 Drawer", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/layout.styl"), "utf8");
  const mainCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/main.styl"), "utf8");
  const listingNavCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/partial/listing-nav.styl"), "utf8");
  const collectionCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/collection.styl"), "utf8");
  const appearanceCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_appearances/_mixins.styl"), "utf8");
  const sidebarCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/sidebar/sidebar.styl"), "utf8");
  const settingsCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/widgets/settings.styl"), "utf8");
  const tocCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/widgets/toc.styl"), "utf8");
  assert.match(css, /\.site-workspace[\s\S]*position: relative[\s\S]*min-height: calc\(100dvh - var\(--shell-sticky-offset\)\)/);
  assert.doesNotMatch(css, /grid-template-areas|grid-template-columns: var\(--leftbar-width\)/);
  assert.match(css, /\.site-region--leftbar,\s*\n\.site-region--rightbar[\s\S]*position: absolute[\s\S]*bottom: 0/);
  assert.match(css, /\.site-region--leftbar\s*\n\s+top: var\(--leftbar-gap\)\s*\n\s+inset-inline-start: var\(--leftbar-gap\)/);
  assert.match(css, /\.site-region__surface[\s\S]*position: sticky[\s\S]*height: var\(--shell-panel-height\)/);
  assert.match(css, /\.site-region__surface > \.site-region__viewport[\s\S]*box-sizing: border-box[\s\S]*height: 100%/);
  assert.match(css, /\.site-region--rightbar\s*\n\s+top: var\(--shell-content-top-gap\)[\s\S]*\.site-region__surface[\s\S]*top: var\(--rightbar-sticky-offset\)[\s\S]*height: auto[\s\S]*max-height: var\(--rightbar-panel-height\)[\s\S]*\.site-region__viewport[\s\S]*height: auto[\s\S]*max-height: var\(--rightbar-panel-height\)/);
  assert.match(css, /\.site-main[\s\S]*width: unquote\('min\(var\(--width-main\), max\(0px, calc\(100%/);
  assert.match(css, /\.site-main[\s\S]*margin-inline: auto/);
  assert.match(css, /--shell-edge-inset: 0px/);
  assert.match(css, /--shell-topbar-top: var\(--shell-edge-inset\)/);
  assert.match(css, /--shell-topbar-content-inset: 8px/);
  assert.match(css, /--shell-topbar-height: 64px/);
  assert.match(css, /--shell-topbar-content-center-offset: calc\(var\(--shell-topbar-height\) \/ 2 - var\(--shell-topbar-content-inset\)\)/);
  assert.match(css, /--shell-content-top-gap: var\(--gap-page\)/);
  assert.match(css, /--rightbar-sticky-offset: calc\(var\(--shell-sticky-offset\) \+ var\(--gap-base\)\)/);
  assert.match(css, /--rightbar-panel-height: calc\(100dvh - var\(--shell-sticky-offset\) - var\(--shell-edge-inset\) - var\(--shell-content-top-gap\)\)/);
  assert.match(mainCss, /\.site-main[\s\S]*padding-top: var\(--shell-content-top-gap\)/);
  assert.doesNotMatch(mainCss, /@media screen and \(min-width: \$device-mobile-max\)[\s\S]*padding-top: var\(--shell-content-top-gap\)/);
  assert.match(css, /--leftbar-gap: 1rem/);
  assert.match(css, /--leftbar-sticky-offset: calc\(var\(--shell-topbar-bottom\) \+ var\(--leftbar-gap\)\)/);
  assert.match(css, /--leftbar-panel-height: calc\(100dvh - var\(--leftbar-sticky-offset\) - var\(--leftbar-gap\)\)/);
  assert.match(css, /--shell-side-reserve: unquote\('max\(var\(--shell-left-reserve\), var\(--shell-right-reserve\)\)'\)/);
  assert.match(css, /--shell-side-gap: unquote\('max\(var\(--gap-page\), var\(--shell-gap\), var\(--shell-left-gap\)\)'\)/);
  assert.match(css, /--shell-sticky-offset: calc\(var\(--shell-edge-inset\) \+ var\(--shell-topbar-height\)\)/);
  assert.match(css, /\.site-shell\[data-regions~='topbar'\]\s*\n\s+--shell-sticky-offset:[^\n]+\n\s+--shell-topbar-bottom:[^\n]+\n\s+padding-top: var\(--shell-topbar-top\)/);
  assert.match(css, /\.site-region--topbar[\s\S]*height: var\(--shell-topbar-height\)[\s\S]*min-height: var\(--shell-topbar-height\)[\s\S]*max-height: var\(--shell-topbar-height\)[\s\S]*\.widget-stack[\s\S]*height: 100%[\s\S]*min-height: 0/);
  assert.match(listingNavCss, /\.site-shell\[data-regions~='topbar'\] \.listing-nav[\s\S]*top: calc\(var\(--shell-topbar-top\) \+ var\(--shell-topbar-content-inset\)\)[\s\S]*z-index: 13/);
  assert.match(listingNavCss, /\.site-shell\[data-regions~='topbar'\] \.listing-nav \.listing-nav__surface\.is-pinned[\s\S]*background: transparent[\s\S]*box-shadow: none/);
  assert.match(listingNavCss, /\.site-shell\[data-regions~='topbar'\] \.listing-nav \.listing-nav__surface\.is-pinned[\s\S]*&:before,\s*&:after[\s\S]*display: none/);
  assert.match(listingNavCss, /\.listing-nav\s*\n\s+z-index: 8\s*\n\s+top: var\(--gap-page\)/);
  assert.match(css, /\.site-region--leftbar[\s\S]*inset-inline-start: var\(--leftbar-gap\)[\s\S]*top: var\(--leftbar-sticky-offset\)[\s\S]*height: var\(--leftbar-panel-height\)/);
  assert.match(css, /--shell-left-reserve: calc\(var\(--leftbar-width\) \+ var\(--shell-left-gap\)\)/);
  assert.match(css, /leftbar-rail\(\)[\s\S]*width: var\(--leftbar-rail-width\)/);
  assert.match(css, /html\[data-leftbar-state='collapsed'\] \.site-shell:not\(\[data-drawer='leftbar'\]\) \.site-region--leftbar\s*\n\s+leftbar-rail\(\)/);
  assert.doesNotMatch(css, /\n {2}\.site-shell:not\(\[data-drawer='leftbar'\]\) \.site-region--leftbar\s*\n\s+leftbar-rail\(\)/);
  assert.doesNotMatch(css, /leftbar-expanded\(\)/);
  assert.doesNotMatch(css, /\.site-shell\[data-drawer='leftbar'\] \.site-region--leftbar[\s\S]{0,320}leftbar-rail\(\)/);
  assert.match(settingsCss, /html\[data-leftbar-state='collapsed'\] \.site-shell:not\(\[data-drawer='leftbar'\]\) \.site-region--leftbar[\s\S]*\.settings-widget__name[\s\S]*display: none/);
  assert.doesNotMatch(settingsCss, /html\[data-leftbar-state='collapsed'\] \.site-region--leftbar/);
  assert.match(css, /@media screen and \(max-width: \$device-laptop\)[\s\S]*--shell-side-reserve: var\(--shell-left-reserve\)[\s\S]*\.site-region--rightbar[\s\S]*position: fixed/);
  assert.match(css, /@media screen and \(max-width: \$device-tablet\)[\s\S]*--shell-side-reserve: 0px[\s\S]*\.site-region--leftbar[\s\S]*position: fixed/);
  assert.match(css, /\.site-shell\[data-drawer='leftbar'\] \.site-region--leftbar[\s\S]*top: var\(--gap-page\)/);
  assert.match(css, /@media screen and \(max-width: \$device-tablet\)[\s\S]*\.site-region--leftbar[\s\S]*top: 8px[\s\S]*\.site-shell\[data-regions~='topbar'\] \.site-region--leftbar[\s\S]*top: calc\(var\(--shell-topbar-height\) \+ 8px\)/);
  assert.doesNotMatch(css, /\.site-region--rightbar \.widget-instance--toc/);
  assert.doesNotMatch(tocCss, /\.widget-wrapper\.toc[\s\S]{0,160}position: (?:sticky|-webkit-sticky)/);
  assert.match(tocCss, /Region Surface 统一负责固定高度与滚动/);
  assert.match(css, /\.leftbar-state-toggle[\s\S]*position: static[\s\S]*flex: 0 0 32px[\s\S]*width: 32px[\s\S]*height: 32px/);
  assert.match(sidebarCss, /\.site-region__zone--body[\s\S]*mask: linear-gradient\(white, 90%, transparent\)/);
  assert.match(sidebarCss, /\.site-region__zone--body[\s\S]*> \.widgets[\s\S]*padding-bottom: 64px/);
  assert.match(sidebarCss, /\.site-region__footer[\s\S]*\.site-region__system/);
  assert.match(collectionCss, /\.ui-collection\[data-layout='inline'\][\s\S]*display: flex/);
  assert.match(collectionCss, /\.ui-collection__item:active,[\s\S]*\.ui-collection__item\.is-active,[\s\S]*details\[open\] > \.ui-collection__item[\s\S]*color: var\(--ui-item-title\)/);
  assert.doesNotMatch(collectionCss, /--ui-item-(?:bg|shadow)|background: var\(--ui-item/);
  assert.match(appearanceCss, /appearance-standard-interactions\(\)[\s\S]*\.ui-interactive:active,[\s\S]*details\[open\] > \.ui-interactive[\s\S]*background: var\(--block\)/);
  assert.doesNotMatch(appearanceCss, /appearance-(?:standard|glass)-interactions[\s\S]*\.ui-collection__item/);
  assert.doesNotMatch(sidebarCss, /@media screen and \(min-width: \$device-2k\)[\s\S]*?\.site-region--leftbar[\s\S]*?margin-left: auto/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
});

test("Rightbar Widget 间距复用 Leftbar 基础间距", () => {
  const widgetsCss = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/widgets/widgets.styl"), "utf8");
  assert.match(widgetsCss, /\.site-region--rightbar \.widgets[\s\S]*\.widget-instance \+ \.widget-instance > \.widget-wrapper\s*\n\s+margin-top: var\(--gap-base\)/);
});
