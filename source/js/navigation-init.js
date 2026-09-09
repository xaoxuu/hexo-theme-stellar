(function () {
  let cancelPosition = () => {};
  const pending = new Set();
  document.addEventListener('stellar:request-start', event => pending.add(event.detail.key));
  document.addEventListener('stellar:request-end', event => pending.delete(event.detail.key));
  function positionPage(options = {}) {
    cancelPosition();
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (error) { void error; }
    const anchor = id && document.getElementById(id);
    const main = document.getElementById('main');
    const position = options.position;
    const match = new URLSearchParams(location.search).has('kw') && main?.querySelector('mark.tag-plugin.mark');
    const target = anchor || match || (options.partial ? main : null);
    const offset = anchor && id !== 'start' ? 32 : 0;
    const y = () => position ? position.y : target ? target.getBoundingClientRect().top + scrollY - offset : 0;
    const x = position?.x || 0;
    const controller = new AbortController();
    let timer;
    let quiet = 0;
    let attempts = 0;
    let lastResourceTime = performance.now();
    let observer;
    const cancel = () => {
      controller.abort();
      clearInterval(timer);
      observer?.disconnect();
    };
    cancelPosition = cancel;
    for (const event of ['wheel', 'touchstart', 'mousedown', 'keydown', 'pagehide']) {
      window.addEventListener(event, cancel, { passive: true, once: true, signal: controller.signal });
    }
    if (options.partial && main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    }
    const adjust = () => {
      const top = Math.max(0, Math.min(y(), document.documentElement.scrollHeight - innerHeight));
      if (Math.abs(scrollY - top) > 2) { window.scrollTo({ left: x, top, behavior: 'instant' }); quiet = 0; }
      else quiet++;
      if (++attempts >= 50 || (quiet >= 3 && pending.size === 0 && performance.now() - lastResourceTime > 3000)) cancel();
    };
    if (anchor || position) {
      try {
        observer = new PerformanceObserver(() => { lastResourceTime = performance.now(); });
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) { void error; }
      timer = setInterval(adjust, 600);
    }
    adjust();
    return cancel;
  }
  window.stellar = window.stellar || {};
  window.stellar.positionPage = positionPage;
  window.stellar.cancelPagePosition = () => cancelPosition();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => positionPage(), { once: true });
  else positionPage();
})();
