"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("cheerio");
const { mapImageTags } = require("../scripts/lib/html-images");
const { processSite: imageErrors } = require("../scripts/filters/lib/img_onerror");
const { imageFallbackAsset } = require("../scripts/lib/image-fallback");
const { lazyProcess } = require("../scripts/filters/lib/img_lazyload");
const { processSite: processImages } = require("../scripts/filters/lib/img");

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
  const ctx = { config: { root: "/docs/", url: "https://example.com", relative_link: true }, utils: { iconData: () => fallback } };
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
    assert.equal(target.src, "/docs/" + imageFallbackAsset(fallback).path);
    assert.equal(target.onerror, null);
    assert.equal(imageErrors.call(ctx, output), output);
  }
});

test("图片失败过滤器保留自定义处理器与内嵌资源", () => {
  const ctx = { config: { root: "/", url: "https://example.com" }, utils: { iconData: () => "data:image/svg+xml,fallback" } };
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

test("单次图片扫描与原双过滤器顺序保持完全一致", () => {
  const ctx = { config: { root: "/", url: "https://example.com" }, utils: { iconData: () => "data:image/svg+xml,fallback" } };
  const html = '<script>const x=`<img src="fake.png">`</script>'
    + '<style>.x{content:\'<img src="fake.png">\'}</style>'
    + '<!-- <img src="fake.png"> -->'
    + '<img src="quoted.png" alt="a > b">'
    + '<img no-lazy src=plain.png>'
    + '<img class="custom" src="custom.png" onerror="custom()"/>'
    + '<img src="data:image/png;base64,inline" data-src="deferred.png">';
  const expected = imageErrors.call(ctx, lazyProcess(html));
  assert.equal(processImages.call(ctx, html), expected);
});

test("共享图片资源保留原始内容，覆盖值变化后引用同步失效", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><!-- attribution --><text>图 &amp; 字</text></svg>';
  const encoded = imageFallbackAsset('data:image/svg+xml,' + encodeURIComponent(svg));
  const base64 = imageFallbackAsset('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
  assert.equal(encoded.data.toString(), svg);
  assert.equal(base64.path, encoded.path);
  assert.deepEqual(base64.data, encoded.data);
  assert.notEqual(imageFallbackAsset('data:image/svg+xml,' + encodeURIComponent(svg + ' ')).path, encoded.path);
  assert.equal(imageFallbackAsset('data:image/svg+xml,%invalid'), null);
  for (const value of ['../fallback.png', '/fallback.svg', 'https://example.com/fallback.svg', 'data:image/png;base64,AA==']) {
    assert.equal(imageFallbackAsset(value), null);
    const output = imageErrors.call({ utils: { iconData: () => value } }, '<img src="image.png">');
    const target = {};
    Function(load(output)('img').attr('onerror')).call(target);
    assert.equal(target.src, value);
    assert.equal(target.onerror, null);
  }
});
