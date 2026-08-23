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

  function script(src, attributes = {}) {
    const url = versionAsset(src, resolveAsset(root, src), version);
    if (!url) return Promise.reject(new TypeError('[stellar runtime] script URL is required'));
    if (scripts.has(url)) return scripts.get(url);
    const promise = new Promise((resolve, reject) => {
      const element = documentRef.createElement('script');
      element.src = url;
      element.async = attributes.async !== false;
      Object.keys(attributes).forEach(key => {
        if (key === 'async') return;
        element[key] = attributes[key];
      });
      element.addEventListener('load', () => resolve(element), { once: true });
      element.addEventListener('error', () => reject(new Error(`failed to load ${url}`)), { once: true });
      documentRef.head.appendChild(element);
    });
    scripts.set(url, promise);
    promise.catch(() => scripts.delete(url));
    return promise;
  }

  function style(href, attributes = {}) {
    const url = versionAsset(href, resolveAsset(root, href), version);
    if (!url) return Promise.reject(new TypeError('[stellar runtime] style URL is required'));
    if (styles.has(url)) return styles.get(url);
    const promise = new Promise((resolve, reject) => {
      const element = documentRef.createElement('link');
      element.rel = 'stylesheet';
      element.href = url;
      Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
      element.addEventListener('load', () => resolve(element), { once: true });
      element.addEventListener('error', () => reject(new Error(`failed to load ${url}`)), { once: true });
      documentRef.head.appendChild(element);
    });
    styles.set(url, promise);
    promise.catch(() => styles.delete(url));
    return promise;
  }

  return Object.freeze({ script, style, resolve: value => resolveAsset(root, value) });
}
