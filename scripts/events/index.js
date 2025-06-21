/* global hexo */

'use strict';

hexo.on('generateBefore', () => {
  // Merge config.
  require('./lib/config')(hexo);
  require('./lib/links')(hexo);
  require('./lib/authors')(hexo);
  require('./lib/doc_tree')(hexo);
  require('./lib/topic_tree')(hexo);
  require('./lib/utils')(hexo);
  require('./lib/notebooks')(hexo);
});

hexo.on('generateAfter', () => {
  require('./lib/merge_posts')(hexo);
});

hexo.on('ready', () => {
  if (process.env.HEXO_READY === '1') return;
  process.env.HEXO_READY = '1';
  const { version, homepage, repository } = require('../../package.json');
  hexo.log.info(`Welcome to \x1b[33mStellar ${version}\x1b[0m
\x1b[32mDOCS\x1b[0m  ${homepage}
\x1b[32mREPO\x1b[0m  ${repository.url}
  `);
  // version check
  const checkVersion = require('./lib/version-check');
  checkVersion(hexo, { useCache: true });
});
