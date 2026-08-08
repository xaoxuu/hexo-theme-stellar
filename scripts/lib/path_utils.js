'use strict';

/**
 * 统一路径规范化：去除 .html 后缀，输出无尾斜杠的干净路径（path_key 格式）
 * 用于路径比较和匹配
 */
function normalize_path(path = '') {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // /index.html → /
  path = path.replace(/\/index\.html$/, '/');
  // 目录首页（无 .html 后缀形式，如 wiki/stellar/index）→ /
  path = path.replace(/\/index$/, '/');
  // /xxx.html → /xxx
  path = path.replace(/\.html$/, '');
  // 去除尾 /
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

module.exports = { normalize_path };
