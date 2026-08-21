'use strict';

const { stripHTML } = require('hexo-util');

// 卡片与置顶区的一行说明：显式 tagline > description > excerpt/content。
function caption(item, length = 50) {
  if (item == null) return '';
  const tagline = item.card?.tagline ?? item.banner?.tagline ?? item.tagline;
  if (tagline != null && String(tagline).length > 0) {
    const separator = String(tagline).indexOf(' | ');
    return separator > 0 ? String(tagline).slice(0, separator) : tagline;
  }
  if (item.description != null && String(item.description).length > 0) {
    return item.description;
  }
  const text = stripHTML(item.excerpt || item.content || '').replace(/\s+/g, ' ').trim();
  if (text.length === 0) return '';
  return text.length > length ? text.slice(0, length) : text;
}

module.exports = { caption };
