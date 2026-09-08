"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("cheerio");
const { mapImageTags } = require("../scripts/lib/html-images");
const { lazyProcess } = require("../scripts/filters/lib/img_lazyload");
const { processSite: processImages } = require("../scripts/filters/lib/img");

test("共享图片扫描只变换真实标签并保留其他 HTML 原文", () => {
  const inert = '<script>const html = `<img src="script.png">`;</script>'
    + '<style>.x::after { content: \'<img src="style.png">\'; }</style>'
    + '<!-- <img src="comment.png"> -->'
    + '<noscript><img src="fallback.png"></noscript>';
  const tags = [];
  const html = inert + '<IMG\n src="real.png" alt="a > b"/><p>tail</p>';
  const output = mapImageTags(html, tag => {
    tags.push(tag);
    return '<img src="replacement.png">';
  });
  assert.deepEqual(tags, ['<IMG\n src="real.png" alt="a > b"/>']);
  assert.equal(output, inert + '<img src="replacement.png"><p>tail</p>');
});

test("图片处理入口保留自定义脚本且不插入可执行配置", () => {
  const ctx = { utils: { iconData: () => "data:image/svg+xml,fallback" } };
  const html = '<script>const x=`<img src="fake.png">`</script>'
    + '<style>.x{content:\'<img src="fake.png">\'}</style>'
    + '<!-- <img src="fake.png"> -->'
    + '<img src="quoted.png" alt="a > b">'
    + '<img no-lazy src=plain.png>'
    + '<img class="custom" src="custom.png" onerror="custom()"/>'
    + '<img src="data:image/png;base64,inline" data-src="deferred.png">';
  const expected = lazyProcess(html);
  assert.equal(load(expected)('img[onerror]').length, 1);
  assert.equal(load(expected)('img[onerror]').attr('onerror'), 'custom()');
  assert.equal(processImages.call(ctx, html), expected);
});


test('图片后备中的属性不能提前关闭 noscript 或注入可执行标签', () => {
  const output = lazyProcess('<img src="a.png" alt="</noscript><script>alert(1)</script>">');
  const html = load(output);
  assert.equal(html('script').length, 0);
  assert.equal(html('img').attr('alt'), '</noscript><script>alert(1)</script>');
  assert.equal(load(output, { scriptingEnabled: false }, false)('noscript img').attr('alt'), '</noscript><script>alert(1)</script>');
});
