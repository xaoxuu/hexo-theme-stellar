'use strict';

hexo.extend.filter.register('after_post_render', require('./lib/page-view-model').attachPageViewModel, 1000);
hexo.extend.filter.register('after_render:html', require('./lib/img').processSite);
hexo.extend.filter.register('after_post_render', require('./lib/md_table').processPost, 0);
