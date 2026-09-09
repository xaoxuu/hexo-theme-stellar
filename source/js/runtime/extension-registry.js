const PHASES = new Set(['import', 'mount', 'unmount']);

export function validateDeclaration(declaration) {
  if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration)) {
    throw new TypeError('[stellar runtime] extension declaration must be an object');
  }
  if (typeof declaration.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(declaration.id)) {
    throw new TypeError('[stellar runtime] extension id is invalid');
  }
  if (typeof declaration.module !== 'string' || declaration.module.length === 0) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} module is invalid`);
  }
  const unknown = Object.keys(declaration).filter(key => !['id', 'module', 'scope', 'when', 'config'].includes(key));
  if (unknown.length > 0) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} has unknown field ${unknown[0]}`);
  }
  if (!declaration.when || typeof declaration.when !== 'object' || Array.isArray(declaration.when)) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} when is invalid`);
  }
  const whenKeys = Object.keys(declaration.when);
  if (whenKeys.length !== 1 || !['always', 'selector'].includes(whenKeys[0])) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} must declare exactly one of always/selector`);
  }
  if (whenKeys[0] === 'always' && declaration.when.always !== true) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} when.always must be true`);
  }
  if (whenKeys[0] === 'selector' && (typeof declaration.when.selector !== 'string' || declaration.when.selector.length === 0)) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} when.selector is invalid`);
  }
  if (declaration.config == null || typeof declaration.config !== 'object' || Array.isArray(declaration.config)) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} config is invalid`);
  }
}

function shouldMount(root, when) {
  if (when?.always === true) return true;
  if (typeof when?.selector !== 'string' || when.selector.length === 0) return false;
  if (typeof root?.matches === 'function' && root.matches(when.selector)) return true;
  return typeof root?.querySelector === 'function' && root.querySelector(when.selector) !== null;
}

export function createExtensionRegistry(options = {}) {
  const importer = options.importer || (specifier => import(specifier));
  const onError = typeof options.onError === 'function' ? options.onError : () => {};
  const declarations = new Map();
  const modulePromises = new Map();
  const roots = new WeakMap();
  const teardowns = new WeakMap();

  function report(id, phase, error) {
    const detail = { id, phase: PHASES.has(phase) ? phase : 'mount', error };
    try {
      onError(detail);
    } catch (ignored) {
      void ignored;
    }
    return { id, status: 'failed', phase: detail.phase, error };
  }

  function register(declaration) {
    validateDeclaration(declaration);
    if (declarations.has(declaration.id)) {
      throw new TypeError(`[stellar runtime] duplicate extension id ${declaration.id}`);
    }
    declarations.set(declaration.id, Object.freeze({
      id: declaration.id,
      scope: declaration.scope,
      module: declaration.module,
      when: declaration.when || {},
      config: declaration.config || {}
    }));
  }

  async function load(declaration) {
    if (!modulePromises.has(declaration.module)) {
      const promise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`module import timed out: ${declaration.module}`)), options.timeoutMs || 15000);
        Promise.resolve().then(() => importer(declaration.module)).then(
          module => { clearTimeout(timer); resolve(module); },
          error => { clearTimeout(timer); reject(error); }
        );
      });
      modulePromises.set(declaration.module, promise);
      promise.catch(() => modulePromises.delete(declaration.module));
    }
    return modulePromises.get(declaration.module);
  }

  async function dispose(instance) {
    const cleanup = instance.cleanup;
    instance.cleanup = null;
    if (typeof cleanup !== 'function') return;
    try { await cleanup(); } catch (error) { report(instance.id, 'unmount', error); }
  }

  function unmount(root) {
    const state = roots.get(root);
    if (!state) return teardowns.get(root) || Promise.resolve([]);
    roots.delete(root);
    state.controller.abort();
    const previous = teardowns.get(root);
    const pending = Promise.resolve(previous).then(async () => {
      const results = [];
      for (const instance of state.instances.slice().reverse()) {
        await dispose(instance);
        results.push({ id: instance.id, status: 'unmounted' });
      }
      return results;
    });
    teardowns.set(root, pending);
    pending.finally(() => { if (teardowns.get(root) === pending) teardowns.delete(root); });
    return pending;
  }

  async function mount(root, context = {}) {
    if (!root || typeof root !== 'object') throw new TypeError('[stellar runtime] mount root must be an object');
    // Invalidate synchronously before yielding, so overlapping mounts cannot both own a root.
    const previous = unmount(root);
    const state = { controller: new AbortController(), instances: [] };
    roots.set(root, state);
    await previous;
    const signal = state.controller.signal;
    const active = () => !signal.aborted && roots.get(root) === state;
    return Promise.all([...declarations.values()].map(async declaration => {
      const skipped = { id: declaration.id, status: 'skipped' };
      if (!active()) return skipped;
      try { if (!shouldMount(root, declaration.when)) return skipped; }
      catch (error) { return report(declaration.id, 'mount', error); }
      let module;
      try { module = await load(declaration); }
      catch (error) { return active() ? report(declaration.id, 'import', error) : skipped; }
      if (!active()) return skipped;
      if (typeof module?.mount !== 'function') return report(declaration.id, 'mount', new TypeError('module must export mount(root, context)'));
      const instance = { id: declaration.id, cleanup: null };
      state.instances.push(instance);
      const registered = new Set();
      const completed = new Set();
      const cleanup = async () => {
        for (const fn of [...registered].reverse()) {
          registered.delete(fn);
          completed.add(fn);
          try { await fn(); } catch (error) { report(declaration.id, 'unmount', error); }
        }
      };
      instance.cleanup = cleanup;
      const extensionContext = Object.freeze(Object.assign({}, context, {
        extension: declaration,
        signal,
        assets: context.assets?.scoped ? context.assets.scoped(signal) : context.assets,
        onCleanup(fn) {
          if (typeof fn !== 'function' || completed.has(fn)) return;
          registered.add(fn);
          if (!active()) void cleanup();
        },
        reportError(error, phase = 'mount') { if (active()) return report(declaration.id, phase, error); }
      }));
      try {
        const result = await module.mount(root, extensionContext);
        if (typeof result === 'function' && !completed.has(result)) registered.add(result);
        if (!active()) { await cleanup(); return skipped; }
        return { id: declaration.id, status: 'mounted' };
      } catch (error) {
        await dispose(instance);
        return active() ? report(declaration.id, 'mount', error) : skipped;
      }
    }));
  }

  return Object.freeze({ register, mount, unmount });
}
