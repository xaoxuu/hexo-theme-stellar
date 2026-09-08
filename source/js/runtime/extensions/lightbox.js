function queryAll(root, selector) { return Array.from(root.querySelectorAll(selector)); }

export async function mount(root, context) {
  const config = context.extension.config;
  let selector = '[data-fancybox]:not(.error), .with-fancybox .atk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .tk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .wl-content img:not([atk-emoticon]):not([class*="emo"])';
  if (config.selector) selector += `, ${config.selector}`;
  await Promise.all([
    context.assets.style(config.assets.localCss),
    context.assets.style(config.assets.css),
    context.assets.script(config.assets.js)
  ]);
  context.signal?.throwIfAborted();
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
