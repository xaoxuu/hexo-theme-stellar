'use strict';

const { stripHTML } = require('hexo-util');

// 文章一行小字取值（hero 卡片与置顶轮播共用，未来可复用于其它场景）：
// subtitle > description > excerpt/content 前 length 字（去 HTML、压缩空白、截断；省略号由 CSS 单行处理），空则返回空串。
function subtitle(post, length = 50) {
  if (post == null) {
    return '';
  }
  if (post.subtitle != null && String(post.subtitle).length > 0) {
    return post.subtitle;
  }
  if (post.description != null && String(post.description).length > 0) {
    return post.description;
  }
  const text = stripHTML(post.excerpt || post.content || '').replace(/\s+/g, ' ').trim();
  if (text.length === 0) {
    return '';
  }
  return text.length > length ? text.slice(0, length) : text;
}

module.exports = { subtitle };
