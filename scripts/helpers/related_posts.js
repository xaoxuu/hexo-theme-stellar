/**
 * https://github.com/tea3/hexo-related-popular-posts/wiki/More-Settings#customize-html
 */

'use strict';

var util = require('hexo-util');

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
      <div class='title cap theme'>${title}</div>
    </section>
    <section class='body'>
    `;

  const posts = this.site.posts;
  const root = this.config.root;
  function generateHTML(list){

    var el = '';
    el += '<a class="item" href="' + list.path + '" title="' + list.title + '">';
    var p = posts.filter(function(p) {
      return root + p.path == list.path;
    });
    if (p && p.length > 0) {
      p = p.data[0];
    }
    if (p) {
      if (p.cover) {
        if (p.cover.includes('/')) {
          list.img = p.cover;
        } else {
          list.img = 'https://source.unsplash.com/1280x640/?' + p.cover;
        }
      } else if (cfg.auto_cover && p.tags && p.tags.length > 0) {
        var params = '';
        p.tags.reverse().forEach((tag, i) => {
          if (i > 0) {
            params += ',';
          }
          params += tag.name;
        });
        list.img = 'https://source.unsplash.com/1280x640/?' + params;
      }
    }
    if (hexo.theme.config.default.cover) {
      el += '<div class="img">'
      if (list.img && list.img != "") {
        el += '<img src="' + list.img + '" />';
      } else {
        el += '<img src="' + hexo.theme.config.default.cover + '" />';
      }
      el += '</div>';
    }

    el += '<span class="title">' + list.title + '</span>';

    if (list.excerpt && list.excerpt.length > 0) {
      el += '<span class="excerpt">' + util.truncate(util.stripHTML(list.excerpt), {length: 120}) + '</span>';
    }

    el +=  '</a>';
    return el;
  }

  for(var i = 0; i < json.length; i++) {
    returnHTML += generateHTML(json[i]);
  }

  if (returnHTML != "") returnHTML = "<div class=\"" + cls + "\">" + returnHTML + "</div>";
  div += returnHTML;
  div += '</section>';
  return div;
});
