'use strict';

const { normalize_path } = require('../lib/path_utils');

hexo.extend.helper.register('normalize_path', function (path = '') {
  return normalize_path(path);
});

hexo.extend.helper.register('pretty_url', function (path = '') {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  let url = this.url_for(path);

  url = normalize_path(url);

  // 添加尾 /（根路径 / 除外）
  if (url !== '/') {
    url += '/';
  }

  // 去除多余斜杠（避免 // 出现，但保留://协议部分）
  url = url.replace(/([^:]\/)\/+/g, '$1');

  return url;
});
