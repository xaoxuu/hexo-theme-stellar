/* global hexo */

'use strict';

hexo.on('generateBefore', () => {
  // 页面路径归一化：xxx.html → xxx/，必须先于所有读取 page.path 的逻辑
  require('./lib/path_normalize')(hexo);
  // Merge config.
  require('./lib/config')(hexo);
  // 保留既有的早期严格校验与 collection 建模顺序。
  require('./lib/content-config')(hexo);
  require('./lib/links')(hexo);
  require('./lib/authors')(hexo);
  require('./lib/doc_tree')(hexo);
  require('./lib/topic_tree')(hexo);
  require('./lib/utils')(hexo);
  require('./lib/notebooks')(hexo);
});

// 冷构建时内容文件在 generateBefore 之后才全部进入 locals；生成器读取前用完整集合重建。
hexo.extend.filter.register('before_generate', () => {
  require('./lib/content-config')(hexo);
}, 1);

hexo.on('generateAfter', () => {
  require('./lib/merge_posts')(hexo);
});

hexo.on('ready', () => {
  if (process.env.HEXO_READY === '1') return;
  process.env.HEXO_READY = '1';
  const isClean = ['cl', 'clean'].some(arg => process.argv.includes(arg));
  if (isClean) {
    return;
  }
  const { version, homepage, repository } = require('../../package.json');
  console.log(``);

  const line = '------------------------------------------------';
  hexo.log.info(line);
  hexo.log.info(`Welcome to \x1b[33mStellar ${version}\x1b[0m
\x1b[32mDOCS\x1b[0m  ${homepage}
\x1b[32mREPO\x1b[0m  ${repository.url}`);
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
  const enabled = hexo.theme.config.dependencies.lazyload?.fix_ratio === true;

  const generateImageRatios = require('./lib/get_image_ratios');
  const fixMarkdownImages = require('./lib/fix_image_tags');

  if (enabled) {
    // 构建前：生成缓存 + 写回 Markdown
    await generateImageRatios(hexo);
    fixMarkdownImages(hexo); // 不用 await，因为是同步的
  }
});
