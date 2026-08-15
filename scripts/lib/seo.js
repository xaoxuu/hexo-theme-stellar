/* global hexo */
'use strict';

// SEO 相关纯函数：供 JSON-LD 生成与 head 模板共用，避免两处重复逻辑。

/**
 * 提取正文第一张图片的真实地址。
 * 优先匹配 data-src（懒加载占位图场景），其次匹配 src。
 * @param {string} content 已渲染的 HTML 内容
 * @returns {string} 图片地址，未找到时返回空字符串
 */
function firstContentImage(content) {
  if (!content) {
    return '';
  }
  const html = String(content);
  const dataSrc = html.match(/<img[^>]*data-src=["']([^"']+)["']/i);
  if (dataSrc) {
    return dataSrc[1];
  }
  const src = html.match(/<img[^>]*src=["']([^"']+)["']/i);
  return src ? src[1] : '';
}

/**
 * 构建文章图片数组（顺序：cover → banner → photos → 正文首图 → 默认封面）。
 * @param {Object} opts
 * @param {string} opts.cover
 * @param {string} opts.banner
 * @param {Array} opts.photos
 * @param {string} opts.content
 * @param {string} opts.defaultCover 主题默认封面（theme.default.cover）
 * @returns {Array<string>}
 */
function postImages(opts) {
  const cover = opts.cover || '';
  const banner = opts.banner || '';
  const photos = Array.isArray(opts.photos) ? opts.photos.slice() : [];
  const defaultCover = opts.defaultCover || '';
  const images = photos;
  if (cover) {
    images.unshift(cover);
  } else if (banner) {
    images.unshift(banner);
  }
  if (images.length === 0) {
    const first = firstContentImage(opts.content);
    if (first) {
      images.push(first);
    }
  }
  if (images.length === 0 && defaultCover) {
    images.push(defaultCover);
  }
  return images;
}

/**
 * 构建文章描述：优先摘要，缺失时回退正文并截断。
 * @param {Object} opts
 * @param {string} opts.excerpt
 * @param {string} opts.content
 * @returns {string}
 */
function postDescription(opts) {
  const util = require('hexo-util');
  const excerpt = String(opts.excerpt || '').replace(/<[^>]+>/g, '');
  if (excerpt) {
    return excerpt;
  }
  const content = String(opts.content || '').replace(/<[^>]+>/g, '');
  return util.truncate(content, { length: 200 });
}

module.exports = {
  firstContentImage,
  postImages,
  postDescription
};
