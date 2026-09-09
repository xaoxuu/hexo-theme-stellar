const RUNTIME_CONFIG_ID = 'stellar-runtime-config';
const RUNTIME_QUERY = new URL(import.meta.url).search;
let validateDeclaration;

function readManifest(documentRef) {
  const element = documentRef.getElementById(RUNTIME_CONFIG_ID);
  const manifest = JSON.parse(element?.textContent || 'null');
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.extensions)
    || manifest.extensions.some(entry => !['document', 'region'].includes(entry.scope))) {
    throw new TypeError('[stellar runtime] invalid manifest');
  }
  manifest.extensions.forEach(validateDeclaration);
  return manifest;
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
  validateDeclaration = registryModule.validateDeclaration;
  let manifest = readManifest(document);
  const assets = assetModule.createAssetLoader({ document, root: manifest.root, version: RUNTIME_QUERY });
  const request = requestModule.createRequestClient({ cache: manifest.policy.cache, policy: manifest.policy.request, dispatch });
  adapterModule.installLegacyRequestAdapter(globalThis.utils, request, manifest.policy.request);
  const mounted = new Map();
  const teardowns = new WeakMap();
  let hidden = false;
  const regionRoots = () => {
    const regions = [...document.querySelectorAll('[data-stellar-runtime-region]')];
    // Preserve enhancement of body injections without adding layout wrappers.
    for (const element of document.body.children) {
      if (!element.matches('script, style, link') && !regions.some(region => element === region || element.contains(region))) regions.push(element);
    }
    return regions;
  };
  const pageRoots = () => [document.getElementById('main'), document.getElementById('rightbar-region')].filter(Boolean);
  const runtime = {
    readManifest,
    async unmountPage() { await Promise.all(pageRoots().map(unmount)); },
    async mountPage(nextManifest) {
      manifest = nextManifest;
      await Promise.all(pageRoots().map(root => mount(root, 'region')));
    }
  };
  function context() {
    return Object.freeze({ manifest, assets, request, runtime,
      legacy: Object.freeze({ ctx: globalThis.ctx, stellar: globalThis.stellar }) });
  }
  async function unmount(root) {
    const instance = mounted.get(root);
    mounted.delete(root);
    if (!instance) return teardowns.get(root);
    const pending = instance.unmount(root);
    teardowns.set(root, pending);
    await pending;
    if (teardowns.get(root) === pending) teardowns.delete(root);
  }
  async function mount(root, scope) {
    await teardowns.get(root);
    if (hidden || mounted.has(root)) return;
    const registry = registryModule.createExtensionRegistry({ onError(detail) {
      console.error(`[stellar extension:${detail.id}] ${detail.phase} failed`, detail.error);
      dispatch('stellar:extension-error', detail);
    } });
    manifest.extensions.filter(entry => entry.scope === scope).forEach(entry => registry.register({
      ...entry, module: `${assets.resolve(entry.module)}${RUNTIME_QUERY}`
    }));
    mounted.set(root, registry);
    await registry.mount(root, context());
  }
  window.addEventListener('pagehide', () => {
    hidden = true;
    void Promise.all([...mounted.keys()].map(unmount));
  });
  window.addEventListener('pageshow', event => {
    hidden = false;
    if (event.persisted) void Promise.all([mount(document, 'document'), ...regionRoots().map(root => mount(root, 'region'))]);
  });
  await Promise.all([mount(document, 'document'), ...regionRoots().map(root => mount(root, 'region'))]);
}

start().catch(error => {
  console.error('[stellar runtime] bootstrap failed', error);
  dispatch('stellar:runtime-error', { error });
});
