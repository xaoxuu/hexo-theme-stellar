"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

const SOURCE = fs.readFileSync(path.resolve(__dirname, "../source/js/profile.js"), "utf8");

function storage(initial = {}, denied = false) {
  const values = Object.assign({}, initial);
  return {
    getItem(key) { if (denied) throw new Error("denied"); return values[key] ?? null; },
    setItem(key, value) { if (denied) throw new Error("denied"); values[key] = String(value); },
    removeItem(key) { if (denied) throw new Error("denied"); delete values[key]; },
    values
  };
}

function api(local = {}, session = {}, denied = false, widgets = [], cryptoApi = webcrypto) {
  const localStorage = storage(local, denied);
  const sessionStorage = storage(session, denied);
  const listeners = new Map();
  const window = {
    crypto: cryptoApi,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); }
  };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  const context = {
    window,
    document: {
      readyState: widgets.length > 0 ? "complete" : "loading",
      querySelectorAll() { return widgets; },
      createElement(tagName) {
        return {
          tagName: tagName.toUpperCase(),
          className: "",
          innerHTML: "",
          src: "",
          alt: "",
          onerror: null
        };
      },
      addEventListener() {},
      removeEventListener() {}
    },
    localStorage,
    sessionStorage,
    CustomEvent,
    Promise,
    TextEncoder,
    Uint8Array,
    URL,
    setTimeout
  };
  window.stellarIcons = {
    "default:profile": '<svg data-test="profile"></svg>',
    "default:settings": '<svg data-test="settings"></svg>'
  };
  vm.runInNewContext(SOURCE, context);
  return { profile: window.stellarProfile, localStorage, sessionStorage, listeners };
}

function widget(provider, enabled = true, fallbackAvatar = "") {
  const nodes = {
    name: { textContent: "" },
    avatar: {
      children: [{ tagName: "SPAN", className: "ui-icon", innerHTML: '<svg data-test="settings"></svg>' }],
      replaceChildren(...children) { this.children = children; }
    }
  };
  const attributes = {};
  return {
    dataset: {
      profileProvider: provider,
      profileIdentityEnabled: enabled ? "true" : "false",
      profileFallbackAvatar: fallbackAvatar,
      settingsLabel: "Settings"
    },
    querySelector(selector) {
      return {
        ".settings-widget__name": nodes.name,
        ".settings-widget__avatar": nodes.avatar
      }[selector] || null;
    },
    setAttribute(name, value) { attributes[name] = value; },
    getAttribute(name) { return attributes[name] || null; },
    nodes,
    attributes
  };
}

function plain(value) { return JSON.parse(JSON.stringify(value)); }
function parsed(store, key) { return JSON.parse(store.values[key]); }
async function flushPromises() {
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));
}

test("Gravatar URL 使用规范化 Email 的 SHA-256，并在能力或输入不可用时安全降级", async () => {
  const target = api();
  assert.equal(
    await target.profile.getGravatarUrl(" MyEmailAddress@example.com ", 160),
    "https://gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=160&r=g&d=404"
  );
  assert.equal(await target.profile.getGravatarUrl("not-an-email", 160), "");
  assert.equal(await api({}, {}, false, [], null).profile.getGravatarUrl("a@example.com", 64), "");
  assert.equal(await api({}, {}, false, [], { subtle: { digest() { return Promise.reject(new Error("failed")); } } }).profile.getGravatarUrl("a@example.com", 64), "");
});

test("评论身份层读取 Artalk、Waline 与 Twikoo 的资料并过滤非法头像", () => {
  assert.deepEqual(plain(api({ ArtalkUser: JSON.stringify({ name: "Alice", email: "a@example.com", link: "https://a.example/", avatar: "javascript:alert(1)" }) }).profile.readIdentity("artalk")), {
    provider: "artalk", supported: true, name: "Alice", email: "a@example.com", url: "https://a.example/", avatar: ""
  });
  assert.deepEqual(plain(api({}, { WALINE_USER: JSON.stringify({ display_name: "Bob", email: "b@example.com", url: "https://b.example", avatar: "https://cdn.example.com/b.png" }) }).profile.readIdentity("waline")), {
    provider: "waline", supported: true, name: "Bob", email: "b@example.com", url: "https://b.example/", avatar: "https://cdn.example.com/b.png"
  });
  assert.equal(api({ twikoo: JSON.stringify({ nick: "Carol", mail: "c@example.com" }) }).profile.readIdentity("twikoo").name, "Carol");
});

test("更新身份保留 Provider token 与未知字段", () => {
  const artalk = api({ ArtalkUser: JSON.stringify({ name: "Old", token: "secret", custom: 1 }) });
  assert.deepEqual(plain(artalk.profile.writeIdentity("artalk", { name: "New", email: "new@example.com", url: "https://new.example/" })), { ok: true, partial: false });
  assert.deepEqual(parsed(artalk.localStorage, "ArtalkUser"), { name: "New", token: "secret", custom: 1, email: "new@example.com", link: "https://new.example/" });

  const waline = api({ WALINE_USER_META: JSON.stringify({ nick: "Reader", extra: true }) }, { WALINE_USER: JSON.stringify({ display_name: "Member", token: "token", role: "admin" }) });
  assert.equal(waline.profile.writeIdentity("waline", { name: "Updated", email: "u@example.com", url: "https://u.example" }).ok, true);
  assert.equal(parsed(waline.sessionStorage, "WALINE_USER").token, "token");
  assert.equal(parsed(waline.sessionStorage, "WALINE_USER").role, "admin");
  assert.equal(parsed(waline.localStorage, "WALINE_USER_META").extra, true);

  const twikoo = api({ twikoo: JSON.stringify({ nick: "Old", token: "keep", other: 2 }) });
  assert.equal(twikoo.profile.writeIdentity("twikoo", { name: "New", email: "", url: "" }).ok, true);
  assert.equal(parsed(twikoo.localStorage, "twikoo").token, "keep");
});

test("退出只清除当前 Provider 身份缓存", () => {
  const target = api({ twikoo: "{}", ArtalkUser: "{}", unrelated: "keep" });
  assert.equal(target.profile.logout("twikoo").ok, true);
  assert.equal(target.localStorage.values.twikoo, undefined);
  assert.equal(target.localStorage.values.ArtalkUser, "{}");
  assert.equal(target.localStorage.values.unrelated, "keep");
});

test("损坏缓存、存储拒绝、不支持 Provider 与输入校验均可降级", () => {
  assert.equal(api({ ArtalkUser: "{" }).profile.readIdentity("artalk").name, "");
  assert.equal(api().profile.readIdentity("giscus").supported, false);
  assert.deepEqual(plain(api().profile.writeIdentity("giscus", { name: "A" })), { ok: false, unsupported: true, partial: false });
  assert.equal(api().profile.writeIdentity("artalk", { name: "", email: "", url: "" }).validation, "name");
  assert.equal(api().profile.writeIdentity("artalk", { name: "A".repeat(81), email: "", url: "" }).validation, "name");
  assert.equal(api().profile.writeIdentity("artalk", { name: "A", email: "bad", url: "" }).validation, "email");
  assert.equal(api().profile.writeIdentity("artalk", { name: "A", email: "", url: "javascript:bad" }).validation, "url");
  assert.equal(api({}, {}, true).profile.writeIdentity("artalk", { name: "A", email: "", url: "" }).ok, false);
});

test("Settings 入口仅在身份开关允许时显示有效缓存，其余状态回退默认设置状态", () => {
  const identified = widget("artalk");
  api({ ArtalkUser: JSON.stringify({ name: "Alice", avatar: "javascript:bad" }) }, {}, false, [identified]);
  assert.equal(identified.nodes.name.textContent, "Alice");
  assert.equal(identified.nodes.avatar.children.length, 1);
  assert.equal(identified.nodes.avatar.children[0].className, "ui-icon");
  assert.match(identified.nodes.avatar.children[0].innerHTML, /data-test="profile"/);

  const withAvatar = widget("waline");
  api({}, { WALINE_USER: JSON.stringify({ display_name: "Bob", avatar: "https://cdn.example.com/a.png" }) }, false, [withAvatar]);
  assert.equal(withAvatar.nodes.avatar.children.length, 1);
  assert.equal(withAvatar.nodes.avatar.children[0].tagName, "IMG");
  assert.equal(withAvatar.nodes.avatar.children[0].src, "https://cdn.example.com/a.png");
  withAvatar.nodes.avatar.children[0].onerror();
  assert.equal(withAvatar.nodes.avatar.children.length, 1);
  assert.equal(withAvatar.nodes.avatar.children[0].className, "ui-icon");
  assert.match(withAvatar.nodes.avatar.children[0].innerHTML, /data-test="profile"/);

  const disabled = widget("artalk", false);
  api({ ArtalkUser: JSON.stringify({ name: "Alice", avatar: "https://cdn.example.com/a.png" }) }, {}, false, [disabled]);
  assert.equal(disabled.nodes.name.textContent, "Settings");
  assert.equal(disabled.nodes.avatar.children.length, 1);
  assert.equal(disabled.nodes.avatar.children[0].className, "ui-icon");
  assert.match(disabled.nodes.avatar.children[0].innerHTML, /data-test="settings"/);

  const unsupported = widget("giscus");
  api({}, {}, false, [unsupported]);
  assert.equal(unsupported.nodes.name.textContent, "Settings");
  assert.equal(unsupported.nodes.avatar.children.length, 1);
});

test("Settings Widget 保留 Provider 头像优先级，并依次回退 Gravatar、站点头像和图标", async () => {
  let digestCalls = 0;
  const cryptoApi = {
    subtle: {
      digest(algorithm, bytes) {
        digestCalls++;
        return webcrypto.subtle.digest(algorithm, bytes);
      }
    }
  };
  const target = widget("artalk", true, "/fallback.png");
  const mounted = api({ ArtalkUser: JSON.stringify({
    name: "Alice",
    email: "MyEmailAddress@example.com",
    avatar: "https://cdn.example.com/provider.png"
  }) }, {}, false, [target], cryptoApi);

  assert.equal(target.nodes.avatar.children[0].src, "https://cdn.example.com/provider.png");
  assert.equal(digestCalls, 0);

  target.nodes.avatar.children[0].onerror();
  const gravatarUrl = await mounted.profile.getGravatarUrl("MyEmailAddress@example.com", 64);
  await flushPromises();
  assert.equal(digestCalls, 1);
  assert.equal(gravatarUrl, "https://gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=64&r=g&d=404");
  assert.equal(target.nodes.avatar.children[0].src, gravatarUrl);

  target.nodes.avatar.children[0].onerror();
  assert.equal(target.nodes.avatar.children[0].src, "/fallback.png");
  target.nodes.avatar.children[0].onerror();
  assert.equal(target.nodes.avatar.children[0].className, "ui-icon");
  assert.match(target.nodes.avatar.children[0].innerHTML, /data-test="profile"/);
});

test("Settings Widget 忽略身份刷新前尚未完成的 Gravatar 结果", async () => {
  const pending = [];
  const cryptoApi = {
    subtle: {
      digest() {
        return new Promise(resolve => pending.push(resolve));
      }
    }
  };
  const target = widget("artalk", true, "/fallback.png");
  const mounted = api({ ArtalkUser: JSON.stringify({ name: "Old", email: "old@example.com" }) }, {}, false, [target], cryptoApi);
  assert.equal(pending.length, 1);

  mounted.localStorage.values.ArtalkUser = JSON.stringify({ name: "New", email: "new@example.com" });
  mounted.listeners.get("stellar:profile-change")();
  assert.equal(pending.length, 2);

  pending[1](new Uint8Array(32).fill(2).buffer);
  await flushPromises();
  const currentUrl = target.nodes.avatar.children[0].src;
  assert.match(currentUrl, /avatar\/(02){32}\?s=64&r=g&d=404$/);

  pending[0](new Uint8Array(32).fill(1).buffer);
  await flushPromises();
  assert.equal(target.nodes.avatar.children[0].src, currentUrl);
});
