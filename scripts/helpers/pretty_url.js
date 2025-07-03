'use strict';

hexo.extend.helper.register('pretty_url', function (path = '') {
  let url = this.url_for(path);

  // 替换 /index.html → /
  url = url.replace(/\/index\.html$/, '/');

  // 替换 /about.html → /about/
  url = url.replace(/\.html$/, '/');

  // 如果没有扩展名，并且不以 / 结尾，补一个 /
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(url);
  if (!hasExtension && !url.endsWith('/')) {
    url += '/';
  }

  // 去除多余斜杠（避免 // 出现，但保留://协议部分）
  url = url.replace(/([^:]\/)\/+/g, '$1');

  return url;
});
