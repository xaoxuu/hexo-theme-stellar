'use strict';

hexo.extend.filter.register('after_render:html', require('./lib/img_lazyload').processSite);
hexo.extend.filter.register('after_render:html', require('./lib/img_onerror').processSite);

function change_image(data){
    const cfg = this.theme.config.tag_plugins.image.replace_original;

    if (cfg.enable){
         data.content = data.content.replace(/!\[([^\]]*)]\(([^(]+)\)/g, '{% image $2 $1 %}');
    }

    return data;
}


hexo.extend.filter.register('before_post_render', change_image, 9);
