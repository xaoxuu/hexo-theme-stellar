/* global hexo */

'use strict';

hexo.on('generateBefore', () => {
  // Merge config.
  require('./lib/config')(hexo);
  require('./lib/doc_tree')(hexo);
  require('./lib/utils')(hexo);
});

hexo.on('ready', () => {
  const { version } = require('../../package.json');
  hexo.log.info(`
=======================================================
  Stellar ${version}
  Docs: https://xaoxuu.com/wiki/stellar/
  Repo: https://github.com/xaoxuu/hexo-theme-stellar/
=======================================================`);
});
