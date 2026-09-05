/* global hexo */

'use strict';

require('./lib/config-hot-reload').registerConfigHotReload(hexo);

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

// 防止重复注册
let hasRun = false;

hexo.extend.filter.register('before_generate', async () => {
  const isDev = ['s', 'server', 'serve'].some(arg => process.argv.includes(arg));
  if (!isDev) {
    return;
  }

  if (hasRun) return;
  hasRun = true;
  
  // 读取主题配置开关
  const enabled = hexo.stellar.config.features.lazyLoading.autoAspectRatio === true;

  const generateImageRatios = require('./lib/get_image_ratios');
  const fixMarkdownImages = require('./lib/fix_image_tags');

  if (enabled) {
    // 构建前：生成缓存 + 写回 Markdown
    await generateImageRatios(hexo);
    fixMarkdownImages(hexo); // 不用 await，因为是同步的
  }
});
