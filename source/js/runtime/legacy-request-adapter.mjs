export function installLegacyRequestAdapter(utils, client) {
  if (!utils || typeof utils !== 'object') {
    throw new TypeError('[stellar runtime] utils is required for the data-service adapter');
  }
  const loaded = new WeakSet();

  function serviceId(element, options) {
    if (typeof options?.service === 'string' && options.service.length > 0) return options.service;
    const match = String(element?.className || '').match(/\bds-([\w-]+)\b/);
    return match?.[1] || null;
  }

  const request = function request(element, url, callback, onFailure, options = {}) {
    if (element && loaded.has(element)) return Promise.resolve(null);
    const requestOptions = Object.assign({ retries: 2, timeout: 5000 }, options, {
      service: serviceId(element, options),
      onNetworkStart: () => utils.onLoading?.(element)
    });
    return client.request(url, requestOptions).then(async response => {
      if (element) loaded.add(element);
      utils.onLoadSuccess?.(element);
      await callback(response);
      return response;
    }).catch(error => {
      utils.onLoadFailure?.(element);
      onFailure?.(error);
      throw error;
    });
  };

  const requestWithoutLoading = function requestWithoutLoading(url, options = {}, maxRetry = 2, timeout = 5000) {
    return client.request(url, Object.assign({}, options, {
      retries: maxRetry,
      timeout
    }));
  };
  utils.request = request;
  utils.requestWithoutLoading = requestWithoutLoading;
  const bridge = globalThis.__stellarRequestBridge;
  if (bridge && typeof bridge.resolve === 'function') {
    bridge.resolve(Object.freeze({ request, requestWithoutLoading }));
    delete bridge.resolve;
  }
}
