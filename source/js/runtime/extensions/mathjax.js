let typesetting = Promise.resolve();

export async function mount(root, context) {
  if (typeof window.MathJax?.typesetPromise !== 'function') {
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']], processEscapes: true },
      startup: { typeset: false }
    };
    await context.assets.script(context.extension.config.asset);
  }
  await window.MathJax.startup?.promise;
  context.signal.throwIfAborted();
  const operation = typesetting.catch(() => {}).then(async () => {
    context.signal.throwIfAborted();
    await window.MathJax.typesetPromise([root]);
    if (!context.signal.aborted) root.querySelectorAll('mjx-container').forEach(node => node.parentElement?.classList.add('has-jax'));
  });
  typesetting = operation;
  context.onCleanup(async () => {
    await operation.catch(() => {});
    window.MathJax.typesetClear?.([root]);
  });
  await operation;
}
