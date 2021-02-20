'use strict';

var util = require('hexo-util');

hexo.extend.helper.register('stellar_meta', function(args, page){
  if (['robots', 'description'].includes(args) == false) {
    return '';
  }
  function meta(str) {
    if (str && str.length > 0) {
      return str;
    } else {
      return '';
    }
  }
  if (args == 'robots') {
    if (page.__index == true) {
      return '';
    }
    if (page.robots) {
      meta(page.robots);
    } else {
      // default rule
      if (['post', 'wiki', 'index'].includes(page.layout) == false) {
        meta('noindex,nofollow');
      }
    }
  } else if (args == 'description') {
    if (page.__index == true) {
      meta(hexo.config.description);
    } else if (page.description) {
      meta(util.stripHTML(page.description));
    } else if (['post', 'wiki'].includes(page.layout)) {
      var description = '';
      if (page.excerpt && page.excerpt.length > 0) {
        description = util.stripHTML(page.excerpt);
      } else if (page.content && page.content.length > 0) {
        description = util.truncate(util.stripHTML(page.content), {length: 160});
      }
      meta(description);
    }
  }
  return '';
});
