export const REQUEST_CACHE_PREFIX = 'Stellar.request-cache.v2.';

function responseFrom(entry) {
  return new Response(entry.text, {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': entry.contentType || 'application/json' }
  });
}

function requestKey(url, options) {
  return `${options?.method || 'GET'} ${url}`;
}

function utf8Bytes(value) {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).byteLength;
  return value.length;
}

export function createRequestClient(options = {}) {
  const policy = options.policy;
  if (!policy || !Number.isInteger(policy.retries) || !(policy.timeoutMs > 0) || !(policy.idleTimeoutMs > 0) || !(policy.maxCacheEntryBytes > 0)) {
    throw new TypeError('[stellar runtime] request policy is required');
  }
  const fetchImpl = options.fetch || globalThis.fetch?.bind(globalThis);
  const storage = options.storage || globalThis.localStorage;
  const now = options.clock || Date.now;
  const schedule = options.scheduler || (fn => {
    if (typeof globalThis.requestIdleCallback === 'function') {
      globalThis.requestIdleCallback(fn, { timeout: policy.idleTimeoutMs });
    } else {
      setTimeout(fn, 0);
    }
  });
  const dispatch = typeof options.dispatch === 'function' ? options.dispatch : () => {};
  const config = options.cache;
  if (!config || typeof config.enabled !== 'boolean' || !(config.defaultTtl >= 0) || !config.ttl || !(config.maxEntries >= 0)) {
    throw new TypeError('[stellar runtime] cache policy is required');
  }
  const pending = new Map();
  let cacheEnabled = config.enabled === true;

  if (typeof fetchImpl !== 'function') throw new TypeError('[stellar runtime] fetch is required');

  function serviceTtl(service) {
    const value = service && config.ttl?.[service] != null ? config.ttl[service] : config.defaultTtl;
    return typeof value === 'number' && value > 0 ? value : 0;
  }

  function shouldCache(url, requestOptions) {
    if (!cacheEnabled || requestOptions.cache === false || requestOptions.cache === 'no-store') return false;
    if ((requestOptions.method || 'GET') !== 'GET') return false;
    return !/[?&]t=\d{10,}/.test(url);
  }

  function read(url) {
    try {
      const raw = storage?.getItem(REQUEST_CACHE_PREFIX + url);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || typeof entry.text !== 'string' || typeof entry.ts !== 'number' || typeof entry.ttl !== 'number') return null;
      return entry;
    } catch (error) {
      void error;
      return null;
    }
  }

  function keys() {
    const result = [];
    if (!storage) return result;
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(REQUEST_CACHE_PREFIX)) result.push(key);
    }
    return result;
  }

  function evictOldest(exceptKey = '') {
    const candidates = keys().filter(key => key !== exceptKey).map(key => {
      let ts = 0;
      try {
        ts = JSON.parse(storage.getItem(key) || 'null')?.ts || 0;
      } catch (error) {
        void error;
      }
      return { key, ts };
    }).sort((left, right) => left.ts - right.ts);
    if (candidates[0]) storage.removeItem(candidates[0].key);
  }

  function trim() {
    const all = keys().map(key => {
      let ts = 0;
      try {
        ts = JSON.parse(storage.getItem(key) || 'null')?.ts || 0;
      } catch (error) {
        void error;
      }
      return { key, ts };
    }).sort((left, right) => left.ts - right.ts);
    while (all.length > config.maxEntries) storage.removeItem(all.shift().key);
  }

  function write(url, text, contentType, ttl) {
    if (!storage || !(ttl > 0) || utf8Bytes(text) > policy.maxCacheEntryBytes) return;
    const key = REQUEST_CACHE_PREFIX + url;
    const value = JSON.stringify({ text, contentType, ts: now(), ttl });
    try {
      storage.setItem(key, value);
      trim();
    } catch (error) {
      void error;
      try {
        evictOldest(key);
        storage.setItem(key, value);
        trim();
      } catch (error) {
        void error;
        cacheEnabled = false;
      }
    }
  }

  function isFresh(entry) {
    return !!entry && entry.ttl > 0 && now() - entry.ts < entry.ttl * 1000;
  }

  function sharedFetch(url, requestOptions, timeout) {
    const key = requestKey(url, requestOptions);
    if (pending.has(key)) return pending.get(key).then(response => response.clone());
    dispatch('stellar:request-start', { key });
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    const fetchOptions = Object.assign({}, requestOptions);
    delete fetchOptions.service;
    delete fetchOptions.retries;
    delete fetchOptions.timeout;
    delete fetchOptions.onNetworkStart;
    if (fetchOptions.cache === false) delete fetchOptions.cache;
    const callerSignal = fetchOptions.signal;
    let removeCallerAbort = null;
    if (controller) {
      const abortFromCaller = () => controller.abort(callerSignal?.reason);
      if (callerSignal?.aborted) abortFromCaller();
      else if (callerSignal?.addEventListener) {
        callerSignal.addEventListener('abort', abortFromCaller, { once: true });
        removeCallerAbort = () => callerSignal.removeEventListener('abort', abortFromCaller);
      }
      fetchOptions.signal = controller.signal;
    }
    const promise = Promise.resolve(fetchImpl(url, fetchOptions)).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    }).finally(() => {
      if (timer !== null) clearTimeout(timer);
      removeCallerAbort?.();
      pending.delete(key);
      dispatch('stellar:request-end', { key });
    });
    pending.set(key, promise);
    return promise.then(response => response.clone());
  }

  async function request(url, requestOptions = {}) {
    const ttl = serviceTtl(requestOptions.service);
    const cacheable = shouldCache(url, requestOptions) && ttl > 0;
    const cached = cacheable ? read(url) : null;
    if (isFresh(cached)) return responseFrom(cached);
    if (typeof requestOptions.onNetworkStart === 'function') requestOptions.onNetworkStart();

    const retries = Number.isInteger(requestOptions.retries) ? requestOptions.retries : policy.retries;
    const timeout = typeof requestOptions.timeout === 'number' ? requestOptions.timeout : policy.timeoutMs;
    let error;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await sharedFetch(url, requestOptions, timeout);
        if (cacheable) {
          const clone = response.clone();
          const contentType = clone.headers.get('Content-Type') || 'application/json';
          schedule(() => clone.text().then(text => write(url, text, contentType, ttl)).catch(() => {}));
        }
        return response;
      } catch (caught) {
        error = caught;
      }
    }
    if (cached) return responseFrom(cached);
    throw error;
  }

  return Object.freeze({ request });
}
