const SELECTOR = 'img.lazy[data-src]';

export async function mount(root, context) {
  let instance;
  let active = true;
  const tracked = new Set();
  // LazyLoad 19.1 destroy() disconnects observers but leaves pending image
  // listeners installed. Release them without restoring placeholder sources.
  function releaseListeners(image) {
    for (const [name, listener] of Object.entries(image.llEvLisnrs || {})) {
      image.removeEventListener(name, listener);
    }
    delete image.llEvLisnrs;
  }
  function update() {
    if (!active || !instance) return;
    const pending = Array.from(root.querySelectorAll(SELECTOR)).filter(image =>
      !image.classList.contains('loaded') && !image.classList.contains('error') &&
      !image.dataset.stellarFallbackTried
    );
    pending.forEach(image => tracked.add(image));
    instance.update(pending);
  }
  const cleanup = window.stellarImages.mount(root, update);
  const destroy = () => {
    if (!active) return;
    active = false;
    cleanup();
    for (const image of tracked) {
      releaseListeners(image);
      // Preserve visible state for navigation snapshots and BFCache.
      if (!image.classList.contains('loaded') && !image.classList.contains('error')) image.removeAttribute('data-ll-status');
    }
    instance?.destroy?.();
    if (window.lazyLoadInstance === instance) delete window.lazyLoadInstance;
    instance = null;
  };
  context.onCleanup?.(destroy);
  try {
    await context.assets.script(context.extension.config.asset);
    context.signal?.throwIfAborted();
    if (!active) return destroy;
    if (typeof window.LazyLoad !== 'function') throw new Error('LazyLoad resource did not provide a constructor');
    instance = new window.LazyLoad({
      container: root,
      elements_selector: SELECTOR,
      use_native: false,
      cancel_on_exit: false,
      unobserve_entered: true,
      callback_loaded(image) {
        if (active) image.parentElement?.querySelector('.lazy-icon')?.remove();
      },
      callback_error(image) {
        // Let the vendor finish its one-shot listener cleanup before retrying.
        queueMicrotask(() => {
          if (active && !image.hasAttribute('onerror')) window.stellarImageError(image);
        });
      }
    }, []);
    window.lazyLoadInstance = instance;
    update();
  } catch (error) {
    if (active && !context.signal?.aborted) {
      window.stellarImages.fallback(root);
      context.reportError(error);
    }
  }
  return destroy;
}
