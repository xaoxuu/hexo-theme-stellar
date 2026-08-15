/**
 * https://github.com/tea3/hexo-related-popular-posts/wiki/More-Settings#customize-html
 */

'use strict';

var util = require('hexo-util');

function esc(v) {
  return util.escapeHTML(v == null ? '' : String(v))
}

hexo.extend.helper.register('popular_posts_wrapper', function(args){
  const title = args.title;
  const json = args.json.json;
  const cls = args.json.class;
  if (json == undefined || json.length == 0) {
    return '';
  }
  const cfg = hexo.theme.config.article.related_posts;
  if (cfg.enable != true) return;
  var returnHTML = "";
  var div = `
    <section class='header'>
      <div class='title cap theme'>${esc(title)}</div>
    </section>
    <section class='body'>
    `;

  function listItem(obj){
    var el = '';
    el += '<a class="item" href="' + esc(obj.path) + '" title="' + esc(obj.title) + '">';
    el += '<span class="title">' + esc(obj.title) + '</span>';
    if (obj.excerpt && obj.excerpt.length > 0) {
      el += '<span class="excerpt">' + esc(util.truncate(util.stripHTML(obj.excerpt), {length: 120})) + '</span>';
    }
    el +=  '</a>';
    return el;
  }

  if (json.length > 0) {
      for(var i = 0; i < json.length; i++) {
        returnHTML += listItem(json[i]);
      }
  }
  
  if (returnHTML != "") returnHTML = "<div class=\"" + esc(cls) + "\">" + returnHTML + "</div>";
  div += returnHTML;
  div += '</section>';
  return div;
});
