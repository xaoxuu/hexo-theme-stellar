/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const frontMatter = require("hexo-front-matter");

function sourcePathForData(key) {
  return `source/_data/${key}.yml`;
}

function sourcePathForPage(page) {
  return page.source ? `source/${page.source}` : (page.path || "<page>");
}

function readFrontMatter(ctx, page) {
  if (!page.source) return null;
  const sourcePath = path.join(ctx.source_dir, page.source);
  if (!fs.existsSync(sourcePath)) return null;
  return frontMatter.parse(fs.readFileSync(sourcePath, "utf8"));
}

module.exports = {
  readFrontMatter,
  sourcePathForData,
  sourcePathForPage
};
