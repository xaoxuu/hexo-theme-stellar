'use strict';

/**
 * 本地搜索索引正文构建：从渲染后 HTML 提取搜索正文与章节锚点。
 *
 * - 返回的 content 与 scripts/generators/search.js 原有全文归一化结果逐字节一致；
 * - anchors 每项 { id, text, offset }，offset 指向标题文本在 content 中的起始位置，
 *   与客户端 content.indexOf() 的偏移严格对齐。
 */

const { stripHTML } = require('hexo-util');

// 标题标签切分：捕获 level / 开始标签属性 / 内部 HTML
const HEADING_RE = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const HEADING_ID_RE = /id="([^"]*)"/;

// 全局预清理：与 scripts/generators/search.js 原有顺序保持一致（先于 stripHTML）
function preClean(html) {
  return String(html || '')
    .replace(/<span class="line">\d+<\/span>/g, '')
    .replace(/<iframe[\s|\S]+iframe>/g, '')
    .replace(/<hr>/g, '')
    .replace(/<br>/g, '');
}

// 单段清洗：stripHTML 之后移除实体、换行转空格、空白折叠（不做全文 trim）
function cleanChunk(chunk) {
  return stripHTML(chunk)
    .replace(/&[^\s;]+;/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/[\s]{2,}/g, ' ');
}

// 跨段拼接：上一段以空白结尾且本段以空白开头时，合并为单个空白，
// 与整段式 [\s]{2,} 折叠在边界上的结果一致
function mergeChunk(buffer, chunk) {
  if (buffer && /\s$/.test(buffer) && /^\s/.test(chunk)) {
    return chunk.replace(/^\s+/, '');
  }
  return chunk;
}

/**
 * 构建搜索索引条目：{ content, anchors }
 * @param {string} html 渲染后的页面 HTML
 */
function buildSearchIndex(html) {
  const parts = preClean(html).split(HEADING_RE);
  let content = '';
  const anchors = [];
  for (let i = 0; i < parts.length; i += 4) {
    const before = parts[i] || '';
    const level = parts[i + 1];
    const attrs = parts[i + 2] || '';
    const inner = parts[i + 3] || '';
    content += mergeChunk(content, cleanChunk(before));
    if (!level) {
      continue;
    }
    const rawText = cleanChunk(inner);
    const text = rawText.trim();
    const merged = mergeChunk(content, rawText);
    const appended = merged.slice(content.length);
    const offset = content.length + (appended.length - appended.trimStart().length);
    const match = attrs.match(HEADING_ID_RE);
    if (match && text.length > 0) {
      anchors.push({ id: match[1], text, offset });
    }
    content += merged;
  }
  const trimmed = content.trim();
  const shift = content.length - content.trimStart().length;
  if (shift > 0) {
    for (const anchor of anchors) {
      anchor.offset -= shift;
    }
  }
  return { content: trimmed, anchors };
}

module.exports = { buildSearchIndex };
