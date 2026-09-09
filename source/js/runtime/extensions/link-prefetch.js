export async function mount(root, context) {
  await context.assets.script(context.extension.config.asset);
  window.flyingPages({ delay: 0, ignoreKeywords: [], maxRPS: 5, hoverDelay: 25 });
  return () => {};
}
