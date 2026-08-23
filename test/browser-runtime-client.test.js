"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function moduleUrl(relative) {
  return pathToFileURL(path.join(__dirname, "..", relative)).href;
}

function root(selectors = []) {
  return {
    querySelector(selector) { return selectors.includes(selector) ? {} : null; }
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values
  };
}

test("ExtensionRegistry 按需 import、挂载、逆序卸载并复用 module Promise", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.mjs"));
  const calls = [];
  let imports = 0;
  const registry = createExtensionRegistry({
    importer: async specifier => {
      imports++;
      return {
        mount(_root, context) {
          calls.push(`mount:${context.extension.id}:${specifier}`);
          return () => calls.push(`cleanup:${context.extension.id}`);
        }
      };
    }
  });
  registry.register({ id: "one", module: "/one.mjs", when: { selector: ".one" }, config: {} });
  registry.register({ id: "two", module: "/one.mjs", when: { always: true }, config: {} });
  registry.register({ id: "skip", module: "/skip.mjs", when: { selector: ".skip" }, config: {} });

  const mounted = await registry.mount(root([".one"]), {});
  assert.deepEqual(mounted.map(item => item.status), ["mounted", "mounted", "skipped"]);
  assert.equal(imports, 1);
  const target = root([".one"]);
  await registry.mount(target, {});
  await registry.mount(target, {});
  assert.equal(calls.includes("cleanup:two"), true);
  await registry.unmount(target);
  assert.deepEqual(calls.slice(-2), ["cleanup:two", "cleanup:one"]);
});

test("ExtensionRegistry 隔离 import、mount 与 unmount 失败", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.mjs"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}`),
    importer: async specifier => {
      if (specifier === "/import.mjs") throw new Error("import");
      if (specifier === "/mount.mjs") return { mount() { throw new Error("mount"); } };
      return { mount() { return () => { throw new Error("cleanup"); }; } };
    }
  });
  registry.register({ id: "bad-import", module: "/import.mjs", when: { always: true }, config: {} });
  registry.register({ id: "bad-mount", module: "/mount.mjs", when: { always: true }, config: {} });
  registry.register({ id: "bad-cleanup", module: "/cleanup.mjs", when: { always: true }, config: {} });
  const result = await registry.mount(root(), {});
  assert.deepEqual(result.map(item => item.status), ["failed", "failed", "mounted"]);
  await registry.unmount(root());
  const target = root();
  await registry.mount(target, {});
  await registry.unmount(target);
  assert.deepEqual(errors, ["bad-import:import", "bad-mount:mount", "bad-import:import", "bad-mount:mount", "bad-cleanup:unmount"]);
});

test("ExtensionRegistry 隔离非法 selector，不阻断后续 Extension", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.mjs"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}`),
    importer: async () => ({ mount() {} })
  });
  registry.register({ id: "invalid", module: "/invalid.mjs", when: { selector: "[" }, config: {} });
  registry.register({ id: "valid", module: "/valid.mjs", when: { always: true }, config: {} });
  const target = {
    querySelector(selector) {
      if (selector === "[") throw new DOMException("invalid selector", "SyntaxError");
      return null;
    }
  };
  const result = await registry.mount(target, {});
  assert.deepEqual(result.map(item => item.status), ["failed", "mounted"]);
  assert.deepEqual(errors, ["invalid:mount"]);
});

test("ExtensionRegistry register 拒绝未知字段和非法 when/config", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.mjs"));
  const registry = createExtensionRegistry();
  assert.throws(() => registry.register({ id: "unknown", module: "/x.mjs", when: { always: true }, config: {}, extra: true }), /unknown field extra/);
  assert.throws(() => registry.register({ id: "condition", module: "/x.mjs", when: { always: true, selector: ".x" }, config: {} }), /exactly one/);
  assert.throws(() => registry.register({ id: "config", module: "/x.mjs", when: { always: true }, config: [] }), /config is invalid/);
});

test("ExtensionRegistry 允许延迟任务通过 extension context 上报隔离错误", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.mjs"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}:${detail.error.message}`),
    importer: async () => ({ mount(_root, context) { context.reportError(new Error("delayed")); } })
  });
  registry.register({ id: "delayed", module: "/delayed.mjs", when: { always: true }, config: {} });
  assert.deepEqual((await registry.mount(root(), {})).map(item => item.status), ["mounted"]);
  assert.deepEqual(errors, ["delayed:mount:delayed"]);
});

test("Lazy Extension 资源失败时撤销已安装的全局与 observer", async () => {
  const feature = await import(moduleUrl("source/js/runtime/extensions/feature.mjs"));
  const previousWindow = globalThis.window;
  const previousObserver = globalThis.MutationObserver;
  const calls = [];
  class Observer {
    observe() { calls.push("observe"); }
    disconnect() { calls.push("disconnect"); }
  }
  globalThis.window = {
    addEventListener() { calls.push("listen"); },
    removeEventListener() { calls.push("unlisten"); }
  };
  globalThis.MutationObserver = Observer;
  const target = {
    nodeType: 9,
    documentElement: {},
    ownerDocument: { createElement() { return {}; } },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  try {
    await assert.rejects(() => feature.mount(target, {
      extension: { config: { feature: "lazy-loading", asset: "/bad.js" } },
      assets: { script: async () => { throw new Error("asset"); } }
    }), /asset/);
    assert.deepEqual(calls, ["listen", "observe", "disconnect", "unlisten"]);
    assert.equal(globalThis.window.wrapLazyloadImages, undefined);
    assert.equal(globalThis.window.lazyLoadOptions, undefined);
  } finally {
    globalThis.window = previousWindow;
    globalThis.MutationObserver = previousObserver;
  }
});

test("Fancybox Extension 对 element root 使用容器级 bind/unbind", async () => {
  const feature = await import(moduleUrl("source/js/runtime/extensions/feature.mjs"));
  const previousWindow = globalThis.window;
  const calls = [];
  const target = { nodeType: 1 };
  globalThis.window = {
    Fancybox: {
      bind(...args) { calls.push(["bind", ...args]); },
      unbind(...args) { calls.push(["unbind", ...args]); }
    }
  };
  try {
    const cleanup = await feature.mount(target, {
      extension: { config: { feature: "lightbox", mode: "auto", assets: { css: "/f.css", js: "/f.js" } } },
      assets: { style: async () => {}, script: async () => {} }
    });
    cleanup();
    assert.equal(calls[0][0], "bind");
    assert.equal(calls[0][1], target);
    assert.equal(calls[1][0], "unbind");
    assert.equal(calls[1][1], target);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("request/cache 对 GET 去重、写入 TTL 并在 fresh 命中时不联网", async () => {
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  const storage = memoryStorage();
  const events = [];
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const client = createRequestClient({
    storage,
    cache: { enabled: true, defaultTtl: 60, ttl: {}, maxEntries: 10 },
    scheduler: fn => fn(),
    dispatch: name => events.push(name),
    fetch: async () => {
      calls++;
      await gate;
      return new Response('{"ok":true}', { status: 200, headers: { "Content-Type": "application/json" } });
    }
  });
  const first = client.request("https://example.com/data", { service: "demo" });
  const second = client.request("https://example.com/data", { service: "demo" });
  release();
  assert.equal(await (await first).text(), '{"ok":true}');
  assert.equal(await (await second).text(), '{"ok":true}');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(await (await client.request("https://example.com/data", { service: "demo" })).text(), '{"ok":true}');
  assert.equal(calls, 1);
  assert.deepEqual(events, ["stellar:request-start", "stellar:request-end"]);
});

test("request/cache 最终失败回退 stale，且非 GET 不缓存", async () => {
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  const storage = memoryStorage();
  storage.setItem(REQUEST_CACHE_PREFIX + "https://example.com/stale", JSON.stringify({
    text: "stale", contentType: "text/plain", ts: 0, ttl: 1
  }));
  let calls = 0;
  const client = createRequestClient({
    storage,
    clock: () => 5000,
    cache: { enabled: true, defaultTtl: 1, ttl: {}, maxEntries: 10 },
    fetch: async () => { calls++; throw new Error("offline"); }
  });
  assert.equal(await (await client.request("https://example.com/stale", { retries: 1 })).text(), "stale");
  assert.equal(calls, 2);
  await assert.rejects(() => client.request("https://example.com/post", { method: "POST", retries: 0 }), /offline/);
  assert.equal(storage.getItem(REQUEST_CACHE_PREFIX + "https://example.com/post"), null);
});

test("request/cache 在调用方已有 signal 时仍执行超时与有限重试", async () => {
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  const caller = new AbortController();
  let attempts = 0;
  const client = createRequestClient({
    cache: { enabled: false },
    fetch: async (_url, options) => new Promise((_resolve, reject) => {
      attempts++;
      options.signal.addEventListener("abort", () => reject(new Error("timed out")), { once: true });
    })
  });
  await assert.rejects(() => client.request("/slow", {
    signal: caller.signal,
    timeout: 1,
    retries: 1
  }), /timed out/);
  assert.equal(attempts, 2);
  assert.equal(caller.signal.aborted, false);
});

test("request/cache 的 cache=false 只禁用 Stellar 缓存，不透传非法 RequestInit", async () => {
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  let received;
  const client = createRequestClient({
    cache: { enabled: true, defaultTtl: 60, ttl: {}, maxEntries: 10 },
    fetch: async (_url, options) => {
      received = options;
      return new Response("ok", { status: 200 });
    }
  });
  assert.equal(await (await client.request("https://example.com/no-cache", { cache: false })).text(), "ok");
  assert.equal("cache" in received, false);
});

test("request/cache 按 maxEntries 淘汰最旧条目，并以 UTF-8 字节限制单条缓存", async () => {
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  const storage = memoryStorage();
  let clock = 0;
  const bodies = new Map([
    ["https://example.com/one", "one"],
    ["https://example.com/two", "two"],
    ["https://example.com/large", "中".repeat(70 * 1024)]
  ]);
  const client = createRequestClient({
    storage,
    clock: () => ++clock,
    scheduler: fn => fn(),
    cache: { enabled: true, defaultTtl: 60, ttl: {}, maxEntries: 1 },
    fetch: async url => new Response(bodies.get(url), { status: 200 })
  });
  await client.request("https://example.com/one");
  await client.request("https://example.com/two");
  await client.request("https://example.com/large");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(storage.getItem(REQUEST_CACHE_PREFIX + "https://example.com/one"), null);
  assert.notEqual(storage.getItem(REQUEST_CACHE_PREFIX + "https://example.com/two"), null);
  assert.equal(storage.getItem(REQUEST_CACHE_PREFIX + "https://example.com/large"), null);
});

test("旧 request adapter 从 ds-* 推导 service，fresh 命中不显示 loading", async () => {
  const { installLegacyRequestAdapter } = await import(moduleUrl("source/js/runtime/legacy-request-adapter.mjs"));
  const calls = [];
  const utils = {
    onLoading: () => calls.push("loading"),
    onLoadSuccess: () => calls.push("success")
  };
  const client = {
    request: async (_url, options) => {
      calls.push(`service:${options.service}`);
      return new Response("fresh", { status: 200 });
    }
  };
  installLegacyRequestAdapter(utils, client);
  await utils.request({ className: "data-service ds-memos" }, "/memos", async response => {
    calls.push(await response.text());
  });
  assert.deepEqual(calls, ["service:memos", "success", "fresh"]);
});

test("旧 request bridge 将 runtime 启动前的调用排队到真实 adapter", async () => {
  const { installLegacyRequestAdapter } = await import(moduleUrl("source/js/runtime/legacy-request-adapter.mjs"));
  let resolveAdapter;
  const ready = new Promise(resolve => { resolveAdapter = resolve; });
  globalThis.__stellarRequestBridge = { resolve: resolveAdapter };
  const calls = [];
  const pending = ready.then(adapter => adapter.requestWithoutLoading("/queued")).then(response => response.text());
  const utils = {};
  installLegacyRequestAdapter(utils, {
    request: async url => {
      calls.push(url);
      return new Response("drained", { status: 200 });
    }
  });
  assert.equal(await pending, "drained");
  assert.deepEqual(calls, ["/queued"]);
  assert.equal(globalThis.__stellarRequestBridge.resolve, undefined);
  delete globalThis.__stellarRequestBridge;
});

test("嵌入式评论脚本加载失败通过 context 上报", async () => {
  const comments = await import(moduleUrl("source/js/runtime/extensions/comments.mjs"));
  const previousWindow = globalThis.window;
  let embeddedScript;
  const errors = [];
  const element = {
    attributes: [],
    ownerDocument: {
      createElement() {
        const script = new EventTarget();
        script.setAttribute = () => {};
        script.remove = () => {};
        return script;
      }
    },
    replaceChildren() {},
    appendChild(script) { embeddedScript = script; }
  };
  globalThis.window = {};
  try {
    const cleanup = await comments.mount({ querySelector: () => element }, {
      extension: { config: { provider: "giscus", assets: { js: "/giscus.js" } } },
      reportError: error => errors.push(error.message)
    });
    embeddedScript.dispatchEvent(new Event("error"));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(errors, ["giscus comment embed failed to load"]);
    cleanup();
  } finally {
    globalThis.window = previousWindow;
  }
});

test("request client 仅在真正联网时调用 onNetworkStart", async () => {
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.mjs"));
  const storage = memoryStorage();
  storage.setItem(REQUEST_CACHE_PREFIX + "/fresh", JSON.stringify({ text: "fresh", contentType: "text/plain", ts: 10, ttl: 60 }));
  const starts = [];
  const client = createRequestClient({
    storage,
    clock: () => 20,
    cache: { enabled: true, defaultTtl: 60, ttl: {}, maxEntries: 10 },
    fetch: async () => new Response("network", { status: 200 })
  });
  await client.request("/fresh", { onNetworkStart: () => starts.push("fresh") });
  await client.request("/network", { onNetworkStart: () => starts.push("network") });
  assert.deepEqual(starts, ["network"]);
});
