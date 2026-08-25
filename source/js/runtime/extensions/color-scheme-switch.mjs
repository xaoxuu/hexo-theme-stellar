const COLOR_SCHEMES = new Set(['light', 'dark', 'auto']);
const STORAGE_KEY = 'Stellar.colorScheme';

function selectedColorScheme(documentRef) {
  return documentRef.documentElement.getAttribute('data-theme') || 'auto';
}

export function resolvedColorScheme(documentRef, mediaQuery) {
  const selected = selectedColorScheme(documentRef);
  if (selected === 'light' || selected === 'dark') return selected;
  return mediaQuery.matches ? 'dark' : 'light';
}

function readStoredColorScheme(storage) {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return COLOR_SCHEMES.has(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function persistColorScheme(storage, value) {
  try {
    storage?.setItem(STORAGE_KEY, value);
  } catch (error) {
    void error;
  }
}

export function mount(root, context) {
  if (root?.nodeType !== 9 || !root.defaultView) {
    throw new TypeError('[stellar color-scheme-switch] document root is required');
  }
  const documentRef = root;
  const windowRef = root.defaultView;
  const mediaQuery = windowRef.matchMedia('(prefers-color-scheme: dark)');
  let storage = null;
  try {
    storage = windowRef.localStorage;
  } catch (error) {
    void error;
  }
  const messages = context.extension.config.messages || {};
  const previousSetter = windowRef.setColorScheme;

  function dispatch(mode) {
    documentRef.dispatchEvent(new windowRef.CustomEvent('stellar:color-scheme-change', {
      detail: Object.freeze({
        mode,
        resolvedMode: resolvedColorScheme(documentRef, mediaQuery)
      })
    }));
  }

  function apply(mode, options = {}) {
    if (!COLOR_SCHEMES.has(mode)) {
      throw new TypeError(`[stellar color-scheme-switch] unsupported mode ${String(mode)}`);
    }
    if (mode === 'auto') {
      documentRef.documentElement.removeAttribute('data-theme');
    } else {
      documentRef.documentElement.setAttribute('data-theme', mode);
    }
    if (options.persist !== false) persistColorScheme(storage, mode);
    dispatch(mode);
    if (options.notify !== false) context.legacy.stellar?.toast?.(messages[mode]);
    return mode;
  }

  const setter = mode => apply(mode);
  windowRef.setColorScheme = setter;

  const stored = readStoredColorScheme(storage);
  if (stored) {
    apply(stored, { persist: false, notify: false });
  } else {
    dispatch(selectedColorScheme(documentRef));
  }

  const handleSystemChange = () => {
    if (selectedColorScheme(documentRef) === 'auto') dispatch('auto');
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleSystemChange);
  }

  return () => {
    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleSystemChange);
    } else if (typeof mediaQuery.removeListener === 'function') {
      mediaQuery.removeListener(handleSystemChange);
    }
    if (windowRef.setColorScheme === setter) {
      if (previousSetter === undefined) delete windowRef.setColorScheme;
      else windowRef.setColorScheme = previousSetter;
    }
  };
}
