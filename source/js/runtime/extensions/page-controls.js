export async function mount(root, context) {
  if (root.querySelector(".tag-subtree")) {
    await context.assets.script(context.extension.config.tagtree);
    context.signal.throwIfAborted();
    window.stellar?.mountTagtree?.(root, context.signal);
  }
  const cleanup = window.stellar?.initPage?.(root);
  if (typeof cleanup === 'function') context.onCleanup(cleanup);
  if (root.id === 'main' && new URLSearchParams(location.search).has('kw')) {
    await context.assets.script(context.extension.config.highlight);
    context.signal.throwIfAborted();
    window.stellar.highlightKeyword?.();
  }
}
