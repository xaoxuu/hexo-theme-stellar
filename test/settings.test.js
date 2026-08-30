"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { replaceSettingsTokens } = require("../scripts/lib/settings");
const { parseStellarConfig } = require("../scripts/lib/config-schema");

function loadGenerator(profilePath = "/settings/", extraProfiles = {}) {
  let generator;
  const previous = global.hexo;
  const mock = {
    stellar: { config: { profiles: Object.assign({ settings: { path: profilePath, activeMenu: null } }, extraProfiles) } },
    config: { language: "zh-CN" },
    theme: { i18n: { __() { return key => key === "settings.title" ? "设置" : key; } } },
    extend: { generator: { register(name, callback) { if (name === "settings") generator = callback; } } }
  };
  global.hexo = mock;
  const modulePath = require.resolve("../scripts/generators/settings");
  delete require.cache[modulePath];
  require(modulePath);
  global.hexo = previous;
  return (...args) => {
    global.hexo = mock;
    try { return generator(...args); } finally { global.hexo = previous; }
  };
}

function locals(pages = []) {
  return { get(name) { return name === "pages" ? { toArray() { return pages; } } : null; } };
}

async function settingsAvatarHarness(initialIdentity, getGravatarUrl) {
  let identity = Object.assign({}, initialIdentity);
  const windowListeners = new Map();
  const formListeners = new Map();
  const buttonListeners = new Map();
  const avatar = {
    hidden: false,
    src: "",
    onerror: null,
    removeAttribute(name) { if (name === "src") this.src = ""; }
  };
  const avatarFallback = { hidden: true };
  const nameInput = { value: "" };
  const emailInput = { value: "" };
  const urlInput = { value: "" };
  const form = {
    hidden: false,
    querySelector(selector) {
      return { '[name="name"]': nameInput, '[name="email"]': emailInput, '[name="url"]': urlInput }[selector] || null;
    },
    reportValidity() { return true; },
    addEventListener(type, listener) { formListeners.set(type, listener); },
    removeEventListener(type) { formListeners.delete(type); }
  };
  const logoutButton = {
    hidden: false,
    addEventListener(type, listener) { buttonListeners.set(type, listener); },
    removeEventListener(type) { buttonListeners.delete(type); }
  };
  const note = { hidden: false };
  const status = { textContent: "", dataset: {} };
  const page = {
    dataset: {
      provider: "artalk",
      fallbackAvatar: "/fallback.png",
      messageSuccess: "success",
      messagePartial: "partial",
      messageFailure: "failure"
    },
    querySelector(selector) {
      return {
        "[data-profile-form]": form,
        "[data-provider-note]": note,
        "[data-profile-status]": status,
        "[data-profile-avatar]": avatar,
        "[data-profile-avatar-fallback]": avatarFallback,
        "[data-profile-logout]": logoutButton
      }[selector] || null;
    },
    querySelectorAll() { return []; }
  };
  const root = { querySelector(selector) { return selector === ".settings-page" ? page : null; } };
  const previousWindow = globalThis.window;
  globalThis.window = {
    stellarProfile: {
      supports() { return true; },
      readIdentity() { return Object.assign({}, identity); },
      writeIdentity() { return { ok: true, partial: false }; },
      logout() { identity = { name: "", email: "", url: "", avatar: "" }; return { ok: true, partial: false }; },
      getGravatarUrl
    },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type) { windowListeners.delete(type); }
  };
  const moduleUrl = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/settings.mjs"));
  moduleUrl.searchParams.set("avatar-test", `${Date.now()}-${Math.random()}`);
  const { mount } = await import(moduleUrl.href);
  const cleanup = mount(root, { request: { clearCache() { return { ok: true, partial: false }; } } });
  return {
    avatar,
    avatarFallback,
    windowListeners,
    formListeners,
    buttonListeners,
    setIdentity(value) { identity = Object.assign({}, value); },
    cleanup() {
      cleanup?.();
      globalThis.window = previousWindow;
    }
  };
}

async function flushPromises() { await Promise.resolve(); await Promise.resolve(); }

test("设置页生成默认与自定义路由，并输出私有索引标记", () => {
  const generated = loadGenerator()(locals());
  assert.equal(generated.path, "settings/index.html");
  assert.equal(generated.layout[0], "settings");
  assert.equal(generated.data.title, "设置");
  assert.equal(generated.data.robots, "noindex,nofollow");
  assert.equal(generated.data.sitemap, false);
  assert.equal(generated.data.feed, false);
  assert.equal(generated.data.search, false);
  assert.equal(loadGenerator("/account/preferences/")(locals()).path, "account/preferences/index.html");
});

test("设置页路径与已有页面冲突时构建失败", () => {
  assert.throws(() => loadGenerator()(locals([{ path: "settings/index.html", source: "settings.md" }])), /路径.*冲突/);
  assert.throws(() => loadGenerator("/settings/", { blogIndex: { path: "/settings/" } })(locals()), /profiles\.blogIndex/);
});

test("About 只替换公开变量，未知变量保留原文", () => {
  assert.equal(replaceSettingsTokens("Hexo {hexo.version} / {unknown.value}", {
    "{hexo.version}": "8.0.0"
  }), "Hexo 8.0.0 / {unknown.value}");
});

test("设置页复用文章页正文容器，不维护独立的容器布局", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/settings.ejs"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/pages/settings.styl"), "utf8");
  const pageRule = css.slice(css.indexOf(".settings-page\n"), css.indexOf("\n.settings-page__header"));
  const mobileStart = css.indexOf("@media screen and (max-width: $device-mobile-max)");
  const mobilePageRule = css.slice(css.indexOf("  .settings-page\n", mobileStart), css.indexOf("  .settings-section\n", mobileStart));

  assert.match(template, /<article class="md-text content settings-page"/);
  assert.match(template, /<\/article>\s*$/);
  assert.doesNotMatch(pageRule, /\n\s+(?:width|margin|padding|box-sizing|color):/);
  assert.doesNotMatch(mobilePageRule, /\n\s+(?:width|margin|padding|box-sizing|color):/);
});

test("设置页头像在所有视口保持 96px 正圆", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/pages/settings.styl"), "utf8");
  const avatarStart = css.indexOf(".settings-profile__avatar\n");
  const avatarEnd = css.indexOf("\n.settings-profile__content", avatarStart);
  const avatarRule = css.slice(avatarStart, avatarEnd);
  const mobileStart = css.indexOf("@media screen and (max-width: $device-mobile-max)");
  const mobileRule = css.slice(mobileStart);

  assert.match(avatarRule, /width: 96px/);
  assert.match(avatarRule, /height: 96px/);
  assert.match(avatarRule, /border-radius: 50%/);
  assert.match(avatarRule, /corner-shape: round/);
  assert.doesNotMatch(mobileRule, /\.settings-profile__avatar/);
});

test("About Schema 接受可选模板链接并拒绝危险协议", () => {
  const config = parseStellarConfig({ themeConfig: { settings: { about: { items: [
    { key: "Theme", value: "{theme.version}", url: "{theme.tree}" },
    { key: "Unknown", value: "{custom.value}", url: "{custom.url}" },
    { key: "Plain", value: "Text" }
  ] } } } });
  assert.equal(config.settings.about.items[0].url, "{theme.tree}");
  assert.equal(config.settings.about.items[2].url, null);
  assert.throws(() => parseStellarConfig({ themeConfig: { settings: { about: { items: [
    { key: "Bad", value: "Bad", url: "javascript:{theme.tree}" }
  ] } } } }), /safe navigable URL/);
});

test("About 默认内置框架与主题版本，博主配置整体覆盖默认列表", () => {
  const defaults = parseStellarConfig({ themeConfig: {} }).settings.about.items;
  assert.deepEqual(defaults, [
    { key: "博客框架", value: "Hexo {hexo.version}", url: "https://hexo.io/" },
    { key: "主题版本", value: "Stellar {theme.version}", url: "{theme.tree}" }
  ]);
  const custom = parseStellarConfig({ themeConfig: { settings: { about: { items: [
    { key: "Custom", value: "Only this item" }
  ] } } } }).settings.about.items;
  assert.deepEqual(custom, [{ key: "Custom", value: "Only this item", url: null }]);
  assert.deepEqual(parseStellarConfig({ themeConfig: { settings: { about: { items: [] } } } }).settings.about.items, []);
});

test("About 模板仅把指定 Solar 图标作为链接，并保留 4px 间距", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/settings.ejs"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/pages/settings.styl"), "utf8");
  assert.match(template, /class="settings-kv__value"/);
  assert.match(template, /class="settings-kv__link"/);
  assert.match(template, /icon\('default:link'/);
  assert.match(template, /if \(href\)/);
  assert.doesNotMatch(template, /<a[^>]+settings-kv__row/);
  assert.match(css, /\.settings-kv__link[\s\S]*margin-left: 4px/);
});

test("设置页标题独占一行，内容与 About 行共享固定左右列布局且 Section 无卡片背景", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/settings.ejs"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/pages/settings.styl"), "utf8");
  assert.equal((template.match(/class="settings-section__body"/g) || []).length, 3);
  assert.match(css, /\.settings-section__body\n {2}display: grid\n {2}grid-template-columns: var\(--settings-label-width\) minmax\(0, 1fr\)/);
  assert.match(css, /\.settings-form[\s\S]*?label\n {4}display: grid\n {4}grid-template-columns: var\(--settings-label-width\) minmax\(0, 1fr\)/);
  assert.match(css, /\.settings-kv__row\n {2}display: grid\n {2}grid-template-columns: var\(--settings-label-width\) minmax\(0, 1fr\)/);
  assert.match(css, / {2}dt\n {4}display: flex\n {4}align-items: center/);
  const sectionStyles = css.slice(css.indexOf(".settings-section\n"), css.indexOf(".settings-section__body\n"));
  assert.doesNotMatch(sectionStyles, /display: grid|background:|box-shadow:|border-radius:/);
  assert.match(sectionStyles, /h2\n {4}margin: 0 0 1\.5rem/);
});

test("缓存区复用简约 KV 列表并仅用指定垃圾桶图标触发清理", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/settings.ejs"), "utf8");
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/pages/settings.styl"), "utf8");
  assert.match(template, /class="settings-kv settings-cache-list"/);
  assert.match(template, /data-cache-size="<%- item\.id %>"/);
  assert.match(template, /class="settings-kv__action" data-cache-action="<%- item\.id %>"/);
  assert.match(template, /icon\('default:trash'/);
  const kvStyles = css.slice(css.indexOf(".settings-kv\n"), css.indexOf(".settings-kv__value\n"));
  assert.doesNotMatch(kvStyles, /padding:|border:|border-radius:|background:|box-shadow:/);
  assert.match(kvStyles, /color: var\(--text-p3\)/);
  assert.match(css, /\.settings-kv__link,\n\.settings-kv__action[\s\S]*?width: 2rem\n {2}height: 2rem[\s\S]*?border-radius: 50%/);
  const actionStyles = css.slice(css.indexOf(".settings-kv__action\n", css.indexOf(".settings-kv__action\n") + 1), css.indexOf("@media screen"));
  assert.doesNotMatch(actionStyles, /width:|height:|border-radius:|color:|background:/);
  const runtime = fs.readFileSync(path.resolve(__dirname, "../source/js/runtime/extensions/settings.mjs"), "utf8");
  assert.match(runtime, /if \(result\.ok\) setStatus\(cacheStatus, '', ''\)/);
});

test("缓存大小按搜索、动态和两者并集统计并格式化", async () => {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/settings.mjs"));
  moduleUrl.searchParams.set("test", String(Date.now()));
  const { SEARCH_CACHE_KEY, measureCacheSizes, formatCacheSize } = await import(moduleUrl.href);
  const entries = new Map([
    [SEARCH_CACHE_KEY, "搜索"],
    ["Stellar.request-cache.v2.first", "one"],
    ["Stellar.request-cache.v2.second", "二"],
    ["unrelated", "ignored"]
  ]);
  const storage = {
    get length() { return entries.size; },
    key(index) { return Array.from(entries.keys())[index] || null; },
    getItem(key) { return entries.has(key) ? entries.get(key) : null; }
  };
  const sizes = measureCacheSizes(storage);
  const expectedSearch = Buffer.byteLength(SEARCH_CACHE_KEY + "搜索");
  const expectedDynamic = Buffer.byteLength("Stellar.request-cache.v2.firstoneStellar.request-cache.v2.second二");
  assert.deepEqual(sizes, { search: expectedSearch, dynamic: expectedDynamic, all: expectedSearch + expectedDynamic, failed: false });
  assert.equal(formatCacheSize(0), "0 B");
  assert.equal(formatCacheSize(1536), "1.5 KB");
  assert.equal(formatCacheSize(-1), "—");
  assert.equal(measureCacheSizes({ getItem() { throw new Error("denied"); } }).failed, true);
});

test("设置页头像保留 Provider 优先级，并依次回退 Gravatar、站点头像和图标", async () => {
  const calls = [];
  const target = await settingsAvatarHarness({
    name: "Alice",
    email: "alice@example.com",
    url: "",
    avatar: "https://cdn.example.com/provider.png"
  }, async (email, size) => {
    calls.push({ email, size });
    return "https://gravatar.com/avatar/hash?s=160&r=g&d=404";
  });
  try {
    assert.equal(target.avatar.src, "https://cdn.example.com/provider.png");
    assert.equal(calls.length, 0);

    target.avatar.onerror();
    await flushPromises();
    assert.deepEqual(calls, [{ email: "alice@example.com", size: 160 }]);
    assert.equal(target.avatar.src, "https://gravatar.com/avatar/hash?s=160&r=g&d=404");

    target.avatar.onerror();
    assert.equal(target.avatar.src, "/fallback.png");
    target.avatar.onerror();
    assert.equal(target.avatar.hidden, true);
    assert.equal(target.avatar.src, "");
    assert.equal(target.avatarFallback.hidden, false);
  } finally {
    target.cleanup();
  }
});

test("设置页身份事件会刷新头像，并忽略更早的异步 Gravatar 结果", async () => {
  const pending = [];
  const target = await settingsAvatarHarness({ name: "Old", email: "old@example.com", url: "", avatar: "" }, (email, size) => {
    return new Promise(resolve => pending.push({ email, size, resolve }));
  });
  try {
    assert.equal(pending.length, 1);
    target.setIdentity({ name: "New", email: "new@example.com", url: "", avatar: "" });
    target.windowListeners.get("stellar:profile-change")();
    assert.equal(pending.length, 2);

    pending[1].resolve("https://gravatar.com/avatar/new?s=160&r=g&d=404");
    await flushPromises();
    assert.equal(target.avatar.src, "https://gravatar.com/avatar/new?s=160&r=g&d=404");

    pending[0].resolve("https://gravatar.com/avatar/old?s=160&r=g&d=404");
    await flushPromises();
    assert.equal(target.avatar.src, "https://gravatar.com/avatar/new?s=160&r=g&d=404");

    target.setIdentity({ name: "Storage", email: "storage@example.com", url: "", avatar: "" });
    target.windowListeners.get("storage")();
    assert.equal(pending[2].email, "storage@example.com");
    assert.equal(pending[2].size, 160);
  } finally {
    target.cleanup();
  }
});

test("侧边栏 Settings Widget 整体链接到设置页", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/widgets/settings.ejs"), "utf8");
  assert.match(template, /<a class="<%- ui_classes\('settings-widget', 'collectionItem'\) %>" href="<%- escape_html\(url_for\(settingsUrl\)\) %>"/);
  assert.match(template, /profiles\.settings/);
  assert.match(template, /data-profile-identity-enabled/);
  assert.match(template, /data-profile-fallback-avatar/);
  assert.match(template, /fallbacks\.avatar/);
  assert.match(template, /default:settings/);
  assert.match(template, /settings\.label/);
  assert.match(template, /settings-widget__name ui-collection__title/);
  assert.doesNotMatch(template, /profile-widget|data-profile-placement/);
});

test("Settings Widget 身份只取决于站点默认评论 Provider，不随页面评论状态变化", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/widgets/settings.ejs"), "utf8");
  assert.match(template, /var provider = stellar_config\('comments\.provider'\) \|\| ''/);
  assert.match(template, /var identityEnabled = supportedProvider/);
  assert.doesNotMatch(template, /viewModel|content_config\(page\)|commentState|commentsEnabled|page\.cmt_rendered/);
});

test("Settings Widget 头像容器只输出当前服务端状态，身份媒体由客户端按需创建", () => {
  const template = fs.readFileSync(path.resolve(__dirname, "../layout/_partial/widgets/settings.ejs"), "utf8");
  const start = template.indexOf('<span class="settings-widget__avatar"');
  const end = template.indexOf("\n  </span>", start);
  const avatar = template.slice(start, end);
  assert.match(avatar, /<span class="ui-icon">/);
  assert.equal((avatar.match(/<span/g) || []).length, 2);
  assert.doesNotMatch(avatar, /settings-widget__image/);
  assert.doesNotMatch(avatar, /settings-widget__fallback/);
});

test("Leftbar 与 Topbar 的 Settings 头像保持 2px 内边距和正圆曲率", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/widgets/settings.styl"), "utf8");
  const start = css.indexOf(".site-region--leftbar,\n.site-region--topbar");
  const end = css.indexOf("\n.site-region--topbar,", start);
  const avatarRule = css.slice(start, end);
  assert.match(avatarRule, /\.settings-widget__avatar > img/);
  assert.match(avatarRule, /width: 28px/);
  assert.match(avatarRule, /height: 28px/);
  assert.match(avatarRule, /border-radius: 50%/);
  assert.match(avatarRule, /corner-shape: round/);
});

test("本地搜索导出清理接口并同步清空内存索引", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../source/js/search/local-search.js"), "utf8");
  assert.match(source, /function clearSearchCache\(\)[\s\S]*searchCache = null;[\s\S]*searchCacheEntry = null;/);
  assert.match(source, /stellarLocalSearch = \{ mount: mountLocalSearch, clearCache: clearSearchCache \}/);
});
