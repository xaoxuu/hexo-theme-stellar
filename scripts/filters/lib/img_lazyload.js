/**
 * img_lazyload.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * 懒加载强制开启：不再读取 enable 配置，no-lazy 是唯一例外。
 * v2：改为属性感知的 <img> 标签解析，仅在标签自身范围内读取 src，
 * 并跳过 <script>/<style>/<!-- --> 区域，避免与「去属性引号」的 HTML
 * 压缩器（如 hexo-minify removeAttributeQuotes）组合时正则跨标签越界，
 * 误改写页内内联脚本中的 `s.src = "..."`。
 */

"use strict";

// 1×1 透明 PNG：懒加载占位图
const LOADING_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=";

// 解析 <img ...> 标签内部属性，返回 [{name, value, raw, start, end}]
function parseAttrs(inner) {
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

// 处理单个 <img> 标签：加 lazy 类并替换 src 为占位图 + data-src
function processImgTag(imgTag) {
  // 快速跳过：整标签已含懒加载标记 / 原生 srcset / no-lazy（兼容压缩前后写法）
  if (/data-src/gi.test(imgTag)) {
    return imgTag;
  }
  if (/srcset=/gi.test(imgTag)) {
    return imgTag;
  }
  if (/\bno-lazy\b/gi.test(imgTag)) {
    return imgTag;
  }

  const selfClosing = /\/>$/.test(imgTag);
  const inner = imgTag.slice(4, selfClosing ? imgTag.length - 2 : imgTag.length - 1);
  const attrs = parseAttrs(inner);
  const src = attrs.find((a) => a.name === "src");
  // 无 src / 空 src / 已是占位图（data:image）时不处理
  if (!src || src.value == null || src.value === "" || /^data:image/i.test(src.value)) {
    return imgTag;
  }

  const classAttr = attrs.find((a) => a.name === "class");
  const oldClass = classAttr && classAttr.value != null ? classAttr.value : "";
  const newClass = (oldClass ? oldClass + " " : "") + "lazy";

  let out = "<img";
  if (!classAttr) {
    out += ' class="' + newClass + '"';
  }
  let pos = 0;
  for (const a of attrs) {
    out += inner.slice(pos, a.start);
    if (a.name === "src") {
      out += 'src="' + LOADING_IMG + '" data-src="' + src.value + '"';
    } else if (a.name === "class") {
      out += 'class="' + newClass + '"';
    } else {
      out += a.raw;
    }
    pos = a.end;
  }
  out += inner.slice(pos);
  out += selfClosing ? "/>" : ">";
  return out;
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

// 全页扫描：只在真实 <img> 标签上做懒加载，跳过脚本/样式/注释内容
function processHtml(html) {
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
      parts.push(processImgTag(html.slice(i, end + 1)));
      i = end + 1;
      continue;
    }
    parts.push(ch);
    i++;
  }
  return parts.join("");
}

function lazyProcess(htmlContent) {
  // 短路：无 <img 的页面（如 404）无需扫描
  if (typeof htmlContent !== "string" || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  return processHtml(htmlContent);
}

module.exports.processSite = function (htmlContent) {
  return lazyProcess.call(this, htmlContent);
};

module.exports.lazyProcess = lazyProcess;
