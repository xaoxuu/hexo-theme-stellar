'use strict';

hexo.extend.filter.register('after_post_render', require('./lib/page-view-model').attachPageViewModel, 1);
hexo.extend.filter.register('after_render:html', require('./lib/img_lazyload').processSite);
hexo.extend.filter.register('after_render:html', require('./lib/img_onerror').processSite);
hexo.extend.filter.register('after_post_render', require('./lib/md_table').processPost, 0);
