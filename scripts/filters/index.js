'use strict';


hexo.extend.filter.register('after_post_render', require('./lib/lazyload').processPost);
hexo.extend.filter.register('after_render:html',  require('./lib/lazyload').processSite);
