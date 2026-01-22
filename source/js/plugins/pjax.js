/**
 * PJAX - Seamless page transitions for Stellar theme
 * Uses pushState + AJAX for smooth navigation without full page reloads
 */

(function () {
  'use strict';

  // PJAX configuration (can be overridden via window.StellarPjaxConfig)
  const defaultConfig = {
    selectors: ['title', '.l_body'],
    timeout: 10000,
    cacheBust: false,
    minLoadTime: 200  // Minimum time (ms) to show loading animation for smooth transitions
  };

  const config = Object.assign({}, defaultConfig, window.StellarPjaxConfig || {});

  // State management
  let isLoading = false;
  let abortController = null;

  /**
   * Check if a link should be handled by PJAX
   */
  function shouldHandleLink(link) {
    // Must be an anchor element with href
    if (!link || !link.href || link.tagName !== 'A') return false;

    const url = new URL(link.href);
    const currentUrl = new URL(window.location.href);

    // Skip external links
    if (url.origin !== currentUrl.origin) return false;

    // Skip hash-only links on same page
    if (url.pathname === currentUrl.pathname && url.hash) return false;

    // Skip links with target attribute (except _self)
    if (link.target && link.target !== '_self') return false;

    // Skip links with download attribute
    if (link.hasAttribute('download')) return false;

    // Skip links with data-pjax="false"
    if (link.dataset.pjax === 'false') return false;

    // Skip links to non-HTML resources
    const ext = url.pathname.split('.').pop().toLowerCase();
    const nonHtmlExts = ['pdf', 'zip', 'rar', 'exe', 'dmg', 'doc', 'xls', 'ppt', 'mp3', 'mp4', 'avi', 'mov'];
    if (nonHtmlExts.includes(ext)) return false;

    return true;
  }

  /**
   * Extract content from HTML string based on selectors
   */
  function extractContent(html, selectors) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const contents = {};

    selectors.forEach(selector => {
      const element = doc.querySelector(selector);
      if (element) {
        contents[selector] = element.innerHTML;
      }
    });

    // Also extract body classes and other meta info
    contents._bodyClasses = doc.body.className;
    contents._htmlAttrs = {};
    Array.from(doc.documentElement.attributes).forEach(attr => {
      contents._htmlAttrs[attr.name] = attr.value;
    });

    return contents;
  }

  /**
   * Replace content in the current page
   */
  function replaceContent(contents, selectors) {
    // Update document title
    if (contents['title']) {
      document.title = contents['title'];
    }

    // Update HTML attributes (like data-theme, lang)
    if (contents._htmlAttrs) {
      Object.keys(contents._htmlAttrs).forEach(key => {
        document.documentElement.setAttribute(key, contents._htmlAttrs[key]);
      });
    }

    // Replace content for each selector
    selectors.forEach(selector => {
      if (selector === 'title') return; // Already handled

      const element = document.querySelector(selector);
      if (element && contents[selector]) {
        element.innerHTML = contents[selector];
      }
    });
  }

  /**
   * Trigger custom events for other scripts to listen to
   */
  function triggerEvent(name, detail = {}) {
    const event = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail
    });
    document.dispatchEvent(event);
  }

  /**
   * Start loading indicator
   */
  function startLoading() {
    if (window.NProgress) {
      NProgress.start();
    }
    document.body.classList.add('pjax-loading');
  }

  /**
   * Stop loading indicator
   */
  function stopLoading() {
    if (window.NProgress) {
      NProgress.done();
    }
    document.body.classList.remove('pjax-loading');

    // Trigger fade-in animation
    document.body.classList.add('pjax-loaded');

    // Remove animation class after it completes (matches CSS animation duration)
    setTimeout(() => {
      document.body.classList.remove('pjax-loaded');
    }, 400);
  }

  /**
   * Fetch page content via AJAX
   */
  async function fetchPage(url) {
    // Abort any existing request
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();

    const fetchUrl = config.cacheBust
      ? url + (url.includes('?') ? '&' : '?') + '_pjax=' + Date.now()
      : url;

    let timeoutId = null;
    if (typeof config.timeout === 'number' && config.timeout > 0) {
      timeoutId = setTimeout(function () {
        // Abort the current request when the timeout is reached
        if (abortController) {
          abortController.abort();
        }
      }, config.timeout);
    }
    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'X-PJAX': 'true',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: abortController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Navigate to a new page using PJAX
   */
  async function navigate(url, options = {}) {
    if (isLoading) return false;

    const isPop = options.isPop || false;
    const startTime = Date.now();

    // Trigger before event
    triggerEvent('pjax:before', { url });

    isLoading = true;
    startLoading();

    try {
      const html = await fetchPage(url);
      const contents = extractContent(html, config.selectors);

      // Ensure minimum load time for smooth animation
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, config.minLoadTime - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Scroll to top before replacing content (unless it's a popstate)
      if (!isPop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Replace content
      replaceContent(contents, config.selectors);

      // Update browser history (only for new navigations, not popstate)
      if (!isPop) {
        history.pushState({ pjax: true, url: url }, '', url);
      }

      // Trigger complete event for other scripts to re-initialize
      triggerEvent('pjax:complete', { url });

      // Re-initialize lazy loading
      if (window.lazyLoadInstance) {
        window.lazyLoadInstance.update();
      }

      stopLoading();
      isLoading = false;

      return true;
    } catch (error) {
      stopLoading();
      isLoading = false;

      // If aborted, ignore
      if (error.name === 'AbortError') {
        return false;
      }

      console.error('PJAX Error:', error);

      // Fallback to regular navigation
      window.location.href = url;
      return false;
    }
  }

  /**
   * Handle link clicks
   */
  function handleClick(event) {
    // Find the closest anchor element
    let link = event.target;
    while (link && link.tagName !== 'A') {
      link = link.parentElement;
    }

    if (!shouldHandleLink(link)) return;

    // Check for modifier keys (new tab/window)
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    // Prevent default and use PJAX
    event.preventDefault();
    navigate(link.href);
  }

  /**
   * Handle browser back/forward buttons
   */
  function handlePopState(event) {
    // Only handle PJAX state or initial page
    if (event.state?.pjax || !event.state) {
      navigate(window.location.href, { isPop: true });
    }
  }

  /**
   * Initialize PJAX
   */
  function init() {
    // Set initial history state
    history.replaceState({ pjax: true, url: window.location.href }, '', window.location.href);

    // Listen for link clicks
    document.addEventListener('click', handleClick, false);

    // Listen for browser back/forward
    window.addEventListener('popstate', handlePopState, false);

    // Expose API
    window.stellar = window.stellar || {};
    window.stellar.pjax = {
      navigate: navigate,
      config: config
    };

    console.log('Stellar PJAX initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
