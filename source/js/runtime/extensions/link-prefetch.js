export async function mount(root, context) {
  window.FPConfig = { delay: 0, ignoreKeywords: [], maxRPS: 5, hoverDelay: 25 };
  await context.assets.script(context.extension.config.asset);
  return () => {};
}
