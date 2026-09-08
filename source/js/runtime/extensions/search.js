const { searchCacheKey, clearSearchStorage } = await import(`../request-cache.js${new URL(import.meta.url).search}`);

export async function mount(root, context) {
  const config = context.extension.config;
  const assets = context.assets;
  if (config.provider === 'algolia') {
    window.searchConfig = Object.assign({}, config.options, {
      js: config.assets.client,
      hitsPerPage: 100
    });
    await assets.script(config.assets.client);
    await assets.script(config.assets.provider);
  } else if (config.provider === 'local') {
    await assets.script(config.assets.provider);
  }
  await assets.script(config.assets.shortcut);
  context.signal?.throwIfAborted();
  const providerCleanup = config.provider === 'algolia'
    ? window.stellarAlgoliaSearch?.mount?.(root)
    : window.stellarLocalSearch?.mount?.(root, { key: searchCacheKey, clear: clearSearchStorage });
  const shortcutCleanup = window.stellarSearchShortcut?.mount?.(root);
  return () => {
    shortcutCleanup?.();
    providerCleanup?.();
  };
}
