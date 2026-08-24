function queryAll(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

const legacyAdapterPromises = new Map();

function loadLegacyAdapter(context, asset, feature) {
  if (legacyAdapterPromises.has(feature)) return legacyAdapterPromises.get(feature);
  const promise = (async () => {
    let adapter = null;
    const onReady = event => {
      if (event.detail?.feature === feature && typeof event.detail.mount === 'function') {
        adapter = event.detail;
      }
    };
    globalThis.addEventListener('stellar:legacy-feature-ready', onReady);
    try {
      await context.assets.script(asset);
    } finally {
      globalThis.removeEventListener('stellar:legacy-feature-ready', onReady);
    }
    if (!adapter) {
      throw new TypeError(`[stellar runtime] legacy feature ${feature} did not register mount(root)`);
    }
    return adapter;
  })();
  legacyAdapterPromises.set(feature, promise);
  promise.catch(() => legacyAdapterPromises.delete(feature));
  return promise;
}

async function mountLegacyAsset(root, context, asset, feature) {
  const adapter = await loadLegacyAdapter(context, asset, feature);
  const cleanup = adapter.mount(root);
  return typeof cleanup === 'function' ? cleanup : () => {};
}

async function mountLazyLoading(root, context, config) {
  if (root.nodeType !== 9) {
    throw new TypeError('[stellar runtime] lazy-loading compatibility adapter requires a document root');
  }
  const ownerDocument = root.ownerDocument || root;
  let instance = null;
  const wrapLazyloadImages = container => {
    const target = typeof container === 'string' ? root.querySelector(container) : container;
    if (!target) return;
    queryAll(target, 'img').forEach(image => {
      if (image.classList.contains('lazy')) return;
      const src = image.getAttribute('src');
      if (!src) return;
      const wrapper = ownerDocument.createElement('div');
      wrapper.className = 'lazy-box';
      const lazyImage = image.cloneNode();
      lazyImage.removeAttribute('src');
      lazyImage.setAttribute('data-src', src);
      lazyImage.classList.add('lazy');
      const icon = ownerDocument.createElement('div');
      icon.className = 'lazy-icon';
      wrapper.append(lazyImage, icon);
      image.replaceWith(wrapper);
    });
    instance?.update?.();
  };
  window.wrapLazyloadImages = wrapLazyloadImages;
  const onInitialized = event => {
    instance = event.detail.instance;
    window.lazyLoadInstance = instance;
  };
  const lazyLoadOptions = {
    elements_selector: '.lazy',
    callback_loaded(element) {
      element.classList.add('loaded');
      const wrapper = element.closest('.lazy-box') || element.parentElement;
      wrapper?.querySelector('.lazy-icon')?.remove();
    }
  };
  window.lazyLoadOptions = lazyLoadOptions;
  window.addEventListener('LazyLoad::Initialized', onInitialized);
  const observer = new MutationObserver(mutations => {
    const found = mutations.some(mutation => Array.from(mutation.addedNodes).some(node =>
      node.nodeType === 1 && (node.matches?.('.lazy') || node.querySelector?.('.lazy'))
    ));
    if (found) instance?.update?.();
  });
  observer.observe(root.documentElement || root, { childList: true, subtree: true });
  const cleanup = () => {
    observer.disconnect();
    window.removeEventListener('LazyLoad::Initialized', onInitialized);
    if (window.wrapLazyloadImages === wrapLazyloadImages) delete window.wrapLazyloadImages;
    if (window.lazyLoadOptions === lazyLoadOptions) delete window.lazyLoadOptions;
    instance?.destroy?.();
    if (window.lazyLoadInstance === instance) delete window.lazyLoadInstance;
    instance = null;
  };
  try {
    await context.assets.script(config.asset);
    instance?.update?.();
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}

async function mountLightbox(root, context, config) {
  let selector = '[data-fancybox]:not(.error), .with-fancybox .atk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .tk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .wl-content img:not([atk-emoticon]):not([class*="emo"])';
  if (config.selector) selector += `, ${config.selector}`;
  await Promise.all([
    context.assets.style(config.assets.localCss),
    context.assets.style(config.assets.css),
    context.assets.script(config.assets.js)
  ]);
  const options = {
    hideScrollbar: false,
    Thumbs: { autoStart: false },
    caption: (_instance, slide) => slide.triggerEl.alt || slide.triggerEl.dataset.caption || null
  };
  const isDocumentRoot = root.nodeType === 9;
  if (isDocumentRoot) {
    window.Fancybox.bind(selector, options);
  } else {
    window.Fancybox.bind(root, selector, options);
  }
  return () => {
    if (isDocumentRoot) window.Fancybox?.unbind?.(selector);
    else window.Fancybox?.unbind?.(root, selector);
  };
}

async function mountReveal(root, context, config) {
  const elements = queryAll(root, '.slide-up');
  let fallbackApplied = false;
  const revealFallback = () => {
    if (fallbackApplied) return;
    fallbackApplied = true;
    document.documentElement.classList.add('sr-fallback');
  };
  const watchdog = setTimeout(revealFallback, context.manifest.policy.features.revealWatchdogMs);
  try {
    await context.assets.script(config.asset);
    if (typeof window.ScrollReveal !== 'function') throw new TypeError('ScrollReveal is unavailable');

    const findPinnedContainer = element => {
      let node = element;
      while (node?.nodeType === 1) {
        const position = window.getComputedStyle(node).position;
        if (position === 'sticky' || position === 'fixed') return node;
        node = node.parentElement;
      }
      return null;
    };
    const findScrollContainer = element => {
      let node = element.parentElement;
      while (node?.nodeType === 1) {
        const overflowY = window.getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
      }
      return null;
    };
    const pinnedGroups = new Map();
    const targets = [];
    elements.forEach(element => {
      const pinned = findPinnedContainer(element);
      if (!pinned) {
        targets.push(element);
        return;
      }
      const container = findScrollContainer(element) || pinned;
      const group = pinnedGroups.get(container) || [];
      group.push(element);
      pinnedGroups.set(container, group);
    });

    const instance = window.ScrollReveal();
    const options = {
      distance: config.distance,
      duration: config.durationMs,
      interval: config.intervalMs,
      scale: config.scale,
      opacity: 0,
      easing: 'ease-out'
    };
    if (targets.length > 0) instance.reveal(targets, options);
    pinnedGroups.forEach((group, container) => instance.reveal(group, Object.assign({}, options, { container })));
    clearTimeout(watchdog);
    return () => instance.clean?.(elements);
  } catch (error) {
    clearTimeout(watchdog);
    revealFallback();
    throw error;
  }
}

async function mountMathJax(root, context, config) {
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      processEscapes: true,
      skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    },
    startup: {
      ready() {
        window.MathJax.startup.defaultReady();
        window.MathJax.typesetPromise().then(() => {
          queryAll(root, 'mjx-container').forEach(element => element.parentNode?.classList.add('has-jax'));
        });
      }
    }
  };
  await context.assets.script(config.asset);
  return () => {};
}

async function mountDiagrams(root, context, config) {
  await context.assets.script(config.assets.js);
  const theme = config.colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : config.theme;
  window.mermaid.initialize({
    startOnLoad: false,
    theme,
    logLevel: 3,
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'linear' },
    gantt: { axisFormat: '%Y/%m/%d' },
    sequence: { actorMargin: 50 }
  });
  await window.mermaid.run({ nodes: queryAll(root, '.mermaid') });
  return () => {};
}

async function mountCodeCopy(root, context, config) {
  const messages = config.messages || {};
  const policy = context.manifest.policy.features;
  context.legacy.ctx.copycode = {
    default_text: messages.idle || '',
    success_text: messages.success || '',
    denied_text: messages.denied || '',
    unsupported_text: messages.unsupported || '',
    toast: messages.toast || '',
    feedback_ms: policy.codeCopyFeedbackMs,
    toast_ms: policy.codeCopyToastMs
  };
  await context.assets.script(config.assets.js);
  const elements = queryAll(root, '.code');
  window.createCopyButtons?.(elements);
  return () => elements.forEach(element => element.querySelector('.copy-btn')?.remove());
}

async function mountAdaptiveText(root, context, config) {
  await context.assets.script(config.assets.colorJs);
  await context.assets.script(config.assets.js);
  return window.stellarAdaptiveText?.mount?.(queryAll(root, '[data-text-adaptive]')) || (() => {});
}

async function mountCardHover(root, context, config) {
  await context.assets.script(config.assets.js);
  window.stellar?.cardHover?.mountAll?.(root);
  return () => window.stellar?.cardHover?.unmountAll?.(root);
}

async function mountHeti(root, context, config) {
  await context.assets.style(config.assets.css);
  await context.assets.script(config.assets.js);
  const heti = new window.Heti('.heti');
  queryAll(root, heti.rootSelector).forEach(element => heti.spacingElement(element));
  return () => {};
}

async function mountSwiper(root, context, config) {
  await Promise.all([
    context.assets.style(config.assets.localCss),
    context.assets.style(config.assets.css),
    context.assets.script(config.assets.js)
  ]);
  const element = root.querySelector('#swiper-api');
  const instance = new window.Swiper(element, {
    slidesPerView: 'auto',
    spaceBetween: 8,
    centeredSlides: true,
    effect: element?.getAttribute('effect') || '',
    rewind: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
  });
  return () => instance.destroy?.(true, true);
}

export async function mount(root, context) {
  const config = context.extension.config;
  switch (config.feature) {
    case 'lazy-loading': return mountLazyLoading(root, context, config);
    case 'deferred-icons': return mountLegacyAsset(root, context, config.asset, 'deferredIcons');
    case 'dropdown': return mountLegacyAsset(root, context, config.asset, 'dropdown');
    case 'link-prefetch':
      window.FPConfig = { delay: 0, ignoreKeywords: [], maxRPS: 5, hoverDelay: 25 };
      await context.assets.script(config.asset);
      return () => {};
    case 'lightbox': return mountLightbox(root, context, config);
    case 'reveal': return mountReveal(root, context, config);
    case 'mathjax': return mountMathJax(root, context, config);
    case 'diagrams': return mountDiagrams(root, context, config);
    case 'code-copy': return mountCodeCopy(root, context, config);
    case 'adaptive-text': return mountAdaptiveText(root, context, config);
    case 'card-hover': return mountCardHover(root, context, config);
    case 'heti': return mountHeti(root, context, config);
    case 'swiper': return mountSwiper(root, context, config);
    default: throw new TypeError(`unknown built-in feature ${config.feature}`);
  }
}
