/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { parseStellarConfig } = require("../../lib/config-schema");

const CONFIG_FILENAME = "_config.stellar.yml";

function registerConfigHotReload(ctx, options = {}) {
  const watchFile = options.watchFile || fs.watchFile;
  const unwatchFile = options.unwatchFile || fs.unwatchFile;
  const existsSync = options.existsSync || fs.existsSync;
  const runtime = options.runtime || process;
  const debounceMs = Number.isInteger(options.debounceMs) ? options.debounceMs : 100;
  const interval = Number.isInteger(options.interval) ? options.interval : 250;
  const configPath = path.join(ctx.base_dir, CONFIG_FILENAME);
  let watching = false;
  let timer;
  let revision = 0;

  async function reload(expectedRevision) {
    try {
      const themeConfig = existsSync(configPath)
        ? await ctx.render.render({ path: configPath }) || {}
        : {};
      parseStellarConfig({ source: CONFIG_FILENAME, themeConfig, mode: "recover" });
      if (expectedRevision !== revision) return;
      ctx.config.theme_config = themeConfig;
      if (typeof ctx._watchBox !== "function") {
        throw new TypeError("Hexo watcher 尚未初始化");
      }
      ctx.log.info(`Stellar: ${CONFIG_FILENAME} 已重载，正在重新生成。`);
      ctx._watchBox();
    } catch (error) {
      if (expectedRevision !== revision) return;
      ctx.log.warn(`Stellar: ${CONFIG_FILENAME} 重载失败，继续使用上一次有效配置。\n${error.message}`);
    }
  }

  function schedule() {
    revision += 1;
    const expectedRevision = revision;
    clearTimeout(timer);
    timer = setTimeout(() => reload(expectedRevision), debounceMs);
  }

  ctx.on("server", () => {
    if (watching) return;
    watching = true;
    watchFile(configPath, { interval, persistent: false }, schedule);
  });

  runtime.once("exit", () => {
    clearTimeout(timer);
    if (watching) unwatchFile(configPath, schedule);
    watching = false;
  });
}

module.exports = {
  CONFIG_FILENAME,
  registerConfigHotReload
};
