"use strict";

// 解析 <img ...> 标签内部属性，返回 [{name, value, raw, start, end}]
function parseImageAttributes(inner) {
  const attrs = [];
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    attrs.push({
      name: m[1].toLowerCase(),
      value: m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : null,
      raw: m[0],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return attrs;
}

// 查找标签结束位置（尊重属性值内的引号，避免把 > 截断进属性值）
function findTagEnd(html, start) {
  let j = start;
  let quote = null;
  while (j < html.length) {
    const ch = html[j];
    if (quote) {
      if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return j;
    }
    j++;
  }
  return -1;
}

function isTagBoundary(html, pos) {
  if (pos >= html.length) {
    return true;
  }
  const ch = html[pos];
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === ">" || ch === "/";
}

// 只变换真实 <img> 标签，保留脚本、样式、注释和其余 HTML 原文。
function mapImageTags(html, transform) {
  if (typeof html !== "string" || !/<img/i.test(html)) return html;
  const parts = [];
  let i = 0;
  let picture = false;
  const n = html.length;
  const lower = html.toLowerCase();
  while (i < n) {
    const nextTag = html.indexOf("<", i);
    if (nextTag === -1) {
      parts.push(html.slice(i));
      break;
    }
    if (nextTag > i) parts.push(html.slice(i, nextTag));
    i = nextTag;
    // HTML 注释
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i);
      if (end === -1) {
        break;
      }
      parts.push(html.slice(i, end + 3));
      i = end + 3;
      continue;
    }
    // Raw text and noscript fallbacks must never pass through the image filter.
    const opaque = ['script', 'style', 'noscript'].find(name =>
      lower.startsWith('<' + name, i) && isTagBoundary(html, i + name.length + 1));
    if (opaque) {
      const close = lower.indexOf('</' + opaque, findTagEnd(html, i) + 1);
      const end = close < 0 ? -1 : findTagEnd(html, close);
      if (end < 0) { parts.push(html.slice(i)); break; }
      parts.push(html.slice(i, end + 1));
      i = end + 1;
      continue;
    }
    if (lower.startsWith('<picture', i) && isTagBoundary(html, i + 8)) picture = true;
    if (lower.startsWith('</picture', i) && isTagBoundary(html, i + 9)) picture = false;
    // <img …>
    if (lower.startsWith("<img", i) && isTagBoundary(html, i + 4)) {
      const end = findTagEnd(html, i);
      if (end === -1) {
        break;
      }
      parts.push(transform(html.slice(i, end + 1), { picture }));
      i = end + 1;
      continue;
    }
    parts.push("<");
    i++;
  }
  return parts.join("");
}

// Shared by generated static HTML and the cached browser image bootstrap.
const IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
module.exports = { mapImageTags, parseImageAttributes, IMAGE_PLACEHOLDER };
