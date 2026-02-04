/**
 * PJAX - Seamless page transitions for Stellar theme
 * Uses pushState + AJAX for smooth navigation without full page reloads
 */

(function () {
  'use strict';

  // PJAX configuration (can be overridden via window.StellarPjaxConfig)
  const defaultConfig = {
    selectors: ['title', '#l_cover', '.l_body'],
    timeout: 10000,
    cacheBust: false,
    minLoadTime: 200  // Minimum time (ms) to show loading animation for smooth transitions
  };

  const config = Object.assign({}, defaultConfig, window.StellarPjaxConfig || {});
  if (!config.selectors.includes('#l_cover')) {
    config.selectors.push('#l_cover');
  }

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
   * Sync all attributes from source element to target element
   */
  function syncAttributes(source, target) {
    if (!source || !target) return;
    const oldAttrs = Array.from(target.attributes);
    const newAttrs = Array.from(source.attributes);

    // Remove attributes not in source
    for (let attr of oldAttrs) {
      if (!source.hasAttribute(attr.name)) target.removeAttribute(attr.name);
    }
    // Add or update attributes
    for (let attr of newAttrs) {
      if (target.getAttribute(attr.name) !== attr.value) {
        target.setAttribute(attr.name, attr.value);
      }
    }
  }

  /**
   * Extract content from HTML string
   */
  function extractContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return {
      contents: {
        title: doc.title,
        _bodyClasses: doc.body.className,
        _htmlAttrs: Array.from(doc.documentElement.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      },
      doc
    };
  }

  /**
   * Replace content in the current page
   */
  function replaceContent(contents, selectors, doc) {
    // 1. Update HTML attributes (theme, lang, etc.)
    syncAttributes(doc.documentElement, document.documentElement);
    if (contents.title) document.title = contents.title;
    if (contents._bodyClasses) document.body.className = contents._bodyClasses;

    // 2. Replace content for each selector
    selectors.forEach(selector => {
      if (selector === 'title' || selector === 'html') return;

      const oldEl = document.querySelector(selector);
      const newEl = doc.querySelector(selector);
      if (oldEl && newEl) {
        syncAttributes(newEl, oldEl);

        if (selector === '.l_body') {
          // 1. Update main content
          const oMain = oldEl.querySelector('.l_main');
          const nMain = newEl.querySelector('.l_main');
          if (oMain && nMain) {
            oMain.replaceWith(nMain);
          } else if (oMain) {
            // Clear no longer existing main content
            oMain.innerHTML = '';
          }

          // 2. Special handling for sidebar
          const oSidebar = oldEl.querySelector('.l_left');
          const nSidebar = newEl.querySelector('.l_left');
          if (oSidebar && nSidebar) {
            // Update Sidebar components in-place
            ['.header', '.nav-area', '.widgets', '.footer'].forEach(part => {
              const op = oSidebar.querySelector(part);
              const np = nSidebar.querySelector(part);
              if (op && np) {
                const isIdentical = op.isEqualNode(np) || (op.innerHTML.trim() === np.innerHTML.trim());
                if (!isIdentical) {
                  if (part === '.widgets') {
                    const savedScrollTop = oSidebar.querySelector('.widgets')?.scrollTop || 0;
                    op.replaceWith(np);
                    np.style.scrollBehavior = 'auto';
                    np.scrollTop = savedScrollTop;
                    np.style.scrollBehavior = '';
                  } else {
                    op.replaceWith(np);
                  }
                }
              } else if (op) {
                op.innerHTML = '';
              }
            });
          } else if (oSidebar) {
            oSidebar.innerHTML = '';
          }

          // body already updated, skip general update
          return;
        }

        // Default replacement for other selectors (like #l_cover)
        if (!(oldEl.isEqualNode(newEl) || oldEl.innerHTML.trim() === newEl.innerHTML.trim())) {
          oldEl.replaceWith(newEl);
        }
      } else if (oldEl) {
        // If the selector exists in old page but not in new page, clear it
        oldEl.innerHTML = '';
        Array.from(oldEl.attributes).forEach(attr => {
          if (attr.name !== 'id' && attr.name !== 'class') {
            oldEl.removeAttribute(attr.name);
          }
        });
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
      // Check if we need to animate out (scroll to content start) if current page has cover
      const currentWikiCover = document.querySelector('#l_cover .l_cover.wiki');
      const startEl = document.getElementById('start');
      let scrollPromise = Promise.resolve();
      
      if (currentWikiCover && startEl && !isPop) {
        // Scroll to #start so content slides up to top (pushing cover out of view)
        const rect = startEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop;
        
        // Only animate if we are not already there
        if (Math.abs(scrollTop - targetTop) > 5) {
           window.scrollTo({ top: targetTop, behavior: 'smooth' });
           // Wait for approx 400ms for scroll animation
           scrollPromise = new Promise(resolve => setTimeout(resolve, 400));
        }
      }

      const [html] = await Promise.all([
        fetchPage(url),
        scrollPromise
      ]);

      const { contents, doc } = extractContent(html, config.selectors);
      contents._targetUrl = url;

      // Ensure minimum load time for smooth animation (if scroll was faster than fetch)
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, config.minLoadTime - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Replace content
      replaceContent(contents, config.selectors, doc);

      // Scroll to correct position
      if (!isPop) {
        // If there is a full-screen wiki cover, scroll to content (#start)
        // Otherwise scroll to top
        const wikiCover = document.querySelector('#l_cover .l_cover.wiki');
        const startEl = document.getElementById('start');
        
        if (wikiCover && startEl) {
          // Scroll slightly above #start to account for sidebar margin
          // CSS: .l_body .l_left { top: calc(var(--gap-margin) * 2) }
          // We want the sidebar (which is sticky) to be at its sticky position
          const rect = startEl.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Get gap margin from CSS variable (approximate or hardcoded if needed)
          // Default gap-margin is usually around 16px to 24px per theme
          // Let's assume 2 * gap-margin is roughly 32px-48px. 
          // However, we can also just scroll to rect.top + scrollTop.
          // If sidebar is sticky at top: var(--gap-margin) * 2, we need the #start to be at top: 0 relative to viewport? 
          // No, if the user scrolls, the sidebar sticks. We want the initial state where the sidebar is just at its top position.
          // This creates a consistent 'initial view'.
          
          window.scrollTo({
            top: rect.top + scrollTop,
            behavior: 'auto'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
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

    if (!shouldHandleLink(link)) {
      // Handle in-page hash links with smooth scrolling
      if (link && link.href && link.target !== '_blank') {
         const url = new URL(link.href);
         const currentUrl = new URL(window.location.href);
         if (url.pathname === currentUrl.pathname && url.hash) {
           const targetId = url.hash.slice(1);
           const target = document.getElementById(targetId);
           if (target) {
             event.preventDefault();
             
             // Use same calculation as PJAX navigation for consistency
             const rect = target.getBoundingClientRect();
             const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
             
             window.scrollTo({
               top: rect.top + scrollTop,
               behavior: 'smooth'
             });
             
             // Update URL hash without scrolling again
             history.pushState(null, '', url.hash);
           }
         }
      }
      return;
    }

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
