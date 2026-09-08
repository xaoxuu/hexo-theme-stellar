function queryAll(root, selector) { return Array.from(root.querySelectorAll(selector)); }

export async function mount(root, context) {
  const config = context.extension.config;
  if (typeof window.MathJax?.typesetPromise === 'function') {
    await window.MathJax.typesetPromise([root.nodeType === 9 ? root.body : root]);
    return;
  }
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
          if (context.signal?.aborted) return;
          queryAll(root, 'mjx-container').forEach(element => element.parentNode?.classList.add('has-jax'));
        });
      }
    }
  };
  await context.assets.script(config.asset);
  return () => {};
}
