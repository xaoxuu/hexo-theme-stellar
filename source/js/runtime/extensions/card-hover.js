export async function mount(root, context) {
  await context.assets.script(context.extension.config.assets.js);
  context.signal?.throwIfAborted();
  window.stellar?.cardHover?.mountAll?.(root, context.extension.config);
  return () => window.stellar?.cardHover?.unmountAll?.(root, context.extension.config);
}
