export async function mount(root, context) {
  await context.assets.script(context.extension.config.assets.js);
  window.stellar?.cardHover?.mountAll?.(root);
  return () => window.stellar?.cardHover?.unmountAll?.(root);
}
