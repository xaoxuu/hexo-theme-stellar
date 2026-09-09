// Prefer cached colors and display pixels; use one shared CORS sample when display pixels are unreadable.
export const COLOR_CACHE_PREFIX = 'Stellar.image-color.hsla.v1.';
const TTL = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 256;
const memory = new Map();
const pendingSamples = new Map();
const failedSamples = new Set();
let generation = 0;

function storageOrNull() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function isImageColorKey(key) {
  return typeof key === 'string' && key.startsWith(COLOR_CACHE_PREFIX);
}

function keys(storage) {
  const result = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (isImageColorKey(key)) result.push(key);
  }
  return result;
}

export function clearImageColorCache(storage = storageOrNull()) {
  memory.clear();
  failedSamples.clear();
  generation++;
  let removed = 0;
  let failed = 0;
  try {
    for (const key of keys(storage)) {
      try { storage.removeItem(key); removed++; } catch { failed++; }
    }
  } catch { failed++; }
  return { ok: failed === 0, partial: removed > 0 && failed > 0, removed, failed };
}

globalThis.addEventListener?.('storage', event => {
  if (event.key === null || isImageColorKey(event.key)) {
    memory.clear();
    generation++;
  }
});

function valid(entry) {
  return entry && Number.isFinite(entry.ts) && entry.ts <= Date.now() && Date.now() - entry.ts < TTL
    && window.stellar.color.validHsla(entry.raw);
}

function remember(key, entry) {
  memory.set(key, entry);
  if (memory.size > MAX_ENTRIES) {
    const oldest = [...memory].sort((a, b) => a[1].ts - b[1].ts)[0];
    memory.delete(oldest[0]);
  }
}

function read(key) {
  const cached = memory.get(key);
  if (valid(cached)) return cached.raw;
  memory.delete(key);
  try {
    const entry = JSON.parse(storageOrNull()?.getItem(key) || 'null');
    if (valid(entry)) {
      remember(key, entry);
      return entry.raw;
    }
  } catch { /* A corrupt or unavailable cache is a miss. */ }
  return null;
}

function write(key, raw) {
  const entry = { ts: Date.now(), raw };
  remember(key, entry);
  try {
    const storage = storageOrNull();
    const retained = [];
    for (const candidate of keys(storage)) {
      let old;
      try { old = JSON.parse(storage.getItem(candidate)); } catch { old = null; }
      if (!valid(old) || candidate === key) storage.removeItem(candidate);
      else retained.push({ key: candidate, ts: old.ts });
    }
    retained.sort((a, b) => a.ts - b.ts);
    while (retained.length >= MAX_ENTRIES) storage.removeItem(retained.shift().key);
    storage.setItem(key, JSON.stringify(entry));
  } catch { /* Keep the in-memory result when persistence is unavailable. */ }
}

function normalize(value, image) {
  try { return value ? new URL(value, image.ownerDocument.baseURI).href : ''; } catch { return ''; }
}

function source(image) {
  // Lazy placeholders must not be sampled or used as persistent identities.
  const declared = image.getAttribute('src') || '';
  const responsive = image.getAttribute('srcset') || image.closest?.('picture');
  const current = responsive ? image.currentSrc || declared : declared || image.currentSrc || '';
  const deferred = image.getAttribute('data-src');
  return normalize(deferred && (!current || current.startsWith('data:')) ? deferred : current, image);
}

function sample(image, size) {
  try {
    const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = image.ownerDocument.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const sums = [0, 0, 0, 0];
    for (let i = 0; i < data.length; i++) sums[i % 4] += data[i];
    return window.stellar.color.toHsla(Object.fromEntries(['r', 'g', 'b', 'a'].map((key, i) => [key, sums[i] / (data.length / 4)])));
  } catch { return null; }
}

// Display images usually use no-cors, even when their CDN permits anonymous CORS.
// Keep this fallback independent of individual consumers: aborting one card must
// not cancel a sample another card is waiting for. Failed samples are page-local.
function sampleWithCors(image, url, size, key) {
  if (pendingSamples.has(key)) return pendingSamples.get(key);
  if (failedSamples.has(key)) return Promise.resolve(null);
  const started = generation;
  const promise = new Promise(resolve => {
    const probe = image.ownerDocument.createElement('img');
    let timer;
    function finish(raw) {
      clearTimeout(timer);
      probe.onload = null;
      probe.onerror = null;
      if (generation === started) {
        if (raw) write(key, raw);
        else {
          failedSamples.add(key);
          if (failedSamples.size > MAX_ENTRIES) failedSamples.delete(failedSamples.values().next().value);
        }
      }
      resolve(raw);
    }
    probe.crossOrigin = 'anonymous';
    probe.onload = () => finish(sample(probe, size));
    probe.onerror = () => finish(null);
    timer = setTimeout(() => finish(null), 10000);
    probe.src = url;
  });
  pendingSamples.set(key, promise);
  promise.finally(() => pendingSamples.delete(key));
  return promise;
}

function waitForSample(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.resolve(null);
  return new Promise(resolve => {
    const abort = () => resolve(null);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(raw => {
      signal.removeEventListener('abort', abort);
      resolve(signal.aborted ? null : raw);
    });
  });
}

export function readImageColor(image, options = {}) {
  if (!image || image.tagName !== 'IMG' || options.signal?.aborted) return Promise.resolve(null);
  const url = source(image);
  if (!url) return Promise.resolve(null);
  const size = Number.isInteger(options.size) && options.size > 0 ? options.size : 64;
  // Build-owned metadata wins over an older browser cache, including a refreshed
  // image at the same URL. The source guard prevents reuse after a dynamic swap.
  try {
    const embedded = JSON.parse(image.getAttribute('data-stellar-image-color') || 'null');
    if (normalize(image.getAttribute('data-stellar-image-source'), image) === url
      && embedded?.size === size && window.stellar.color.validHsla(embedded.hsla)) {
      const raw = embedded.hsla;
      return Promise.resolve().then(() => source(image) === url && !options.signal?.aborted ? raw : null);
    }
  } catch { /* Missing or invalid metadata falls back to the runtime cache. */ }
  const key = COLOR_CACHE_PREFIX + JSON.stringify([url, size]);
  const cached = read(key);
  if (cached) return Promise.resolve().then(() => source(image) === url && !options.signal?.aborted ? cached : null);
  const started = generation;
  return new Promise(resolve => {
    function finish(raw) {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      options.signal?.removeEventListener('abort', onError);
      resolve(raw);
    }
    function onError() { finish(null); }
    function onLoad() {
      if (options.signal?.aborted || source(image) !== url) return finish(null);
      const displayed = normalize(image.currentSrc || image.getAttribute('src'), image);
      if (displayed !== url) return; // The lazy placeholder finished loading.
      if (!image.naturalWidth || !image.naturalHeight) return finish(null);
      const existing = read(key);
      const raw = existing || sample(image, size);
      if (!existing && raw && generation === started) write(key, raw);
      if (raw || image.crossOrigin) return finish(raw);
      finish(waitForSample(sampleWithCors(image, url, size, key), options.signal));
    }
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
    options.signal?.addEventListener('abort', onError, { once: true });
    if (image.complete && normalize(image.currentSrc || image.getAttribute('src'), image) === url) onLoad();
  }).then(raw => source(image) === url && !options.signal?.aborted ? raw : null);
}
