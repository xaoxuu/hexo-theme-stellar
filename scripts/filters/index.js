'use strict';

hexo.extend.filter.register('after_render:html', require('./lib/img_lazyload').processSite);
hexo.extend.filter.register('after_render:html', require('./lib/img_onerror').processSite);

function change_image(data) {
    if (this.theme.config.tag_plugins.image.parse_markdown) {
      // data.content = data.content.replace(
      //     /!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/g,
      //     '{% image $2 $3 %}'
      // );
      let splited_content = data.content.split(/(```[\s\S]*?```|{%\s*gallery\s*%}[\s\S]*?{%\s*endgallery\s*%})/g);
      splited_content = splited_content.map((s) => {
        let matches_no = s.match(/(```[\s\S]*?```|{%\s*gallery\s*%}[\s\S]*?{%\s*endgallery\s*%})/i);
        let matches_img = s.match(/!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/i);
        if (!matches_no && matches_img) {
          s = s.replace(
            /!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/g,
            `{% image $2 $3 %}`
          );
        }
        return s;
      });
      data.content = splited_content.join('');
    }
    return data;
}

hexo.extend.filter.register('before_post_render', change_image, 9);

