function queryAll(root, selector) { return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)]; }

export async function mount(root, context) {
  const config = context.extension.config;
  const messages = config.messages || {};
  const policy = context.manifest.policy.features;
  context.legacy.ctx.copycode = {
    label: messages.label || '',
    copied: messages.copied || '',
    denied: messages.denied || '',
    unsupported: messages.unsupported || '',
    toast_ms: policy.codeCopyToastMs
  };
  await context.assets.script(config.assets.js);
  context.signal?.throwIfAborted();
  const elements = queryAll(root, '.code');
  window.createCopyButtons?.(elements);
  return () => elements.forEach(element => element.querySelector('.copy-btn')?.remove());
}
