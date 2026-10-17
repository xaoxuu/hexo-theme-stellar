"use strict";

const fs = require("node:fs");
const path = require("node:path");
const frontMatter = require("hexo-front-matter");
const { loadYaml } = require("./yaml");
const snapshots = new WeakMap();

function sourcePathForData(key) { return `source/_data/${key}.yml`; }
function sourcePathForPage(page) { return page.source ? `source/${page.source}` : (page.path || "<page>"); }
// 与 Hexo 宿主通过 hexo-fs 读取源码时保持一致：去除 BOM 并规范化 CRLF。
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
  const text = readSourceText(file);
  const header = frontMatter.split(text);
  // 复用上游的分隔符/缩进处理；YAML 与 Doctor 共用解析语义，JSON 仍由上游处理。
  const parsed = header.data && header.separator.startsWith("-")
    ? loadYaml(frontMatter.escape(header.data), { filename: file })
    : frontMatter.parse(text);
  const config = parsed && typeof parsed === "object" ? parsed : {};
  delete config._content;
  cache.set(page.source, { stamp, config });
  return config;
}
module.exports = { readFrontMatter, pruneSourceCache, sourcePathForData, sourcePathForPage };
