function resolveAsset(root, value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  if (!value.startsWith('/')) return value;
  const base = typeof root === 'string' && root.length > 0 ? root : '/';
  return `${base.replace(/\/$/, '')}${value}`;
}

function versionAsset(value, url, version) {
  if (typeof value !== 'string' || !value.startsWith('/') || !version) return url;
  const suffix = version.replace(/^\?/, '');
  return `${url}${url.includes('?') ? '&' : '?'}${suffix}`;
}

export function createAssetLoader(options = {}) {
  const documentRef = options.document || document;
  const root = options.root || '/';
  const version = options.version || '';
  const scripts = new Map();
  const styles = new Map();

  function load(kind, value, attributes = {}) {
    const url = versionAsset(value, resolveAsset(root, value), version);
    if (!url) return Promise.reject(new TypeError('[stellar runtime] asset URL is required'));
    const cache = kind === 'script' ? scripts : styles;
    if (cache.has(url)) return cache.get(url);
    if (kind === 'style' && documentRef.querySelectorAll) {
      const absolute = new URL(url, documentRef.baseURI).href;
      const existing = [...documentRef.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === absolute && link.sheet);
      if (existing) { const ready = Promise.resolve(existing); cache.set(url, ready); return ready; }
    }
    const promise = new Promise((resolve, reject) => {
      const element = documentRef.createElement(kind === 'script' ? 'script' : 'link');
      if (kind === 'script') { element.setAttribute?.('data-stellar-script', 'asset'); element.src = url; element.async = attributes.async !== false; }
      else { element.rel = 'stylesheet'; element.href = url; }
      for (const [key, value] of Object.entries(attributes)) element[key] = value;
      const done = error => {
        clearTimeout(timer);
        element.removeEventListener?.('load', onLoad);
        element.removeEventListener?.('error', onError);
        if (error) { element.remove?.(); reject(error); } else resolve(element);
      };
      const onLoad = () => done();
      const onError = () => done(new Error(`failed to load ${url}`));
      const timer = setTimeout(() => done(new Error(`asset load timed out: ${url}`)), options.timeoutMs || 15000);
      element.addEventListener('load', onLoad, { once: true });
      element.addEventListener('error', onError, { once: true });
      documentRef.head.appendChild(element);
    });
    cache.set(url, promise);
    promise.catch(() => cache.delete(url));
    return promise;
  }
  const script = (src, attributes) => load('script', src, attributes);
  const style = (href, attributes) => load('style', href, attributes);
  const resolve = value => resolveAsset(root, value);
  function scoped(signal) {
    function wait(promise) {
      if (signal.aborted) return Promise.reject(signal.reason);
      return new Promise((resolve, reject) => {
        const cancel = () => reject(signal.reason);
        signal.addEventListener('abort', cancel, { once: true });
        promise.then(value => { signal.removeEventListener('abort', cancel); signal.aborted ? reject(signal.reason) : resolve(value); },
          error => { signal.removeEventListener('abort', cancel); reject(error); });
      });
    }
    return Object.freeze({ resolve, script: (...args) => signal.aborted ? Promise.reject(signal.reason) : wait(script(...args)),
      style: (...args) => signal.aborted ? Promise.reject(signal.reason) : wait(style(...args)) });
  }
  return Object.freeze({ script, style, resolve, scoped });
}
