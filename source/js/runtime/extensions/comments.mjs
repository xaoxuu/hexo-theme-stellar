function viewportLoad(element, callback, enabled = true, onError = () => {}) {
  let active = true;
  const run = () => Promise.resolve()
    .then(() => callback(() => active))
    .catch(error => {
      if (active) onError(error);
    });
  if (!enabled || !('IntersectionObserver' in window)) {
    run();
    return () => { active = false; };
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      run();
    }
  });
  observer.observe(element);
  return () => {
    active = false;
    observer.disconnect();
  };
}

function copyAttributes(source, target) {
  Array.from(source.attributes).forEach(attribute => {
    if (!['class', 'id'].includes(attribute.name)) target.setAttribute(attribute.name, attribute.value);
  });
}

function commentPath(element) {
  return element.getAttribute('comment_id') ?? decodeURI(window.location.pathname);
}

function uploadImage(options, tokenHeader, tokenValue, fieldName, responseField) {
  if (!options?.api) return null;
  return file => {
    const headers = new Headers({ Accept: 'application/json' });
    if (tokenValue) headers.set(tokenHeader || 'Authorization', tokenValue);
    const body = new FormData();
    body.append(fieldName || 'file', file);
    return fetch(options.api, { method: 'POST', body, headers })
      .then(response => response.json())
      .then(response => response[responseField]);
  };
}

async function mountArtalk(root, context, config) {
  const element = root.querySelector('#artalk_container');
  if (!element) return;
  const targeted = /[?&]atk_comment=\d+/.test(window.location.search) || /#atk-comment-\d+/.test(window.location.hash);
  let instance = null;
  let historyTimer = null;
  const cleanupViewport = viewportLoad(element, async isActive => {
    await Promise.all([
      context.assets.style('/css/comments/artalk.css'),
      context.assets.style(config.assets.css),
      context.assets.script(config.assets.js)
    ]);
    if (!isActive()) return;
    const match = window.location.search.match(/[?&]atk_comment=(\d+)/);
    if (match && !/#atk-comment-\d+/.test(window.location.hash)) {
      const params = new URLSearchParams(window.location.search);
      const notifyKey = params.get('atk_notify_key');
      const query = notifyKey ? `?atk_notify_key=${encodeURIComponent(notifyKey)}` : '';
      history.replaceState(null, '', `${window.location.pathname}${query}#atk-comment-${match[1]}`);
    }
    const options = Object.assign({}, config.options, {
      el: '#artalk_container',
      pageKey: commentPath(element),
      pageTitle: config.pageTitle
    });
    const uploader = uploadImage(config.options.imageUploader, 'Authorization', config.options.imageUploader?.token, 'file', config.options.imageUploader?.resp);
    if (uploader) options.imgUploader = uploader;
    instance = window.Artalk.init(options);
    if (targeted && window.location.search.includes('atk_')) {
      instance.on('list-loaded', () => {
        if (historyTimer !== null) clearTimeout(historyTimer);
        historyTimer = setTimeout(() => {
          historyTimer = null;
          history.replaceState(null, '', window.location.pathname + window.location.hash);
        }, 0);
      });
    }
  }, !targeted, error => context.reportError(error));
  return () => {
    cleanupViewport();
    if (historyTimer !== null) clearTimeout(historyTimer);
    historyTimer = null;
    instance?.destroy?.();
  };
}

function mountEmbed(root, provider, src, context) {
  const element = root.querySelector(`#comments #${provider}`);
  if (!element) return;
  let script = null;
  let cancelLoad = null;
  const cleanupViewport = viewportLoad(element, isActive => new Promise((resolve, reject) => {
    element.replaceChildren();
    script = element.ownerDocument.createElement('script');
    script.src = src;
    script.async = true;
    copyAttributes(element, script);
    let settled = false;
    const finish = callback => {
      if (settled) return;
      settled = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
      cancelLoad = null;
      callback();
    };
    const onLoad = () => finish(resolve);
    const onError = () => finish(() => reject(new Error(`${provider} comment embed failed to load`)));
    cancelLoad = () => finish(resolve);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!isActive()) {
      cancelLoad();
      return;
    }
    element.appendChild(script);
  }), true, error => context.reportError(error));
  return () => {
    cleanupViewport();
    cancelLoad?.();
    script?.remove();
  };
}

function mountTwikoo(root, context, config) {
  const element = root.querySelector('#twikoo_container');
  if (!element) return;
  let instance = null;
  const cleanupViewport = viewportLoad(element, async isActive => {
    await context.assets.style('/css/comments/twikoo.css');
    await context.assets.script(config.assets.js);
    if (!isActive()) return;
    const created = await window.twikoo.init(Object.assign({}, config.options, {
      el: '#twikoo_container',
      path: commentPath(element)
    }));
    if (!isActive()) created?.destroy?.();
    else instance = created;
  }, true, error => context.reportError(error));
  return () => {
    cleanupViewport();
    instance?.destroy?.();
  };
}

function mountWaline(root, context, config) {
  const element = root.querySelector('#waline_container');
  if (!element) return;
  let instance = null;
  const cleanupViewport = viewportLoad(element, async isActive => {
    await Promise.all([
      context.assets.style('/css/comments/waline.css'),
      context.assets.style(config.assets.css),
      context.assets.style(config.assets.metaCss)
    ]);
    const module = await import(config.assets.js);
    if (!isActive()) return;
    const options = Object.assign({}, config.options, {
      el: '#waline_container',
      path: commentPath(element)
    });
    const uploader = uploadImage(
      config.options.imageUploader,
      config.options.imageUploader?.tokenName,
      config.options.imageUploader?.token,
      config.options.imageUploader?.fileName,
      config.options.imageUploader?.resp
    );
    if (uploader) options.imageUploader = uploader;
    instance = module.init(options);
  }, true, error => context.reportError(error));
  return () => {
    cleanupViewport();
    instance?.destroy?.();
  };
}

export async function mount(root, context) {
  const config = context.extension.config;
  switch (config.provider) {
    case 'artalk': return mountArtalk(root, context, config);
    case 'beaudar':
      await context.assets.style('/css/comments/beaudar.css');
      return mountEmbed(root, 'beaudar', 'https://beaudar.lipk.org/client.js', context);
    case 'giscus': return mountEmbed(root, 'giscus', config.assets.js, context);
    case 'utterances':
      await context.assets.style('/css/comments/utterances.css');
      return mountEmbed(root, 'utterances', 'https://utteranc.es/client.js', context);
    case 'twikoo': return mountTwikoo(root, context, config);
    case 'waline': return mountWaline(root, context, config);
    default: throw new TypeError(`unknown comment provider ${config.provider}`);
  }
}
