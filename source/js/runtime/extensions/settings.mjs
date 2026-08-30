import { REQUEST_CACHE_PREFIX } from '../request-cache.mjs';

export const SEARCH_CACHE_KEY = 'search_cache_v5';

function utf8Bytes(value) {
  const text = String(value || '');
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).byteLength;
  let bytes = 0;
  for (const character of text) {
    const point = character.codePointAt(0);
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

function entryBytes(key, value) {
  return utf8Bytes(key) + utf8Bytes(value);
}

export function measureCacheSizes(storage) {
  let target = storage;
  if (arguments.length === 0) {
    try { target = globalThis.localStorage; } catch (error) { void error; target = null; }
  }
  if (!target) return Object.freeze({ search: 0, dynamic: 0, all: 0, failed: true });
  let search = 0;
  let dynamic = 0;
  try {
    const searchValue = target.getItem(SEARCH_CACHE_KEY);
    if (searchValue !== null) search = entryBytes(SEARCH_CACHE_KEY, searchValue);
    for (let index = 0; index < target.length; index++) {
      const key = target.key(index);
      if (!key?.startsWith(REQUEST_CACHE_PREFIX)) continue;
      const value = target.getItem(key);
      if (value !== null) dynamic += entryBytes(key, value);
    }
  } catch (error) {
    void error;
    return Object.freeze({ search: 0, dynamic: 0, all: 0, failed: true });
  }
  return Object.freeze({ search, dynamic, all: search + dynamic, failed: false });
}

export function formatCacheSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index++) {
    value /= 1024;
    unit = units[index];
  }
  const precision = value < 10 ? 1 : 0;
  return `${value.toFixed(precision).replace(/\.0$/, '')} ${unit}`;
}

function resultMessage(page, result) {
  if (result?.partial) return page.dataset.messagePartial;
  return result?.ok ? page.dataset.messageSuccess : page.dataset.messageFailure;
}

function setStatus(element, message, state) {
  if (!element) return;
  element.textContent = message || '';
  element.dataset.state = state || '';
}

function fallbackSearchClear() {
  try {
    globalThis.localStorage?.removeItem(SEARCH_CACHE_KEY);
    return { ok: true, partial: false, removed: 1, failed: 0 };
  } catch (error) {
    return { ok: false, partial: false, removed: 0, failed: 1 };
  }
}

function combine(results) {
  const succeeded = results.filter(result => result?.ok).length;
  const partial = results.some(result => result?.partial) || (succeeded > 0 && succeeded < results.length);
  return { ok: succeeded === results.length && !partial, partial };
}

export function mount(root, context) {
  const page = root.querySelector?.('.settings-page');
  if (!page) return;
  const provider = String(page.dataset.provider || '').toLowerCase();
  const api = globalThis.window?.stellarProfile;
  const form = page.querySelector('[data-profile-form]');
  const note = page.querySelector('[data-provider-note]');
  const status = page.querySelector('[data-profile-status]');
  const avatar = page.querySelector('[data-profile-avatar]');
  const avatarFallback = page.querySelector('[data-profile-avatar-fallback]');
  const nameInput = form?.querySelector('[name="name"]');
  const emailInput = form?.querySelector('[name="email"]');
  const urlInput = form?.querySelector('[name="url"]');
  const logoutButton = page.querySelector('[data-profile-logout]');
  const supported = !!api?.supports?.(provider);
  const fallbackAvatar = page.dataset.fallbackAvatar || '';
  let avatarRevision = 0;

  function avatarRenderIsCurrent(revision) {
    return revision === avatarRevision;
  }

  function showAvatarIcon(revision) {
    if (!avatar || !avatarRenderIsCurrent(revision)) return;
    avatar.onerror = null;
    avatar.hidden = true;
    avatar.removeAttribute('src');
    if (avatarFallback) avatarFallback.hidden = false;
  }

  function showAvatarImage(url, revision, onError) {
    if (!avatar || !avatarRenderIsCurrent(revision)) return;
    avatar.hidden = false;
    if (avatarFallback) avatarFallback.hidden = true;
    avatar.onerror = () => {
      if (avatarRenderIsCurrent(revision)) onError();
    };
    avatar.src = url;
  }

  function showFallbackAvatar(revision) {
    if (!avatarRenderIsCurrent(revision)) return;
    if (!fallbackAvatar) {
      showAvatarIcon(revision);
      return;
    }
    showAvatarImage(fallbackAvatar, revision, () => showAvatarIcon(revision));
  }

  function showGravatar(identity, revision) {
    if (!identity.email || typeof api?.getGravatarUrl !== 'function') {
      showFallbackAvatar(revision);
      return;
    }
    showAvatarIcon(revision);
    Promise.resolve(api.getGravatarUrl(identity.email, 160)).then(url => {
      if (!avatarRenderIsCurrent(revision)) return;
      if (!url) {
        showFallbackAvatar(revision);
        return;
      }
      showAvatarImage(url, revision, () => showFallbackAvatar(revision));
    }, () => showFallbackAvatar(revision));
  }

  function renderAvatar(identity) {
    const revision = ++avatarRevision;
    if (!avatar) return;
    if (identity.avatar) {
      showAvatarImage(identity.avatar, revision, () => showGravatar(identity, revision));
      return;
    }
    showGravatar(identity, revision);
  }

  function renderCacheSizes() {
    const sizes = measureCacheSizes();
    ['search', 'dynamic', 'all'].forEach(type => {
      const element = page.querySelector(`[data-cache-size="${type}"]`);
      if (element) element.textContent = sizes.failed ? '—' : formatCacheSize(sizes[type]);
    });
  }

  function render() {
    const identity = api?.readIdentity?.(provider) || { name: '', email: '', url: '', avatar: '' };
    if (nameInput) nameInput.value = identity.name || '';
    if (emailInput) emailInput.value = identity.email || '';
    if (urlInput) urlInput.value = identity.url || '';
    if (form) form.hidden = !supported;
    if (logoutButton) logoutButton.hidden = !supported;
    if (note) note.hidden = supported;
    renderAvatar(identity);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!form?.reportValidity?.()) return;
    const result = api?.writeIdentity?.(provider, {
      name: nameInput?.value || '',
      email: emailInput?.value || '',
      url: urlInput?.value || ''
    }) || { ok: false };
    const validationMessage = result.validation ? page.dataset[`validation${result.validation[0].toUpperCase()}${result.validation.slice(1)}`] : '';
    setStatus(status, validationMessage || resultMessage(page, result), result.ok ? 'success' : result.partial ? 'partial' : 'failure');
    if (result.ok || result.partial) render();
  }

  function onLogout() {
    const result = api?.logout?.(provider) || { ok: false };
    setStatus(status, resultMessage(page, result), result.ok ? 'success' : result.partial ? 'partial' : 'failure');
    if (result.ok || result.partial) render();
  }

  function clearSearch() {
    return globalThis.window?.stellarLocalSearch?.clearCache?.() || fallbackSearchClear();
  }

  function onCacheAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.cacheAction;
    const results = [];
    if (action === 'search' || action === 'all') results.push(clearSearch());
    if (action === 'dynamic' || action === 'all') results.push(context.request.clearCache());
    const result = combine(results);
    const cacheStatus = page.querySelector('[data-cache-status]');
    if (result.ok) setStatus(cacheStatus, '', '');
    else setStatus(cacheStatus, resultMessage(page, result), result.partial ? 'partial' : 'failure');
    renderCacheSizes();
  }

  function onStorage() {
    render();
    renderCacheSizes();
  }

  form?.addEventListener('submit', onSubmit);
  logoutButton?.addEventListener('click', onLogout);
  const cacheButtons = Array.from(page.querySelectorAll('[data-cache-action]'));
  cacheButtons.forEach(button => button.addEventListener('click', onCacheAction));
  globalThis.window?.addEventListener?.('storage', onStorage);
  globalThis.window?.addEventListener?.('stellar:profile-change', render);
  render();
  renderCacheSizes();
  return () => {
    avatarRevision++;
    form?.removeEventListener('submit', onSubmit);
    logoutButton?.removeEventListener('click', onLogout);
    cacheButtons.forEach(button => button.removeEventListener('click', onCacheAction));
    globalThis.window?.removeEventListener?.('storage', onStorage);
    globalThis.window?.removeEventListener?.('stellar:profile-change', render);
  };
}
