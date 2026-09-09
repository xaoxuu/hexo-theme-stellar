function queryAll(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

export async function mount(root, context) {
  const config = context.extension.config;
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
    context.signal?.throwIfAborted();
    if (!instance && typeof window.LazyLoad === 'function') instance = new window.LazyLoad(lazyLoadOptions);
    window.lazyLoadInstance = instance;
    instance?.update?.();
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
