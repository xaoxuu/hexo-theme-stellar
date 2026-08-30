"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { registerConfigHotReload } = require("../scripts/events/lib/config-hot-reload");

function waitForReload() {
  return new Promise(resolve => setTimeout(resolve, 10));
}

function fixture(options = {}) {
  const handlers = {};
  const runtimeHandlers = {};
  const warnings = [];
  let watchListener;
  let watchedFile;
  let unwatched = false;
  let generated = 0;
  const hexo = {
    base_dir: "/tmp/stellar-config-watch/",
    config: { theme_config: { brand: { name: "Before" } } },
    env: { cmd: "server" },
    log: {
      info() {},
      warn(message) { warnings.push(message); }
    },
    on(event, callback) { handlers[event] = callback; },
    render: {
      async render() {
        if (options.invalid) return { regions: { topbar: 42 } };
        if (options.emptyRegion) return { regions: { topbar: null } };
        return { regions: { topbar: ["site_brand", "menu"] } };
      }
    },
    _watchBox() { generated += 1; }
  };
  registerConfigHotReload(hexo, {
    debounceMs: 0,
    existsSync: () => true,
    watchFile(file, _options, listener) {
      watchedFile = file;
      watchListener = listener;
    },
    unwatchFile(_file, listener) { unwatched = listener === watchListener; },
    runtime: { once(event, callback) { runtimeHandlers[event] = callback; } }
  });
  handlers.server();
  return {
    hexo,
    warnings,
    trigger() { watchListener(); },
    exit() { runtimeHandlers.exit(); },
    generated: () => generated,
    watchedFile: () => watchedFile,
    unwatched: () => unwatched
  };
}

test("Hexo server 保存 _config.stellar.yml 后重读并触发生成", async () => {
  const current = fixture();
  current.trigger("_config.stellar.yml");
  await waitForReload();
  assert.deepEqual(current.hexo.config.theme_config.regions.topbar, ["site_brand", "menu"]);
  assert.equal(current.generated(), 1);
  assert.equal(current.warnings.length, 0);
});

test("配置热重载只监听站点配置并在退出时解除轮询", async () => {
  const current = fixture();
  assert.equal(current.watchedFile(), "/tmp/stellar-config-watch/_config.stellar.yml");
  current.exit();
  assert.equal(current.unwatched(), true);
});

test("Region 空键按默认值热重载而不保留旧配置", async () => {
  const current = fixture({ emptyRegion: true });
  current.trigger("_config.stellar.yml");
  await waitForReload();
  assert.equal(current.hexo.config.theme_config.regions.topbar, null);
  assert.equal(current.generated(), 1);
  assert.equal(current.warnings.length, 0);
});

test("非法热更新保留上一次可用配置且不触发生成", async () => {
  const current = fixture({ invalid: true });
  const previous = current.hexo.config.theme_config;
  current.trigger("_config.stellar.yml");
  await waitForReload();
  assert.equal(current.hexo.config.theme_config, previous);
  assert.equal(current.generated(), 0);
  assert.equal(current.warnings.length, 1);
});
