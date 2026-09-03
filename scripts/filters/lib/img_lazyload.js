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

const { mapImageTags, parseImageAttributes } = require("../../lib/html-images");

// 1×1 透明 PNG：懒加载占位图
const LOADING_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=";

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
  const attrs = parseImageAttributes(inner);
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

function lazyProcess(htmlContent) {
  // 短路：无 <img 的页面（如 404）无需扫描
  if (typeof htmlContent !== "string" || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  return mapImageTags(htmlContent, processImgTag);
}

module.exports.processSite = function (htmlContent) {
  return lazyProcess.call(this, htmlContent);
};

module.exports.lazyProcess = lazyProcess;
