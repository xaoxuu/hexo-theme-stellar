const META_ID = 'stellar-navigation-config';
const STATE_KEY = 'stellarNavigation';

export function readNavigation(documentRef) {
  try {
    if (documentRef.querySelectorAll(`#${META_ID}`).length !== 1) return null;
    if ([...documentRef.querySelectorAll('script:not([data-stellar-script])')].some(script => {
      const type = (script.getAttribute('type') || '').trim().toLowerCase();
      return !type || ['module', 'importmap', 'speculationrules'].includes(type) || /^(?:text|application)\/(?:java|ecma)script$/.test(type);
    })) return null;
    const data = JSON.parse(documentRef.getElementById(META_ID)?.textContent || 'null');
    return data && typeof data.collection === 'string' && typeof data.signature === 'string'
      && typeof data.url === 'string' ? data : null;
  } catch { return null; }
}

export function navigationMatches(current, next) {
  return !!current && !!next && current.collection === next.collection && current.signature === next.signature;
}

export function createNavigationQueue() {
  let pending = Promise.resolve();
  let controller;
  return {
    begin() { controller?.abort(); controller = new AbortController(); return controller; },
    stop() { controller?.abort(); },
    commit(signal, action) {
      const operation = pending.then(() => { if (!signal.aborted) return action(); });
      pending = operation.catch(() => {});
      return operation;
    }
  };
}

function sameDocument(a, b) {
  return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search;
}

function syncSelectedLinks(next) {
  for (const id of ['topbar-region', 'leftbar-region']) {
    const current = document.getElementById(id);
    const target = next.getElementById(id);
    if (!current || !target) continue;
    const links = [...target.querySelectorAll('a[href]')];
    current.querySelectorAll('a[href]').forEach((link, index) => {
      const source = links[index];
      if (!source || link.getAttribute('href') !== source.getAttribute('href')) return;
      link.classList.toggle('is-active', source.classList.contains('is-active'));
      const selected = source.getAttribute('aria-current');
      if (selected) link.setAttribute('aria-current', selected);
      else link.removeAttribute('aria-current');
      link.querySelector('.ui-collection__indicator')?.remove();
      const indicator = source.querySelector('.ui-collection__indicator');
      if (indicator) link.append(indicator.cloneNode(true));
    });
  }
}

export function mount(root, context) {
  let current = readNavigation(document);
  if (!current || !context.runtime) return;
  const queue = createNavigationQueue();
  const lifetime = new AbortController();
  let currentURL = new URL(location.href);
  const oldRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  let scrollFrame = null;

  function remember() {
    // During popstate the URL may already belong to the incoming document.
    if (!sameDocument(currentURL, new URL(location.href))) return;
    history.replaceState({ ...history.state, [STATE_KEY]: {
      collection: current.collection, url: location.href, position: { x: scrollX, y: scrollY }
    } }, '', location.href);
  }
  function fallback(url, pop) {
    if (pop) location.replace(url.href);
    else location.assign(url.href);
  }
  async function navigate(url, { pop = false, position } = {}) {
    const request = queue.begin();
    const loading = document.createElement('div');
    loading.className = 'loading-wrap navigation-loading';
    loading.setAttribute('role', 'status');
    const icon = document.createElement('div');
    icon.className = 'lazy-icon';
    icon.setAttribute('aria-hidden', 'true');
    loading.append(icon);
    // Fast navigations should finish without flashing a loading indicator.
    const loadingTimer = setTimeout(() => document.body.append(loading), 150);
    const clearLoading = () => {
      clearTimeout(loadingTimer);
      loading.remove();
    };
    request.signal.addEventListener('abort', clearLoading, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; request.abort(); }, 15000);
    if (!pop) remember();
    try {
      const response = await fetch(url.href, { signal: request.signal, credentials: 'same-origin', headers: { Accept: 'text/html' } });
      if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('text/html')) throw new Error('navigation response unavailable');
      const next = new DOMParser().parseFromString(await response.text(), 'text/html');
      const data = readNavigation(next);
      if (!navigationMatches(current, data) || new URL(data.url).pathname !== url.pathname
        || next.querySelectorAll('#main').length !== 1 || next.querySelectorAll('#stellar-runtime-config').length !== 1) throw new Error('navigation document incompatible');
      const manifest = context.runtime.readManifest(next);
      // Load page styles before disposing usable content. Do not replay HTML scripts.
      await Promise.all([...next.querySelectorAll('link[data-stellar-page-style][href]')].map(link => {
        const attributes = {};
        for (const name of ['integrity', 'crossorigin', 'media']) if (link.hasAttribute(name)) attributes[name === 'crossorigin' ? 'crossOrigin' : name] = link.getAttribute(name);
        return context.assets.style(new URL(link.getAttribute('href'), url).href, attributes);
      }));
      clearTimeout(timeout);
      await queue.commit(request.signal, async () => {
        if (!navigationMatches(current, data)) throw new Error('navigation collection changed');
        window.stellar?.cancelPagePosition?.();
        const previousManifest = context.runtime.readManifest(document);
        await context.runtime.unmountPage();
        if (request.signal.aborted) { await context.runtime.mountPage(previousManifest); return; }
        if (!pop) history.pushState({ ...history.state, [STATE_KEY]: { collection: data.collection, url: url.href, position: { x: 0, y: 0 } } }, '', url.href);
        const main = document.getElementById('main');
        const rightbar = document.getElementById('rightbar-region');
        const nextMain = next.getElementById('main');
        const nextRightbar = next.getElementById('rightbar-region');
        // Inline scripts in inserted HTML stay inert; page enhancements belong to the runtime.
        main.replaceWith(nextMain);
        if (rightbar) {
          if (nextRightbar) rightbar.replaceWith(nextRightbar);
          else rightbar.remove();
        } else if (nextRightbar) nextMain.after(nextRightbar);
        for (const name of ['data-page-type', 'data-page-layout', 'data-article-style', 'data-text-indent']) {
          if (next.body.hasAttribute(name)) document.body.setAttribute(name, next.body.getAttribute(name));
          else document.body.removeAttribute(name);
        }
        document.querySelector('.site-shell').setAttribute('data-regions', next.querySelector('.site-shell').getAttribute('data-regions'));
        document.querySelectorAll('[data-stellar-page-meta]').forEach(node => node.remove());
        next.querySelectorAll('[data-stellar-page-meta]').forEach(node => document.head.append(node.cloneNode(true)));
        document.getElementById('stellar-runtime-config').textContent = next.getElementById('stellar-runtime-config').textContent;
        document.getElementById(META_ID).textContent = JSON.stringify(data);
        if (window.canonical?.param) window.canonical.param.permalink = data.url;
        syncSelectedLinks(next);
        current = data;
        currentURL = new URL(url.href);
        window.stellar?.syncPageShell?.();
        await context.runtime.mountPage(manifest);
        if (!request.signal.aborted) window.stellar?.positionPage?.({ partial: true, position });
        document.dispatchEvent(new CustomEvent('stellar:navigation-complete', { detail: { url: url.href } }));
      });
    } catch (error) {
      if ((!request.signal.aborted || timedOut) && !lifetime.signal.aborted) fallback(url, pop);
    } finally {
      clearTimeout(timeout);
      clearLoading();
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-stellar-navigation][href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.relList.contains('external')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || sameDocument(url, new URL(location.href))) return;
    event.preventDefault();
    void navigate(url);
  }, { signal: lifetime.signal });
  window.addEventListener('popstate', event => {
    const url = new URL(location.href);
    if (sameDocument(url, currentURL)) {
      queue.stop();
      window.stellar?.positionPage?.({ position: url.hash ? undefined : event.state?.[STATE_KEY]?.position });
      return;
    }
    const state = event.state?.[STATE_KEY];
    if (state?.collection !== current.collection) { queue.stop(); fallback(url, true); return; }
    void navigate(url, { pop: true, position: state.position });
  }, { signal: lifetime.signal });
  window.addEventListener('scroll', () => {
    if (scrollFrame !== null) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = null; remember(); });
  }, { passive: true, signal: lifetime.signal });
  window.addEventListener('pagehide', remember, { signal: lifetime.signal });
  remember();
  return () => {
    lifetime.abort();
    queue.stop();
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    history.scrollRestoration = oldRestoration;
  };
}
