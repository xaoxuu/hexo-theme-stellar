const { readImageColor } = await import(`../image-color.js${new URL(import.meta.url).search}`);

function queryAll(root, selector) { return Array.from(root.querySelectorAll(selector)); }

export async function mount(root, context) {
  const config = context.extension.config;
  await context.assets.script(config.assets.colorJs);
  context.signal?.throwIfAborted();
  window.stellar.color.getAverageColor = (image, options = {}) => readImageColor(image, options)
    .then(raw => window.stellar.color.fromHsla(raw));
  await context.assets.script(config.assets.js);
  context.signal?.throwIfAborted();
  return window.stellarAdaptiveText?.mount?.(queryAll(root, '[data-text-adaptive]')) || (() => {});
}
