(function () {
  var SUPPORTED_PROVIDERS = ['artalk', 'waline', 'twikoo'];
  var SETTINGS_ICON = 'default:settings';
  var PROFILE_ICON = 'default:profile';
  var GRAVATAR_BASE_URL = 'https://gravatar.com/avatar/';
  var localStore = null;
  var sessionStore = null;
  var gravatarHashes = new Map();
  var widgetRenderRevisions = new WeakMap();
  try { localStore = localStorage; } catch (error) {}
  try { sessionStore = sessionStorage; } catch (error) {}

  function parseStorage(store, key) {
    try {
      var raw = store?.getItem?.(key);
      if (!raw) return null;
      var value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function hasStorageValue(store, key) {
    try { return store?.getItem?.(key) != null; } catch (error) { return false; }
  }

  function writeStorage(store, key, value) {
    try {
      store?.setItem?.(key, JSON.stringify(value));
      return !!store?.setItem;
    } catch (error) { return false; }
  }

  function removeStorage(store, key) {
    try {
      store?.removeItem?.(key);
      return !!store?.removeItem;
    } catch (error) { return false; }
  }

  function cleanText(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength || 80) : '';
  }

  function cleanEmail(value) {
    var email = cleanText(value, 254);
    if (!email) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }

  function cleanHttpUrl(value) {
    if (typeof value !== 'string' || value.trim().length === 0) return '';
    var candidate = value.trim();
    if (candidate.startsWith('//')) candidate = 'https:' + candidate;
    try {
      var parsed = new URL(candidate);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch (error) { return null; }
  }

  function normalizeGravatarEmail(value) {
    var email = cleanEmail(value);
    return email ? email.toLowerCase() : '';
  }

  function hashToHex(buffer) {
    return Array.from(new Uint8Array(buffer), function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function getGravatarHash(email) {
    var normalized = normalizeGravatarEmail(email);
    if (!normalized) return Promise.resolve('');
    if (gravatarHashes.has(normalized)) return gravatarHashes.get(normalized);
    var cryptoApi = window.crypto;
    if (!cryptoApi?.subtle?.digest || typeof TextEncoder !== 'function') return Promise.resolve('');
    var promise;
    try {
      promise = Promise.resolve(cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(normalized)))
        .then(hashToHex)
        .catch(function () { return ''; });
    } catch (error) {
      promise = Promise.resolve('');
    }
    gravatarHashes.set(normalized, promise);
    return promise;
  }

  function getGravatarUrl(email, size) {
    var requestedSize = Math.round(Number(size));
    var safeSize = Number.isFinite(requestedSize) ? Math.min(2048, Math.max(1, requestedSize)) : 80;
    return getGravatarHash(email).then(function (hash) {
      return hash ? GRAVATAR_BASE_URL + hash + '?s=' + safeSize + '&r=g&d=404' : '';
    });
  }

  function emptyIdentity(provider) {
    var id = String(provider || '').toLowerCase();
    return { provider: id, supported: SUPPORTED_PROVIDERS.includes(id), name: '', email: '', url: '', avatar: '' };
  }

  function readIdentity(provider) {
    var id = String(provider || '').toLowerCase();
    var identity = emptyIdentity(id);
    var value = null;
    if (id === 'artalk') {
      value = parseStorage(localStore, 'ArtalkUser') || {};
      identity.name = cleanText(value.name || value.nick);
      identity.email = cleanText(value.email || value.mail, 254);
      identity.url = cleanHttpUrl(value.link || value.url) || '';
      identity.avatar = cleanHttpUrl(value.avatar) || '';
      return identity;
    }
    if (id === 'waline') {
      value = parseStorage(sessionStore, 'WALINE_USER') || parseStorage(localStore, 'WALINE_USER') || {};
      var meta = parseStorage(sessionStore, 'WALINE_USER_META') || parseStorage(localStore, 'WALINE_USER_META') || {};
      identity.name = cleanText(value.display_name || value.nick || meta.nick);
      identity.email = cleanText(value.email || value.mail || meta.mail, 254);
      identity.url = cleanHttpUrl(value.url || value.link || meta.link) || '';
      identity.avatar = cleanHttpUrl(value.avatar || meta.avatar) || '';
      return identity;
    }
    if (id === 'twikoo') {
      value = parseStorage(localStore, 'twikoo') || {};
      identity.name = cleanText(value.nick);
      identity.email = cleanText(value.mail, 254);
      identity.url = cleanHttpUrl(value.link) || '';
      identity.avatar = cleanHttpUrl(value.avatar) || '';
      return identity;
    }
    return identity;
  }

  function dispatchChange(provider) {
    try {
      window.dispatchEvent?.(new CustomEvent('stellar:profile-change', { detail: { provider: provider } }));
    } catch (error) {
      window.dispatchEvent?.({ type: 'stellar:profile-change', detail: { provider: provider } });
    }
  }

  function updateExistingCopies(key, updater) {
    return [localStore, sessionStore]
      .filter(function (store) { return hasStorageValue(store, key); })
      .map(function (store) { return writeStorage(store, key, updater(parseStorage(store, key) || {})); });
  }

  function writeIdentity(provider, fields) {
    var id = String(provider || '').toLowerCase();
    if (!SUPPORTED_PROVIDERS.includes(id)) return { ok: false, unsupported: true, partial: false };
    var rawName = typeof fields?.name === 'string' ? fields.name.trim() : '';
    var name = cleanText(rawName);
    var email = cleanEmail(fields?.email);
    var url = cleanHttpUrl(fields?.url);
    if (!name || rawName.length > 80) return { ok: false, validation: 'name', partial: false };
    if (email === null) return { ok: false, validation: 'email', partial: false };
    if (url === null) return { ok: false, validation: 'url', partial: false };

    var results = [];
    if (id === 'artalk') {
      var artalk = parseStorage(localStore, 'ArtalkUser') || {};
      results.push(writeStorage(localStore, 'ArtalkUser', Object.assign({}, artalk, { name: name, email: email, link: url })));
    } else if (id === 'twikoo') {
      var twikoo = parseStorage(localStore, 'twikoo') || {};
      results.push(writeStorage(localStore, 'twikoo', Object.assign({}, twikoo, { nick: name, mail: email, link: url })));
    } else {
      results = results.concat(
        updateExistingCopies('WALINE_USER', function (current) { return Object.assign({}, current, { display_name: name, email: email, url: url }); }),
        updateExistingCopies('WALINE_USER_META', function (current) { return Object.assign({}, current, { nick: name, mail: email, link: url }); })
      );
      if (results.length === 0) results.push(writeStorage(localStore, 'WALINE_USER_META', { nick: name, mail: email, link: url }));
    }
    var succeeded = results.filter(Boolean).length;
    var outcome = { ok: succeeded === results.length && succeeded > 0, partial: succeeded > 0 && succeeded < results.length };
    if (succeeded > 0) dispatchChange(id);
    return outcome;
  }

  function logout(provider) {
    var id = String(provider || '').toLowerCase();
    if (!SUPPORTED_PROVIDERS.includes(id)) return { ok: false, unsupported: true, partial: false };
    var targets = id === 'artalk'
      ? [[localStore, 'ArtalkUser']]
      : id === 'twikoo'
        ? [[localStore, 'twikoo']]
        : [[localStore, 'WALINE_USER'], [sessionStore, 'WALINE_USER'], [localStore, 'WALINE_USER_META'], [sessionStore, 'WALINE_USER_META']];
    var results = targets.map(function (target) { return removeStorage(target[0], target[1]); });
    var succeeded = results.filter(Boolean).length;
    var outcome = { ok: succeeded === results.length, partial: succeeded > 0 && succeeded < results.length };
    if (succeeded > 0) dispatchChange(id);
    return outcome;
  }

  function renderIconMedia(avatar, key) {
    var media = document.createElement('span');
    media.className = 'ui-icon';
    media.innerHTML = window.stellarIcons?.[key] || '';
    avatar.replaceChildren(media);
  }

  function renderImageMedia(avatar, url, onError) {
    var media = document.createElement('img');
    media.className = 'settings-widget__image';
    media.alt = '';
    media.onerror = onError || function () { renderIconMedia(avatar, PROFILE_ICON); };
    media.src = url;
    avatar.replaceChildren(media);
  }

  function isCurrentWidgetRender(widget, revision) {
    return widgetRenderRevisions.get(widget) === revision;
  }

  function renderWidgetFallback(widget, avatar, fallbackAvatar, revision) {
    if (!isCurrentWidgetRender(widget, revision)) return;
    if (!fallbackAvatar) {
      renderIconMedia(avatar, PROFILE_ICON);
      return;
    }
    renderImageMedia(avatar, fallbackAvatar, function () {
      if (isCurrentWidgetRender(widget, revision)) renderIconMedia(avatar, PROFILE_ICON);
    });
  }

  function renderWidgetGravatar(widget, avatar, identity, fallbackAvatar, revision) {
    if (!identity.email) {
      renderWidgetFallback(widget, avatar, fallbackAvatar, revision);
      return;
    }
    renderIconMedia(avatar, PROFILE_ICON);
    getGravatarUrl(identity.email, 64).then(function (url) {
      if (!isCurrentWidgetRender(widget, revision)) return;
      if (!url) {
        renderWidgetFallback(widget, avatar, fallbackAvatar, revision);
        return;
      }
      renderImageMedia(avatar, url, function () {
        renderWidgetFallback(widget, avatar, fallbackAvatar, revision);
      });
    }, function () {
      renderWidgetFallback(widget, avatar, fallbackAvatar, revision);
    });
  }

  function renderWidget(widget) {
    var revision = (widgetRenderRevisions.get(widget) || 0) + 1;
    widgetRenderRevisions.set(widget, revision);
    var settingsName = widget.dataset.settingsLabel || widget.getAttribute('aria-label') || 'Settings';
    var identityEnabled = widget.dataset.profileIdentityEnabled === 'true';
    var identity = readIdentity(widget.dataset.profileProvider);
    var hasIdentity = identityEnabled && identity.supported && !!identity.name;
    var name = hasIdentity ? identity.name : settingsName;
    var nameElement = widget.querySelector('.settings-widget__name');
    var avatar = widget.querySelector('.settings-widget__avatar');
    if (nameElement) nameElement.textContent = name;
    widget.setAttribute('aria-label', name);
    widget.setAttribute('title', name);
    if (!avatar) return;
    if (!hasIdentity) {
      renderIconMedia(avatar, SETTINGS_ICON);
      return;
    }
    var fallbackAvatar = widget.dataset.profileFallbackAvatar || '';
    if (identity.avatar) {
      renderImageMedia(avatar, identity.avatar, function () {
        renderWidgetGravatar(widget, avatar, identity, fallbackAvatar, revision);
      });
      return;
    }
    renderWidgetGravatar(widget, avatar, identity, fallbackAvatar, revision);
  }

  var mountedRoots = new WeakMap();
  function mount(root) {
    root = root || document;
    if (mountedRoots.has(root)) return mountedRoots.get(root);
    var refresh = function () { root.querySelectorAll?.('.settings-widget').forEach(renderWidget); };
    var delayedRefresh = function () { setTimeout(refresh, 0); };
    var onInteraction = function (event) {
      if (event.target?.closest?.('#comments, .comments, [class*="comment"]')) delayedRefresh();
    };
    window.addEventListener?.('storage', refresh);
    window.addEventListener?.('focus', refresh);
    window.addEventListener?.('stellar:profile-change', refresh);
    root.addEventListener?.('input', onInteraction);
    root.addEventListener?.('change', onInteraction);
    root.addEventListener?.('submit', onInteraction);
    root.addEventListener?.('click', onInteraction);
    refresh();
    var cleanup = function () {
      window.removeEventListener?.('storage', refresh);
      window.removeEventListener?.('focus', refresh);
      window.removeEventListener?.('stellar:profile-change', refresh);
      root.removeEventListener?.('input', onInteraction);
      root.removeEventListener?.('change', onInteraction);
      root.removeEventListener?.('submit', onInteraction);
      root.removeEventListener?.('click', onInteraction);
      mountedRoots.delete(root);
    };
    mountedRoots.set(root, cleanup);
    return cleanup;
  }

  window.stellarProfile = {
    mount: mount,
    supports: function (provider) { return SUPPORTED_PROVIDERS.includes(String(provider || '').toLowerCase()); },
    getGravatarUrl: getGravatarUrl,
    readIdentity: readIdentity,
    writeIdentity: writeIdentity,
    logout: logout
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(document); }, { once: true });
  else mount(document);
})();
