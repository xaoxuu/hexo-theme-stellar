"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const INTERNAL_CONSTANTS = require("../scripts/lib/internal-constants");

const REQUEST_POLICY = INTERNAL_CONSTANTS.runtime.request;

function cachePolicy(overrides = {}) {
  return Object.assign({}, INTERNAL_CONSTANTS.runtime.cache, overrides, {
    ttl: Object.assign({}, INTERNAL_CONSTANTS.runtime.cache.ttl, overrides.ttl || {})
  });
}

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

test("RequestClient 只清除 Stellar 数据缓存", async () => {
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const storage = memoryStorage();
  storage.setItem(REQUEST_CACHE_PREFIX + "one", "{}");
  storage.setItem(REQUEST_CACHE_PREFIX + "two", "{}");
  storage.setItem("search_cache_v4", "keep");
  storage.setItem("ArtalkUser", "keep");
  const client = createRequestClient({
    cache: cachePolicy(),
    policy: REQUEST_POLICY,
    storage,
    fetch: async () => new Response("ok")
  });
  assert.deepEqual(client.clearCache(), { ok: true, partial: false, removed: 2, failed: 0 });
  assert.equal(storage.getItem(REQUEST_CACHE_PREFIX + "one"), null);
  assert.equal(storage.getItem("search_cache_v4"), "keep");
  assert.equal(storage.getItem("ArtalkUser"), "keep");
});

test("ExtensionRegistry 按需 import、挂载、逆序卸载并复用 module Promise", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
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
  registry.register({ id: "one", module: "/one.js", when: { selector: ".one" }, config: {} });
  registry.register({ id: "two", module: "/one.js", when: { always: true }, config: {} });
  registry.register({ id: "skip", module: "/skip.js", when: { selector: ".skip" }, config: {} });

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
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}`),
    importer: async specifier => {
      if (specifier === "/import.js") throw new Error("import");
      if (specifier === "/mount.js") return { mount() { throw new Error("mount"); } };
      return { mount() { return () => { throw new Error("cleanup"); }; } };
    }
  });
  registry.register({ id: "bad-import", module: "/import.js", when: { always: true }, config: {} });
  registry.register({ id: "bad-mount", module: "/mount.js", when: { always: true }, config: {} });
  registry.register({ id: "bad-cleanup", module: "/cleanup.js", when: { always: true }, config: {} });
  const result = await registry.mount(root(), {});
  assert.deepEqual(result.map(item => item.status), ["failed", "failed", "mounted"]);
  await registry.unmount(root());
  const target = root();
  await registry.mount(target, {});
  await registry.unmount(target);
  assert.deepEqual(errors.slice().sort(), ["bad-import:import", "bad-mount:mount", "bad-import:import", "bad-mount:mount", "bad-cleanup:unmount"].sort());
});

test("ExtensionRegistry 隔离非法 selector，不阻断后续 Extension", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}`),
    importer: async () => ({ mount() {} })
  });
  registry.register({ id: "invalid", module: "/invalid.js", when: { selector: "[" }, config: {} });
  registry.register({ id: "valid", module: "/valid.js", when: { always: true }, config: {} });
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
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
  const registry = createExtensionRegistry();
  assert.throws(() => registry.register({ id: "unknown", module: "/x.js", when: { always: true }, config: {}, extra: true }), /unknown field extra/);
  assert.throws(() => registry.register({ id: "condition", module: "/x.js", when: { always: true, selector: ".x" }, config: {} }), /exactly one/);
  assert.throws(() => registry.register({ id: "config", module: "/x.js", when: { always: true }, config: [] }), /config is invalid/);
});

test("ExtensionRegistry 允许延迟任务通过 extension context 上报隔离错误", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
  const errors = [];
  const registry = createExtensionRegistry({
    onError: detail => errors.push(`${detail.id}:${detail.phase}:${detail.error.message}`),
    importer: async () => ({ mount(_root, context) { context.reportError(new Error("delayed")); } })
  });
  registry.register({ id: "delayed", module: "/delayed.js", when: { always: true }, config: {} });
  assert.deepEqual((await registry.mount(root(), {})).map(item => item.status), ["mounted"]);
  assert.deepEqual(errors, ["delayed:mount:delayed"]);
});

test("request/cache 对 GET 去重、写入 TTL 并在 fresh 命中时不联网", async () => {
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const storage = memoryStorage();
  const events = [];
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const client = createRequestClient({
    policy: REQUEST_POLICY,
    storage,
    cache: cachePolicy({ defaultTtl: 60, ttl: {}, maxEntries: 10 }),
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
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const storage = memoryStorage();
  storage.setItem(REQUEST_CACHE_PREFIX + "https://example.com/stale", JSON.stringify({
    text: "stale", contentType: "text/plain", ts: 0, ttl: 1
  }));
  let calls = 0;
  const client = createRequestClient({
    policy: REQUEST_POLICY,
    storage,
    clock: () => 5000,
    cache: cachePolicy({ defaultTtl: 1, ttl: {}, maxEntries: 10 }),
    fetch: async () => { calls++; throw new Error("offline"); }
  });
  assert.equal(await (await client.request("https://example.com/stale", { retries: 1 })).text(), "stale");
  assert.equal(calls, 2);
  await assert.rejects(() => client.request("https://example.com/post", { method: "POST", retries: 0 }), /offline/);
  assert.equal(storage.getItem(REQUEST_CACHE_PREFIX + "https://example.com/post"), null);
});

test("request/cache 在调用方已有 signal 时仍执行超时与有限重试", async () => {
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const caller = new AbortController();
  let attempts = 0;
  const client = createRequestClient({
    policy: REQUEST_POLICY,
    cache: cachePolicy({ enabled: false }),
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
  const { createRequestClient } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  let received;
  const client = createRequestClient({
    policy: REQUEST_POLICY,
    cache: cachePolicy({ defaultTtl: 60, ttl: {}, maxEntries: 10 }),
    fetch: async (_url, options) => {
      received = options;
      return new Response("ok", { status: 200 });
    }
  });
  assert.equal(await (await client.request("https://example.com/no-cache", { cache: false })).text(), "ok");
  assert.equal("cache" in received, false);
});

test("request/cache 按 maxEntries 淘汰最旧条目，并以 UTF-8 字节限制单条缓存", async () => {
  const { createRequestClient, REQUEST_CACHE_PREFIX } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const storage = memoryStorage();
  let clock = 0;
  const bodies = new Map([
    ["https://example.com/one", "one"],
    ["https://example.com/two", "two"],
    ["https://example.com/large", "中".repeat(70 * 1024)]
  ]);
  const client = createRequestClient({
    policy: REQUEST_POLICY,
    storage,
    clock: () => ++clock,
    scheduler: fn => fn(),
    cache: cachePolicy({ defaultTtl: 60, ttl: {}, maxEntries: 1 }),
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
  const { installLegacyRequestAdapter } = await import(moduleUrl("source/js/runtime/legacy-request-adapter.js"));
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
  installLegacyRequestAdapter(utils, client, REQUEST_POLICY);
  await utils.request({ className: "data-service ds-memos" }, "/memos", async response => {
    calls.push(await response.text());
  });
  assert.deepEqual(calls, ["service:memos", "success", "fresh"]);
});

test("旧 request bridge 将 runtime 启动前的调用排队到真实 adapter", async () => {
  const { installLegacyRequestAdapter } = await import(moduleUrl("source/js/runtime/legacy-request-adapter.js"));
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
  }, REQUEST_POLICY);
  assert.equal(await pending, "drained");
  assert.deepEqual(calls, ["/queued"]);
  assert.equal(globalThis.__stellarRequestBridge.resolve, undefined);
  delete globalThis.__stellarRequestBridge;
});

test("ExtensionRegistry cancels pending mounts, cleans late results once and isolates independent loads", async () => {
  const { createExtensionRegistry } = await import(moduleUrl("source/js/runtime/extension-registry.js"));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let signal;
  let destroyed = 0;
  let fastMounted = false;
  let notifications = 0;
  const events = new EventTarget();
  const listener = () => { notifications++; };
  const cleanup = () => { destroyed++; events.removeEventListener('change', listener); };
  const registry = createExtensionRegistry({ importer: async id => ({
    async mount(_root, context) {
      if (id === '/slow.js') {
        signal = context.signal;
        events.addEventListener('change', listener);
        context.onCleanup(cleanup);
        await pending;
        return cleanup;
      }
      fastMounted = true;
    }
  }) });
  registry.register({ id: 'slow', module: '/slow.js', when: { always: true }, config: {} });
  registry.register({ id: 'fast', module: '/fast.js', when: { always: true }, config: {} });
  const target = root();
  const mounted = registry.mount(target, {});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fastMounted, true);
  await registry.unmount(target);
  assert.equal(signal.aborted, true);
  assert.equal(destroyed, 1);
  release();
  await mounted;
  assert.equal(destroyed, 1);
  await registry.mount(target, {});
  await registry.unmount(target);
  assert.equal(destroyed, 2);
  events.dispatchEvent(new Event('change'));
  assert.equal(notifications, 0);
});

test("AssetLoader bounds failures, retries and cancels a consumer without cancelling shared resources", async () => {
  const { createAssetLoader } = await import(moduleUrl('source/js/runtime/asset-loader.js'));
  const nodes = [];
  const document = { createElement() { return Object.assign(new EventTarget(), { remove() { this.removed = true; } }); }, head: { appendChild(node) { nodes.push(node); } } };
  const assets = createAssetLoader({ document, timeoutMs: 10 });
  await assert.rejects(assets.script('/unavailable.js'), /timed out/);
  assert.equal(nodes[0].removed, true);
  const controller = new AbortController();
  const cancelled = assets.scoped(controller.signal).script('/unavailable.js');
  const shared = assets.script('/unavailable.js');
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  nodes[1].dispatchEvent(new Event('load'));
  await shared;
  assert.equal(nodes.length, 2);
});

test('An immediate remount waits for an externally started teardown', async () => {
  const { createExtensionRegistry } = await import(moduleUrl('source/js/runtime/extension-registry.js'));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const calls = [];
  const registry = createExtensionRegistry({ importer: async () => ({
    mount() { calls.push('mount'); return async () => { await pending; calls.push('cleanup'); }; }
  }) });
  registry.register({ id: 'lifecycle', module: '/lifecycle.js', when: { always: true }, config: {} });
  const target = root();
  await registry.mount(target);
  const leaving = registry.unmount(target);
  const returning = registry.mount(target);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['mount']);
  release();
  await Promise.all([leaving, returning]);
  assert.deepEqual(calls, ['mount', 'cleanup', 'mount']);
  await registry.unmount(target);
});

test("搜索缓存按索引 URL 隔离，识别与清理共用键所有者", async () => {
  const { searchCacheKey, isSearchCacheKey, clearSearchStorage } = await import(moduleUrl("source/js/runtime/request-cache.js"));
  const storage = memoryStorage();
  const first = searchCacheKey("search.json", "https://example.com/one/");
  const second = searchCacheKey("search.json", "https://example.com/two/");
  assert.notEqual(first, second);
  for (const key of [first, second]) {
    assert.equal(isSearchCacheKey(key), true);
    storage.setItem(key, "{}");
  }
  storage.setItem("unrelated", "keep");
  assert.deepEqual(clearSearchStorage(storage), { ok: true, partial: false, removed: 2, failed: 0 });
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(clearSearchStorage(null).ok, false);
});

test("regional request cancellation prevents stale callbacks and loading-state writes", async () => {
  const { installLegacyRequestAdapter } = await import(moduleUrl("source/js/runtime/legacy-request-adapter.js"));
  const calls = [];
  let resolveResponse;
  const client = { request: () => new Promise(resolve => { resolveResponse = resolve; }) };
  const utils = {
    onLoadSuccess: () => calls.push('success'),
    onLoadFailure: () => calls.push('failure')
  };
  installLegacyRequestAdapter(utils, client, REQUEST_POLICY);
  const controller = new AbortController();
  const pending = utils.request({}, '/data', () => calls.push('callback'), undefined, { signal: controller.signal });
  controller.abort();
  resolveResponse(new Response('ok'));
  await assert.rejects(pending, { name: 'AbortError' });
  assert.deepEqual(calls, []);
});
