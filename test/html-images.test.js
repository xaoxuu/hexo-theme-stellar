"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("cheerio");
const { mapImageTags } = require("../scripts/lib/html-images");
const { processSite: imageErrors } = require("../scripts/filters/lib/img_onerror");

test("共享图片扫描只变换真实标签并保留其他 HTML 原文", () => {
  const inert = '<script>const html = `<img src="script.png">`;</script>'
    + '<style>.x::after { content: \'<img src="style.png">\'; }</style>'
    + '<!-- <img src="comment.png"> -->';
  const tags = [];
  const html = inert + '<IMG\n src="real.png" alt="a > b"/><p>tail</p>';
  const output = mapImageTags(html, tag => {
    tags.push(tag);
    return '<img src="replacement.png">';
  });
  assert.deepEqual(tags, ['<IMG\n src="real.png" alt="a > b"/>']);
  assert.equal(output, inert + '<img src="replacement.png"><p>tail</p>');
});

test("图片失败处理正确编码配置值且不损坏标签属性", () => {
  const fallback = 'data:image/svg+xml,<svg data-value="quotes & symbols"/>\n';
  const ctx = { utils: { iconData: () => fallback } };
  for (const html of [
    '<img src="real.png" alt="a &amp; b"/>',
    "<IMG no-lazy='' SRC='real.png' >",
    '<img src=real.png>',
    '<img src="data:image/png;base64,placeholder" data-src="real.png">'
  ]) {
    const output = imageErrors.call(ctx, html);
    const image = load(output)("img");
    assert.equal(image.length, 1);
    const handler = image.attr("onerror");
    const target = {};
    Function(handler).call(target);
    assert.equal(target.src, fallback);
    assert.equal(imageErrors.call(ctx, output), output);
  }
});

test("图片失败过滤器保留自定义处理器与内嵌资源", () => {
  const ctx = { utils: { iconData: () => "data:image/svg+xml,fallback" } };
  for (const html of [
    '<img src="real.png" onerror="custom()">',
    '<img src="data:image/svg+xml,inline">',
    '<img alt="no source">',
    '<script>const image = \'<img src="real.png">\';</script>',
    '<!-- <img src="real.png"> -->',
    null,
    undefined
  ]) {
    assert.equal(imageErrors.call(ctx, html), html);
  }
});
