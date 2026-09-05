const RUNTIME_CONFIG_ID = 'stellar-runtime-config';
const RUNTIME_QUERY = new URL(import.meta.url).search;

function deepFreeze(value) {
  if (value == null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function readManifest(documentRef) {
  const element = documentRef.getElementById(RUNTIME_CONFIG_ID);
  if (!element) throw new Error(`[stellar runtime] missing #${RUNTIME_CONFIG_ID}`);
  const manifest = JSON.parse(element.textContent || 'null');
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.extensions)) {
    throw new TypeError('[stellar runtime] invalid manifest');
  }
  return deepFreeze(manifest);
}

function dispatch(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

async function start() {
  const [assetModule, registryModule, adapterModule, requestModule] = await Promise.all([
    import(`./asset-loader.js${RUNTIME_QUERY}`),
    import(`./extension-registry.js${RUNTIME_QUERY}`),
    import(`./legacy-request-adapter.js${RUNTIME_QUERY}`),
    import(`./request-cache.js${RUNTIME_QUERY}`)
  ]);
  const { createAssetLoader } = assetModule;
  const { createExtensionRegistry } = registryModule;
  const { installLegacyRequestAdapter } = adapterModule;
  const { createRequestClient } = requestModule;
  const manifest = readManifest(document);
  const assets = createAssetLoader({ document, root: manifest.root, version: RUNTIME_QUERY });
  const request = createRequestClient({
    cache: manifest.policy.cache,
    policy: manifest.policy.request,
    dispatch
  });
  installLegacyRequestAdapter(globalThis.utils, request, manifest.policy.request);

  const registry = createExtensionRegistry({
    onError(detail) {
      console.error(`[stellar extension:${detail.id}] ${detail.phase} failed`, detail.error);
      dispatch('stellar:extension-error', detail);
    }
  });
  manifest.extensions.forEach(declaration => {
    registry.register(Object.assign({}, declaration, {
      module: `${assets.resolve(declaration.module)}${RUNTIME_QUERY}`
    }));
  });

  const context = Object.freeze({
    manifest,
    assets,
    request,
    legacy: Object.freeze({
      ctx: globalThis.ctx,
      stellar: globalThis.stellar
    })
  });
  await registry.mount(document, context);
  window.addEventListener('pagehide', () => registry.unmount(document), { once: true });
}

start().catch(error => {
  console.error('[stellar runtime] bootstrap failed', error);
  dispatch('stellar:runtime-error', { error });
});
