const PHASES = new Set(['import', 'mount', 'unmount']);

function validateDeclaration(declaration) {
  if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration)) {
    throw new TypeError('[stellar runtime] extension declaration must be an object');
  }
  if (typeof declaration.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(declaration.id)) {
    throw new TypeError('[stellar runtime] extension id is invalid');
  }
  if (typeof declaration.module !== 'string' || declaration.module.length === 0) {
    throw new TypeError(`[stellar runtime] extension ${declaration.id} module is invalid`);
  }
  const unknown = Object.keys(declaration).filter(key => !['id', 'module', 'when', 'config'].includes(key));
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

function cleanupFrom(result, module, root, context) {
  if (typeof result === 'function') return result;
  if (typeof result?.cleanup === 'function') return result.cleanup;
  if (typeof module.unmount === 'function') {
    return () => module.unmount(root, context, result);
  }
  return null;
}

export function createExtensionRegistry(options = {}) {
  const importer = options.importer || (specifier => import(specifier));
  const onError = typeof options.onError === 'function' ? options.onError : () => {};
  const declarations = new Map();
  const modulePromises = new Map();
  const roots = new WeakMap();

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
      module: declaration.module,
      when: declaration.when || {},
      config: declaration.config || {}
    }));
  }

  async function load(declaration) {
    if (!modulePromises.has(declaration.module)) {
      modulePromises.set(declaration.module, Promise.resolve().then(() => importer(declaration.module)));
    }
    return modulePromises.get(declaration.module);
  }

  async function unmount(root) {
    const instances = roots.get(root) || [];
    const results = [];
    for (let index = instances.length - 1; index >= 0; index--) {
      const instance = instances[index];
      if (typeof instance.cleanup !== 'function') continue;
      try {
        await instance.cleanup();
        results.push({ id: instance.id, status: 'unmounted' });
      } catch (error) {
        results.push(report(instance.id, 'unmount', error));
      }
    }
    roots.delete(root);
    return results;
  }

  async function mount(root, context = {}) {
    if (!root || typeof root !== 'object') {
      throw new TypeError('[stellar runtime] mount root must be an object');
    }
    await unmount(root);
    const instances = [];
    const results = [];
    roots.set(root, instances);

    for (const declaration of declarations.values()) {
      let eligible;
      try {
        eligible = shouldMount(root, declaration.when);
      } catch (error) {
        results.push(report(declaration.id, 'mount', error));
        continue;
      }
      if (!eligible) {
        results.push({ id: declaration.id, status: 'skipped' });
        continue;
      }
      let module;
      try {
        module = await load(declaration);
      } catch (error) {
        results.push(report(declaration.id, 'import', error));
        continue;
      }
      if (typeof module?.mount !== 'function') {
        results.push(report(declaration.id, 'mount', new TypeError('module must export mount(root, context)')));
        continue;
      }
      const extensionContext = Object.freeze(Object.assign({}, context, {
        extension: declaration,
        reportError(error, phase = 'mount') {
          return report(declaration.id, phase, error);
        }
      }));
      try {
        const result = await module.mount(root, extensionContext);
        instances.push({
          id: declaration.id,
          cleanup: cleanupFrom(result, module, root, extensionContext)
        });
        results.push({ id: declaration.id, status: 'mounted' });
      } catch (error) {
        results.push(report(declaration.id, 'mount', error));
      }
    }
    return results;
  }

  return Object.freeze({ register, mount, unmount });
}
