"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const createEmoji = require("../scripts/tags/lib/emoji");
const createGallery = require("../scripts/tags/lib/gallery");
const createGist = require("../scripts/tags/lib/gist");
const createRating = require("../scripts/tags/lib/rating");
const createVote = require("../scripts/tags/lib/vote");

const ROOT = path.resolve(__dirname, "..");

function mapArgs(input, named = [], positional = []) {
  const result = {};
  const values = [];
  for (const token of input) {
    const separator = token.indexOf(":");
    if (separator > 0) result[token.slice(0, separator)] = token.slice(separator + 1);
    else values.push(token);
  }
  const keys = Array.isArray(positional) ? positional : [positional];
  values.forEach((value, index) => {
    if (keys[index]) result[keys[index]] = value;
  });
  for (const key of named) if (!Object.prototype.hasOwnProperty.call(result, key)) result[key] = undefined;
  return result;
}

function context(config = {}) {
  return {
    stellar: { config },
    args: {
      map: mapArgs,
      joinTags: (input, keys) => keys.filter(key => input[key] != null).map(key => `${key}="${input[key]}"`)
    },
    utils: { icon: value => `<i>${value}</i>` }
  };
}

test("Emoji 使用 default_source 与 sources，并允许显式 provider", () => {
  const ctx = context({ extensions: { tags: { emoji: {
    defaultSource: "blobcat",
    sources: {
      blobcat: "https://cdn.example/blobcat/{name}.gif",
      qq: "https://cdn.example/qq/{name}.gif"
    }
  } } } });
  assert.match(createEmoji(ctx)(["party"]), /blobcat\/party\.gif/);
  assert.match(createEmoji(ctx)(["qq", "aini"]), /qq\/aini\.gif/);
});

test("Gallery 输出最终 aspect_ratio 属性与原图枚举", () => {
  const ctx = context({ extensions: { tags: { gallery: { size: "mix", aspectRatio: "square" } } } });
  const html = createGallery(ctx)(["layout:grid", "aspect_ratio:original", "size:xl"], "![A](/a.jpg)");
  assert.match(html, /aspect_ratio="original"/);
  assert.match(html, /size="xl"/);
  assert.doesNotMatch(html, /\bratio=/);
});

test("Gist 标签消费 github.gist_url 并支持 file 参数", () => {
  const ctx = context({ extensions: { services: { github: { gistUrl: "https://gist.example.com/" } } } });
  assert.equal(
    createGist(ctx)(["owner/abc123", "file:index.js"]),
    '<script src="https://gist.example.com/owner/abc123.js?file=index.js"></script>'
  );
  assert.throws(() => createGist(ctx)(["invalid"]), /expected owner\/id/);
});

test("Rating 与 Vote 使用时缺少 endpoint 会在构建期失败", () => {
  const ctx = context({ extensions: { services: { rating: { endpoint: null }, vote: { endpoint: null } } } });
  assert.throws(() => createRating(ctx)(["post"]), /rating\.endpoint is required/);
  assert.throws(() => createVote(ctx)(["post"]), /vote\.endpoint is required/);
});

test("Comments title 的 null 与空字符串语义由模板显式区分", () => {
  const source = fs.readFileSync(path.join(ROOT, "layout/_partial/comments/layout.ejs"), "utf8");
  assert.match(source, /commentModel\.title == null \? __\('btn\.comments'\) : commentModel\.title/);
  assert.match(source, /resolvedCommentTitle !== ''/);
});

test("本地搜索路径与懒加载策略内部固定，可搜索性只读 visibility", () => {
  const generator = fs.readFileSync(path.join(ROOT, "scripts/generators/search.js"), "utf8");
  const defines = fs.readFileSync(path.join(ROOT, "layout/_partial/scripts/defines.ejs"), "utf8");
  assert.match(generator, /path: "search\.json"/);
  assert.match(generator, /isSearchable\(config\)/);
  assert.doesNotMatch(generator, /cfg\.(?:indexPath|lazy|exclude)/);
  assert.match(defines, /path: '\/search\.json'/);
  assert.match(defines, /lazy_load: true/);
  assert.match(defines, /cache_ttl: localSearch\.cacheTtlSeconds/);
});
