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
  const n = html.length;
  const lower = html.toLowerCase();
  while (i < n) {
    const ch = html[i];
    if (ch !== "<") {
      parts.push(ch);
      i++;
      continue;
    }
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
    // <script>…</script>：整段跳过，避免误处理模板字符串/字符串里的 <img
    if (lower.startsWith("<script", i) && isTagBoundary(html, i + 7)) {
      const end = findTagEnd(html, i);
      if (end === -1) {
        break;
      }
      parts.push(html.slice(i, end + 1));
      i = end + 1;
      const close = lower.indexOf("</script", i);
      if (close === -1) {
        break;
      }
      const closeEnd = html.indexOf(">", close);
      if (closeEnd === -1) {
        break;
      }
      parts.push(html.slice(i, closeEnd + 1));
      i = closeEnd + 1;
      continue;
    }
    // <style>…</style>：整段跳过
    if (lower.startsWith("<style", i) && isTagBoundary(html, i + 6)) {
      const end = findTagEnd(html, i);
      if (end === -1) {
        break;
      }
      parts.push(html.slice(i, end + 1));
      i = end + 1;
      const close = lower.indexOf("</style", i);
      if (close === -1) {
        break;
      }
      const closeEnd = html.indexOf(">", close);
      if (closeEnd === -1) {
        break;
      }
      parts.push(html.slice(i, closeEnd + 1));
      i = closeEnd + 1;
      continue;
    }
    // <img …>
    if (lower.startsWith("<img", i) && isTagBoundary(html, i + 4)) {
      const end = findTagEnd(html, i);
      if (end === -1) {
        break;
      }
      parts.push(transform(html.slice(i, end + 1)));
      i = end + 1;
      continue;
    }
    parts.push(ch);
    i++;
  }
  return parts.join("");
}

module.exports = { mapImageTags, parseImageAttributes };
