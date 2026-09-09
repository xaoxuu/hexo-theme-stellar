'use strict';

hexo.extend.filter.register('after_post_render', require('./lib/page-view-model').attachPageViewModel, 1000);
hexo.extend.filter.register('after_render:html', require('./lib/img').processSite);
hexo.extend.filter.register('after_post_render', require('./lib/md_table').processPost, 0);
hexo.extend.filter.register('after_post_render', require('./lib/md_link').processPost, 0);

// Hexo copies content into template locals; restore the build-owned projection.
hexo.extend.filter.register('template_locals', require('./lib/page-view-model').attachTemplateViewModel);

hexo.extend.filter.register('after_render:html', require('../lib/partial-navigation').processNavigation, 1000);
