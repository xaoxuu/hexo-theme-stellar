/* global hexo */

'use strict';

hexo.on('generateBefore', () => {
  // Merge config.
  require('./lib/config')(hexo);
  require('./lib/doc_tree')(hexo);
  require('./lib/utils')(hexo);
});

hexo.on('ready', () => {
  const { version, homepage, repository } = require('../../package.json');
  hexo.log.info(`Welcome to Stellar ${version}
DOCS  ${homepage}
REPO  ${repository.url}
  `);
});
