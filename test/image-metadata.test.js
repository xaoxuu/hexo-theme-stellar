'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { prepareImages, readStore, metadataPath, collectImages } = require('../scripts/lib/image-metadata');

const image = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><path fill="#123456" d="M0 0h20v10H0z"/></svg>');
function site(t, html = '<img src="https://images.test/photo">') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'stellar-image-metadata-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const source = path.join(base, 'source');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'post.md'), '{% image https://images.test/photo ratio:16/9 %}');
  return {
    base_dir: base, source_dir: source, config: { url: 'https://site.test/' },
    route: { list: () => ['post/index.html'], get: () => Readable.from([html]) },
    log: { warn() {} }
  };
}

test('persistent image metadata deduplicates URLs, fills missing fields and never rewrites content', async t => {
  const ctx = site(t, '<img src="https://images.test/photo"><img data-src="https://images.test/photo">');
  const original = fs.readFileSync(path.join(ctx.source_dir, 'post.md'));
  let requests = 0;
  const fetchImage = async () => { requests++; return image; };
  const first = await prepareImages(ctx, { fetchImage });
  assert.equal(first.found, 1);
  assert.equal(requests, 1);
  const entry = readStore(ctx).images['https://images.test/photo'];
  assert.equal(entry.dimensions.width / entry.dimensions.height, 2);
  assert.equal(entry.color.status, 'ready');
  const second = await prepareImages(ctx, { fetchImage });
  assert.equal(second.processed, 0);
  assert.equal(requests, 1);
  assert.deepEqual(fs.readFileSync(path.join(ctx.source_dir, 'post.md')), original);
  const data = readStore(ctx);
  delete data.images['https://images.test/photo'].color;
  fs.writeFileSync(metadataPath(ctx), JSON.stringify(data));
  await prepareImages(ctx, { fetchImage });
  assert.equal(requests, 2);
  assert.equal(readStore(ctx).images['https://images.test/photo'].color.status, 'ready');
});

test('preprocessing dry-run is read-only and explicit refresh reprocesses an existing image', async t => {
  const ctx = site(t);
  let requests = 0;
  const fetchImage = async () => { requests++; return image; };
  const preview = await prepareImages(ctx, { dryRun: true, fetchImage });
  assert.equal(preview.missing.length, 1);
  assert.equal(requests, 0);
  assert.equal(fs.existsSync(metadataPath(ctx)), false);
  await prepareImages(ctx, { fetchImage });
  await prepareImages(ctx, { fetchImage, refresh: 'https://images.test/photo' });
  assert.equal(requests, 2);
});

test('transient metadata failures back off and do not suppress explicit retry', async t => {
  const ctx = site(t);
  let requests = 0;
  const fetchImage = async () => { requests++; throw new Error('offline'); };
  assert.equal((await prepareImages(ctx, { fetchImage })).failed, 1);
  assert.equal((await prepareImages(ctx, { fetchImage })).deferred, 1);
  assert.equal(requests, 1);
  await prepareImages(ctx, { refresh: 'https://images.test/photo', fetchImage: async () => image });
  assert.equal(readStore(ctx).images['https://images.test/photo'].error, undefined);
});

test('invalid metadata and concurrent writers cannot overwrite stored data', async t => {
  const ctx = site(t);
  fs.mkdirSync(path.dirname(metadataPath(ctx)), { recursive: true });
  fs.writeFileSync(metadataPath(ctx), 'broken');
  await assert.rejects(prepareImages(ctx), /Cannot read/);
  assert.equal(fs.readFileSync(metadataPath(ctx), 'utf8'), 'broken');
  fs.writeFileSync(metadataPath(ctx) + '.lock', 'other writer');
  await assert.rejects(prepareImages(ctx), /locked/);
  assert.equal(fs.readFileSync(metadataPath(ctx) + '.lock', 'utf8'), 'other writer');
});

test('rendered image discovery resolves URLs and ignores script contents and placeholders', () => {
  const urls = collectImages('<img src="../a.png?a=1&amp;b=2"><img data-src="//cdn.test/x"><script>const x="<img src=bad>"</script><img src="data:image/png;base64,AA">', 'https://site.test/posts/one/');
  assert.deepEqual([...urls], ['https://site.test/posts/a.png?a=1&b=2', 'https://cdn.test/x']);
});

test('same-site image preprocessing uses generated assets without a network request', async t => {
  const ctx = site(t);
  const html = '<img src="/asset.svg">';
  ctx.route.list = () => ['post/index.html', 'asset.svg'];
  ctx.route.get = route => Readable.from([route === 'asset.svg' ? image : html]);
  const result = await prepareImages(ctx);
  assert.equal(result.failed, 0);
  assert.equal(readStore(ctx).images['https://site.test/asset.svg'].color.status, 'ready');
});

test('automatic preprocessing publishes enriched routes in the same build and skips requests on rebuild', async t => {
  const { prepareBuildImages } = require('../scripts/lib/image-metadata');
  const ctx = site(t);
  const routes = new Map([['post/index.html', '<!doctype html><html><head></head><body><img src="https://images.test/photo"></body></html>']]);
  ctx.route.list = () => [...routes.keys()];
  ctx.route.get = route => Readable.from([routes.get(route)]);
  ctx.route.set = (route, html) => routes.set(route, html);
  let requests = 0;
  const options = { fetchImage: async () => { requests++; return image; } };
  await prepareBuildImages(ctx, options);
  const { load } = require('cheerio');
  const html = routes.get('post/index.html');
  const $ = load(html);
  assert.equal($('img').attr('width'), '20');
  assert.equal(JSON.parse($('img').attr('data-stellar-image-color')).hsla.length, 4);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  await prepareBuildImages(ctx, options);
  assert.equal(requests, 1);
});
