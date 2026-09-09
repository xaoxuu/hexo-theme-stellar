'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { load } = require('cheerio');

const colorMath = require('../../source/js/color');

const DATA_FILE = 'images_metadata.json';
const COLOR_ALGORITHM = 'hsla-mean-v1';
const SAMPLE_SIZE = 64;
const MAX_BYTES = 32 * 1024 * 1024;
const RETRY_DELAY = 24 * 60 * 60 * 1000;
const stores = new WeakMap();

function metadataPath(ctx) {
  return path.join(ctx.source_dir || path.join(ctx.base_dir || process.cwd(), 'source'), '_data', 'caches', DATA_FILE);
}

function excludeMetadataFromSource(ctx) {
  // This generated store is read directly, never through Hexo's data locals.
  // Exclude it from both initial/directory scans and the live file watcher.
  const file = metadataPath(ctx).replace(/\\/g, '/');
  const glob = file.replace(/([*?\[\]{}()!+@])/g, '\\$1') + '{,.lock,.*.tmp}';
  if (ctx.source.ignore.includes(glob)) return;
  ctx.source.ignore.push(glob);
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ctx.source.options.ignored = [...ctx.source.options.ignored, new RegExp(`^${escaped}(?:\\.lock|\\.[^/]+\\.tmp)?$`)];
}

function readStore(ctx, strict = false) {
  const file = metadataPath(ctx);
  try {
    const stat = fs.statSync(file);
    const cached = stores.get(ctx);
    if (cached?.mtime === stat.mtimeMs && cached?.size === stat.size) return cached.data;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.version !== 1 || !data.images || typeof data.images !== 'object' || Array.isArray(data.images)) {
      throw new Error('Unrecognized image metadata format');
    }
    stores.set(ctx, { mtime: stat.mtimeMs, size: stat.size, data });
    return data;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      if (strict) throw new Error(`Cannot read ${file}: ${error.message}`);
      if (!stores.get(ctx)?.warned) ctx.log?.warn(`Image metadata ignored: ${error.message}`);
      stores.set(ctx, { warned: true });
    }
    return { version: 1, images: {} };
  }
}

function writeStore(ctx, data) {
  const file = metadataPath(ctx);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  const sorted = { version: 1, images: Object.fromEntries(Object.entries(data.images).sort(([a], [b]) => a.localeCompare(b))) };
  try {
    fs.writeFileSync(temp, JSON.stringify(sorted, null, 2) + '\n');
    fs.renameSync(temp, file);
    stores.delete(ctx);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

function pageUrl(ctx, route = '') {
  return new URL(route, String(ctx.config.url || 'http://localhost/').replace(/\/?$/, '/')).href;
}

function imageUrl(src, base) {
  if (!src || /^(?:data|blob):/i.test(src)) return null;
  try {
    const url = new URL(src, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function dimensionsReady(value) {
  return value?.status === 'ready' && Number.isInteger(value.width) && value.width > 0
    && Number.isInteger(value.height) && value.height > 0;
}

function colorReady(value) {
  return value?.status === 'ready' && value.algorithm === COLOR_ALGORITHM && value.size === SAMPLE_SIZE
    && colorMath.validHsla(value.hsla);
}

function complete(entry) {
  const colorDone = colorReady(entry?.color) || (entry?.color?.status === 'unsupported' && entry.color.algorithm === COLOR_ALGORITHM);
  return (dimensionsReady(entry?.dimensions) || entry?.dimensions?.status === 'unsupported') && colorDone;
}

// Scan rendered img elements, so Markdown, tags, Front Matter and data-driven
// covers use their actual output without maintaining another source-field list.
function collectImages(html, base) {
  const urls = new Set();
  const $ = load(html, null, false);
  $('img').each((_, element) => {
    const img = $(element);
    const url = imageUrl(img.attr('data-src') || img.attr('src'), base);
    if (url) urls.add(url);
  });
  return urls;
}

async function readBytes(stream, maxBytes = MAX_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > maxBytes) throw new Error(`Image exceeds ${maxBytes} bytes`);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

async function fetchImage(ctx, url) {
  const target = new URL(url);
  const site = new URL(pageUrl(ctx));
  // Local images come from Hexo's generated asset routes, never via the network.
  if (target.origin === site.origin && target.pathname.startsWith(site.pathname)) {
    const relative = decodeURIComponent(target.pathname.slice(site.pathname.length));
    if (ctx.route.list().includes(relative)) return readBytes(ctx.route.get(relative));
    throw new Error(`Local image route not found: ${relative}`);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error('Image exceeds download limit');
  }
  return readBytes(response.body);
}

async function analyzeImage(buffer) {
  const sharp = require('sharp');
  const probe = require('probe-image-size');
  let dimensions;
  try {
    const found = probe.sync(buffer);
    if (found && Number.isInteger(found.width) && Number.isInteger(found.height)) {
      dimensions = { status: 'ready', width: found.width, height: found.height };
    }
  } catch { /* Some decoder-supported formats do not have a header probe. */ }
  let color;
  try {
    const decoder = sharp(buffer, { limitInputPixels: 40000000 });
    const info = await decoder.metadata();
    const rotated = info.orientation >= 5 && info.orientation <= 8;
    if (info.width && info.height) {
      dimensions = { status: 'ready', width: rotated ? info.height : info.width, height: rotated ? info.width : info.height };
    }
    const { data, info: pixels } = await decoder.rotate().resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'inside', withoutEnlargement: true })
      .toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const sums = [0, 0, 0, 0];
    for (let i = 0; i < data.length; i++) sums[i % 4] += data[i];
    color = { status: 'ready', algorithm: COLOR_ALGORITHM, size: SAMPLE_SIZE, hsla: colorMath.toHsla(Object.fromEntries(['r', 'g', 'b', 'a'].map((key, index) => [key, sums[index] / (pixels.width * pixels.height)]))) };
  } catch (error) {
    if (!/unsupported image format|unsupported format|not supported/i.test(error.message)) {
      return { dimensions, error: error.message, retryAfter: Date.now() + RETRY_DELAY };
    }
    color = { status: 'unsupported', algorithm: COLOR_ALGORITHM };
  }
  return { dimensions: dimensions || { status: 'unsupported' }, color };
}

async function prepareImages(ctx, options = {}) {
  const started = Date.now();
  const progress = message => ctx.log?.info?.(`Image metadata: ${message}`);
  const file = metadataPath(ctx);
  const lock = `${file}.lock`;
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    try { fs.closeSync(fs.openSync(lock, 'wx')); }
    catch (error) { throw new Error(`Image metadata is locked (${lock}); stop the other preprocessor, or remove a stale lock. ${error.message}`); }
  }
  try {
    const store = readStore(ctx, true);
    const urls = new Set();
    if (options.refresh) {
      const url = imageUrl(options.refresh, pageUrl(ctx));
      if (!url) throw new Error('--refresh requires an image URL');
      urls.add(url);
    } else {
      let pages = options.pages ? [...options.pages.keys()] : ctx.route.list().filter(route => /\.html?$/.test(route));
      if (options.page) {
        const requested = options.page.replace(/^\//, '');
        const route = requested.endsWith('/') ? requested + 'index.html' : requested;
        pages = pages.filter(page => page === route);
        if (!pages.length) throw new Error(`Page route not found: ${route}`);
      }
      progress(`scanning ${pages.length} pages…`);
      for (const route of pages) {
        const html = options.pages?.get(route) ?? (await readBytes(ctx.route.get(route))).toString();
        for (const url of collectImages(html, pageUrl(ctx, route))) urls.add(url);
      }
    }
    const report = { found: urls.size, skipped: 0, deferred: 0, processed: 0, failed: 0, file };
    const queue = [...urls].filter(url => {
      const entry = store.images[url];
      if (!options.refresh && complete(entry)) { report.skipped++; return false; }
      if (!options.refresh && entry?.retryAfter > Date.now()) { report.deferred++; return false; }
      return true;
    });
    progress(`${report.found} images: ${report.skipped} cached, ${report.deferred} deferred, ${queue.length} pending${options.dryRun ? ' (dry run)' : ''}`);
    if (options.dryRun) return { ...report, missing: queue };
    const fetchBytes = options.fetchImage || (url => fetchImage(ctx, url));
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (cursor < queue.length) {
        const url = queue[cursor++];
        progress(`starting ${cursor}/${queue.length}: ${url}`);
        let result;
        try { result = await analyzeImage(await fetchBytes(url)); }
        catch (error) { result = { error: error.message, retryAfter: Date.now() + RETRY_DELAY }; }
        const entry = { ...store.images[url], updatedAt: new Date().toISOString() };
        if (result.dimensions) entry.dimensions = result.dimensions;
        if (result.color) entry.color = result.color;
        delete entry.error;
        delete entry.retryAfter;
        if (result.error) {
          entry.error = result.error;
          entry.retryAfter = result.retryAfter;
          report.failed++;
          ctx.log?.warn(`Image metadata: ${url}: ${result.error}`);
        }
        store.images[url] = entry;
        report.processed++;
        writeStore(ctx, store);
        progress(`[${report.processed}/${queue.length}] ${result.error ? 'failed' : result.color?.status === 'unsupported' ? 'unsupported' : 'saved'}: ${url}`);
      }
    }));
    progress(`done in ${((Date.now() - started) / 1000).toFixed(1)}s: ${report.processed} processed, ${report.failed} failed, ${report.skipped} cached, ${report.deferred} deferred`);
    return report;
  } finally {
    if (!options.dryRun) fs.rmSync(lock, { force: true });
  }
}

function enrichImages(html, ctx, locals = {}) {
  const store = readStore(ctx);
  if (!Object.keys(store.images).length || !/<img/i.test(html)) return html;
  const base = pageUrl(ctx, locals.path || locals.page?.path || '');
  const $ = load(html, null, /<!doctype\s+html|<html[\s>]/i.test(html));
  let changed = false;
  const autoRatio = (ctx.stellar?.config?.features?.lazyLoading?.autoAspectRatio
    ?? ctx.theme?.config?.features?.lazy_loading?.auto_aspect_ratio) !== false;
  $('img').each((_, image) => {
    const img = $(image);
    const src = img.attr('data-src') || img.attr('src');
    const entry = store.images[imageUrl(src, base)];
    if (!entry) return;
    if (autoRatio && dimensionsReady(entry.dimensions)) {
      const { width, height } = entry.dimensions;
      if (img.attr('data-stellar-image-dimensions') || (!img.attr('width') && !img.attr('height'))) {
        img.attr({ width: String(width), height: String(height), 'data-stellar-image-dimensions': 'true' });
        changed = true;
      }
      const wrapper = img.closest('.tag-plugin.image .image-bg');
      if (wrapper.length && (wrapper.attr('data-stellar-image-ratio') || !/(?:^|;)\s*aspect-ratio\s*:/i.test(wrapper.attr('style') || ''))) {
        let wrapperStyle = (wrapper.attr('style') || '').replace(/(?:^|;)\s*aspect-ratio\s*:[^;]*/gi, '');
        let imageStyle = img.attr('style') || '';
        // The image tag puts explicit dimensions on its image when no ratio is
        // known. Once a ratio is available, keep those dimensions on the box.
        imageStyle = imageStyle.replace(/(?:^|;)\s*(width|height)\s*:\s*([^;]+)/gi, (_, name, value) => {
          wrapperStyle = wrapperStyle.replace(new RegExp('(?:^|;)\\s*' + name + '\\s*:[^;]*', 'gi'), '');
          wrapperStyle += `;${name}:${value}`;
          return '';
        });
        if (imageStyle.trim()) img.attr('style', imageStyle);
        else img.removeAttr('style');
        wrapper.attr('style', `${wrapperStyle};aspect-ratio:${width}/${height};`);
        wrapper.attr('data-stellar-image-ratio', 'true');
        changed = true;
      }
    }
    if (colorReady(entry.color)) {
      img.attr('data-stellar-image-color', JSON.stringify({ size: entry.color.size, hsla: entry.color.hsla }));
      img.attr('data-stellar-image-source', src);
      changed = true;
    }
  });
  return changed ? $.html() : html;
}

async function prepareBuildImages(ctx, options = {}) {
  // after_generate has complete routes, but Hexo has not written/served them yet.
  // Render once for discovery, then enrich that same output with newly filled data.
  const pages = new Map();
  for (const route of ctx.route.list().filter(route => /\.html?$/.test(route))) {
    pages.set(route, (await readBytes(ctx.route.get(route))).toString());
  }
  let report;
  try {
    report = await prepareImages(ctx, { ...options, pages });
    if (report.processed) ctx.log?.info(`Image metadata: ${report.processed} processed, ${report.failed} failed; existing images skipped.`);
  } catch (error) {
    ctx.log?.warn(`Image preprocessing skipped: ${error.message}`);
  }
  for (const [route, html] of pages) {
    ctx.route.set(route, enrichImages(html, ctx, { path: route }));
  }
  return report;
}

module.exports = { metadataPath, excludeMetadataFromSource, readStore, collectImages, prepareImages, prepareBuildImages, enrichImages, analyzeImage, COLOR_ALGORITHM, SAMPLE_SIZE };
