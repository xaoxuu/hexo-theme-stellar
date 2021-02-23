/**
 * doc_tree(page, {toc: false})
 */

'use strict';

var util = require('hexo-util');

hexo.extend.helper.register('doc_tree', function(page, args){
  if (page.layout != 'wiki') {
    return '';
  }
  const pages = hexo.locals.get('pages').filter(function (p) {
    if (p.layout == 'wiki' && p.wiki && p.wiki == page.wiki && (p.title || p.seo_title)) {
      if (p.order == undefined) {
        p.order = 0;
      }
      return true;
    } else {
      return false;
    }
  }).sort('order');
  if (pages.length == 0) {
    return '';
  }
  var el = '';
  el += '<div class="doc-tree">';
  function doc_node(p) {
    if ((p.title || p.seo_title) && p.permalink) {
      var node = '<div class="doc-node">';
      node += '<a class="doc-tree-link';
      if (p.permalink == page.permalink) {
        node += ' active';
      }
      node += '" href="' + p.permalink + '">';
      node += '<span class="toc-text">';
      node += p.title || p.seo_title;
      node += '</span>';
      node += '</a>';
      node += '</div>';
      return node;
    } else {
      return '';
    }
  }
  pages.forEach((p, i) => {
    el += doc_node(p);
  });
  el += '</div>';
  return el;
});
