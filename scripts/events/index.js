/* global hexo */

'use strict';

require('./lib/config-hot-reload').registerConfigHotReload(hexo);

hexo.on('ready', () => {
  require('../lib/image-metadata').excludeMetadataFromSource(hexo);
});

hexo.on('generateBefore', () => {
  // 页面路径归一化：xxx.html → xxx/，必须先于所有读取 page.path 的逻辑
  require('./lib/path_normalize')(hexo);
  // v2 声明式配置必须先于所有主题配置消费方完成解析。
  require('./lib/config-schema')(hexo);
  // Merge config.
  require('./lib/config')(hexo);
  require('./lib/links')(hexo);
  require('./lib/authors')(hexo);
  require('./lib/utils')(hexo);
});

hexo.extend.filter.register("before_generate", () => {
  // locals 已失效并从完整 source 库重建；单一 Pipeline 依次完成配置解析、
  // 内容发现、归属、Collection 状态、两阶段 ViewModel、聚合与路由投影。
  require("../lib/collection-pipeline").runCollectionPipeline(hexo);
}, 1);

hexo.on('ready', () => {
  if (process.env.HEXO_READY === '1') return;
  process.env.HEXO_READY = '1';
  // `hexo stellar doctor --format json --silent` 必须保持 stdout 为单一 JSON 文档；
  // init/doctor 不需要常规浏览/构建命令的欢迎信息和版本联网检查。
  if (hexo.env?.cmd === 'stellar') return;
  const isClean = ['cl', 'clean'].some(arg => process.argv.includes(arg));
  if (isClean) {
    return;
  }
  const { version, homepage, repository } = require("../lib/theme-metadata");
  console.log(``);

  const line = '------------------------------------------------';
  hexo.log.info(line);
  hexo.log.info(`Welcome to \x1b[33mStellar ${version}\x1b[0m
\x1b[32mDOCS\x1b[0m  ${homepage}
\x1b[32mREPO\x1b[0m  ${repository}`);
  hexo.log.info(line);
  console.log(``);
  // version check
  const checkVersion = require('./lib/version-check');
  checkVersion(hexo, { useCache: true });
});

// Complete missing metadata before generate writes routes or server exposes them.
// The explicit CLI owns its own preprocessing pass and must not recurse here.
hexo.extend.filter.register('after_generate', async () => {
  if (!['generate', 'g', 'server', 's', 'serve'].includes(hexo.env?.cmd)) return;
  if (hexo.stellar?.config?.features?.imageOptimization?.enabled !== true) return;
  await require('../lib/image-metadata').prepareBuildImages(hexo);
});
