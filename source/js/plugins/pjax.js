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

    return { contents, doc };
  }

  /**
   * Replace content in the current page
   */
  function replaceContent(contents, selectors, doc) {
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

    // Update body classes
    if (contents._bodyClasses) {
      document.body.className = contents._bodyClasses;
    }

    // Replace content for each selector
    selectors.forEach(selector => {
      if (selector === 'title') return; // Already handled

      const oldElement = document.querySelector(selector);
      const newElement = doc.querySelector(selector);

      if (oldElement && newElement) {
        // Special handling for the main body layout to preserve sidebar state
        if (selector === '.l_body') {
          const oldSidebar = oldElement.querySelector('.l_left');
          const newSidebar = newElement.querySelector('.l_left');
          let widgetsPreserved = false;

          if (oldSidebar && newSidebar) {
            const oldTree = oldSidebar.querySelector('.doc-tree');
            const newTree = newSidebar.querySelector('.doc-tree');
            
            // Case 1: Wiki Documentation Mode (Manual Active State Update)
            // If both pages share the wiki documentation tree structure, we reuse the entire sidebar
            // to prevent flickering and state loss, manually updating the active link.
            if (oldTree && newTree) {
              const targetUrl = contents._targetUrl || window.location.href;
              // Safe-guard against invalid URLs
              let relativeUrl;
              try {
                relativeUrl = new URL(targetUrl).pathname;
              } catch (e) {
                relativeUrl = targetUrl; // Fallback for relative paths
              }
              
              const oldLinks = oldTree.querySelectorAll('a.active');
              oldLinks.forEach(link => link.classList.remove('active'));
              
              const allLinks = oldTree.querySelectorAll('a');
              for (let link of allLinks) {
                // Determine if this link matches the current target URL
                let linkPath;
                try {
                  linkPath = new URL(link.href).pathname;
                } catch (e) {
                  linkPath = link.getAttribute('href');
                }

                if (linkPath === relativeUrl) {
                  link.classList.add('active');
                  // Optional: Expand parent details if needed (theme dependent)
                  break; 
                }
              }
              
              // Preserve entire sidebar by replacing the new one with the old one
              newSidebar.replaceWith(oldSidebar);
              widgetsPreserved = true;
            } 
            else {
              // Case 2: Granular Preservation
              // For non-wiki pages, we check individual components (Header, Nav, Widgets, Footer).
              // If a component is identical in HTML, we reuse the old DOM node to preserve its state (animations, scroll).
              const parts = ['.header', '.nav-area', '.widgets', '.footer'];
              parts.forEach(partSelector => {
                const oldPart = oldSidebar.querySelector(partSelector);
                const newPart = newSidebar.querySelector(partSelector);
                if (oldPart && newPart && oldPart.innerHTML === newPart.innerHTML) {
                  newPart.replaceWith(oldPart);
                  if (partSelector === '.widgets') {
                    widgetsPreserved = true;
                  }
                }
              });
            }
          }

          // If the widgets area was NOT preserved (i.e., it was replaced),
          // we attempt to restore the scroll position to minimize visual disruption.
          if (!widgetsPreserved) {
            const oldWidgets = oldElement.querySelector('.l_left .widgets');
            const newWidgets = newElement.querySelector('.l_left .widgets');
            if (oldWidgets && newWidgets) {
              newWidgets.style.scrollBehavior = 'auto'; // Disable smooth scroll for instant restore
              newWidgets.scrollTop = oldWidgets.scrollTop;
              newWidgets.style.scrollBehavior = '';
            }
          }
        }

        // Swap the entire element with the prepared new element
        oldElement.replaceWith(newElement);
      } else if (oldElement) {
        // If the selector exists in old page but not in new page, clear it
        oldElement.innerHTML = '';
        Array.from(oldElement.attributes).forEach(attr => {
          if (attr.name !== 'id' && attr.name !== 'class') {
            oldElement.removeAttribute(attr.name);
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
