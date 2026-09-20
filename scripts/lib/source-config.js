"use strict";

const fs = require("node:fs");
const path = require("node:path");
const frontMatter = require("hexo-front-matter");
const snapshots = new WeakMap();

function sourcePathForData(key) { return `source/_data/${key}.yml`; }
function sourcePathForPage(page) { return page.source ? `source/${page.source}` : (page.path || "<page>"); }
// hexo-front-matter 只识别 LF；Hexo 宿主通过 hexo-fs 读取源码时会去除 BOM 并规范化 CRLF，
// 直接读取源码必须保持一致，否则 Windows 上的 CRLF 内容会丢失全部 Front Matter。
function readSourceText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}
function sourceCache(ctx) {
  if (!snapshots.has(ctx)) snapshots.set(ctx, new Map());
  return snapshots.get(ctx);
}
function pruneSourceCache(ctx, pages) {
  const sources = new Set(pages.map(page => page.source));
  for (const source of sourceCache(ctx).keys()) if (!sources.has(source)) sourceCache(ctx).delete(source);
}
function readFrontMatter(ctx, page) {
  if (!page.source) return null;
  const cache = sourceCache(ctx);
  const file = path.join(ctx.source_dir, page.source);
  let stat;
  try { stat = fs.statSync(file, { bigint: true }); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    cache.delete(page.source);
    return null;
  }
  const stamp = [stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(":");
  const previous = cache.get(page.source);
  if (previous?.stamp === stamp) return previous.config;
  const config = frontMatter.parse(readSourceText(file));
  delete config._content;
  cache.set(page.source, { stamp, config });
  return config;
}
module.exports = { readFrontMatter, pruneSourceCache, sourcePathForData, sourcePathForPage };
