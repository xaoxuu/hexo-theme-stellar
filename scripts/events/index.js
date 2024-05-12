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
  const { version, homepage, repository } = require('../../package.json');
  hexo.log.info(`Welcome to Stellar ${version}
DOCS  ${homepage}
REPO  ${repository.url}
  `);
});
