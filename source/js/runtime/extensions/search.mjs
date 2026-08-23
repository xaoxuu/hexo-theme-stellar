export async function mount(root, context) {
  const config = context.extension.config;
  const assets = context.assets;
  if (config.provider === 'algolia') {
    window.searchConfig = Object.assign({}, config.options, {
      js: config.algoliaAsset,
      hitsPerPage: 100
    });
    await assets.script(config.algoliaAsset);
    await assets.script('/js/search/algolia-search.js');
  } else if (config.provider === 'local') {
    await assets.script('/js/search/local-search.js');
  }
  await assets.script('/js/search/shortcut.js');
  const providerCleanup = config.provider === 'algolia'
    ? window.stellarAlgoliaSearch?.mount?.(root)
    : window.stellarLocalSearch?.mount?.(root);
  const shortcutCleanup = window.stellarSearchShortcut?.mount?.(root);
  return () => {
    shortcutCleanup?.();
    providerCleanup?.();
  };
}
