function queryAll(root, selector) { return Array.from(root.querySelectorAll(selector)); }

export async function mount(root, context) {
  const config = context.extension.config;
  await context.assets.style(config.assets.css);
  context.signal?.throwIfAborted();
  await context.assets.script(config.assets.js);
  context.signal?.throwIfAborted();
  const heti = new window.Heti('.heti');
  queryAll(root, heti.rootSelector).forEach(element => heti.spacingElement(element));
  return () => {};
}
