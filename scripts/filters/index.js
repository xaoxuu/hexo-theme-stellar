'use strict';

hexo.extend.filter.register('after_post_render', require('./lib/page-view-model').attachPageViewModel, 1000);
hexo.extend.filter.register('after_render:html', require('./lib/img').processSite);
hexo.extend.filter.register('after_post_render', require('./lib/md_table').processPost, 0);

// Hexo copies content into template locals; restore the build-owned projection.
hexo.extend.filter.register('template_locals', function(locals) {
  const registry = require('../lib/page-view-model-registry').pageViewModelsFor(hexo);
  const model = registry.getPageViewModel(locals.page);
  if (model) registry.setPageViewModel(locals.page, model);
  return locals;
});
