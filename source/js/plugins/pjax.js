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
   * Check if two widgets are identical (preserving dynamic content if API matches)
   * 使用轻量级比较策略以提高性能
   */
  function isWidgetIdentical(oldW, newW) {
    // 1. 快速检查：如果是同一个节点，直接返回
    if (oldW === newW) return true;
    
    // 2. 检查 widget ID 或类型
    const oldId = oldW.id || oldW.getAttribute('data-widget-id');
    const newId = newW.id || newW.getAttribute('data-widget-id');
    if (oldId && newId && oldId !== newId) return false;
    
    // 3. 检查 data-service 标识（动态内容）
    const oldDS = oldW.classList.contains('data-service') ? oldW : oldW.querySelector('.data-service');
    const newDS = newW.classList.contains('data-service') ? newW : newW.querySelector('.data-service');
    if (oldDS && newDS) {
      const oldApi = oldDS.getAttribute('data-api');
      const newApi = newDS.getAttribute('data-api');
      // 如果 API 相同，保留旧内容（可能已加载数据）
      if (oldApi && newApi && oldApi === newApi) return true;
    }
    
    // 4. 最后才使用 isEqualNode（比 innerHTML 更快）
    return oldW.isEqualNode(newW);
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

          // 2. Special handling for sidebars (left and right)
          ['.l_left', '.l_right'].forEach(side => {
            const oSide = oldEl.querySelector(side);
            const nSide = newEl.querySelector(side);
            if (oSide && nSide) {
              // Update Sidebar components in-place
              ['.header', '.nav-area', '.widgets', '.footer'].forEach(part => {
                const op = oSide.querySelector(part);
                const np = nSide.querySelector(part);
                if (op && np) {
                  if (part === '.widgets') {
                    const savedScrollTop = op.scrollTop || 0;
                    const oldChildren = Array.from(op.children);
                    const newChildren = Array.from(np.children);
                    
                    // Simple positional merger for performance and order preservation
                    const maxLength = Math.max(oldChildren.length, newChildren.length);
                    for (let i = 0; i < maxLength; i++) {
                      const oc = oldChildren[i];
                      const nc = newChildren[i];
                      if (oc && nc) {
                        if (!isWidgetIdentical(oc, nc)) {
                          oc.replaceWith(nc);
                        }
                      } else if (oc) {
                        oc.remove();
                      } else if (nc) {
                        op.appendChild(nc);
                      }
                    }
                    // 恢复滚动位置（在 DOM 更新后重新获取引用）
                    const widgetsContainer = oSide.querySelector('.widgets');
                    if (widgetsContainer) {
                      widgetsContainer.style.scrollBehavior = 'auto';
                      widgetsContainer.scrollTop = savedScrollTop;
                      // 延迟恢复 scroll-behavior 以确保滚动完成
                      requestAnimationFrame(() => {
                        widgetsContainer.style.scrollBehavior = '';
                      });
                    }
                  } else {
                    // 使用 isEqualNode 而不是 innerHTML 比较
                    const isIdentical = op.isEqualNode(np);
                    if (!isIdentical) {
                      op.replaceWith(np);
                    }
                  }
                } else if (op) {
                  op.remove();
                } else if (np) {
                  oSide.appendChild(np);
                }
              });
            } else if (oSide && !nSide) {
              oSide.remove();
            } else if (!oSide && nSide) {
              if (side === '.l_left') {
                oldEl.prepend(nSide);
              } else {
                oldEl.append(nSide);
              }
            }
          });

          // body already updated, skip general update
          return;
        }

        // Default replacement for other selectors (like #l_cover)
        if (!oldEl.isEqualNode(newEl)) {
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
   * Execute comment system scripts from the new page
   * This ensures comment init functions are registered after PJAX navigation
   */
  function executeCommentScripts(doc) {
    // Clear previous comment system init functions to avoid conflicts
    if (window.stellar && window.stellar.initComments) {
      window.stellar.initComments = {};
    }

    // Find and execute comment scripts from the new page
    const scriptsDiv = doc.querySelector('.scripts');
    if (!scriptsDiv) return;

    // Look for comment-related script tags
    const scripts = scriptsDiv.querySelectorAll('script');
    scripts.forEach(oldScript => {
      // Check if this is a comment system script by looking for initComments
      const scriptContent = oldScript.textContent || oldScript.innerHTML;
      if (scriptContent.includes('window.stellar.initComments')) {
        // Create and execute a new script element
        const newScript = document.createElement('script');
        
        // Copy all attributes including type="module" if present
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // For module scripts, we need to use a blob URL to preserve import statements
        if (oldScript.type === 'module') {
          const blob = new Blob([scriptContent], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);
          newScript.src = url;
          
          // Clean up blob URL and script element after loading (or on error)
          const cleanup = () => {
            URL.revokeObjectURL(url);
            newScript.remove();
          };
          newScript.onload = cleanup;
          newScript.onerror = cleanup;
        } else {
          // For regular scripts, just copy the content
          newScript.textContent = scriptContent;
          // Script executes synchronously when appended, so we can remove it immediately
        }
        
        // Execute by appending to document
        document.head.appendChild(newScript);
      }
    });
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

      // 确保最小加载时间以保证平滑动画
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, config.minLoadTime - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Replace content
      replaceContent(contents, config.selectors, doc);

      // Execute comment scripts from the new page
      executeCommentScripts(doc);

      // Scroll to correct position
      if (!isPop) {
        // 如果有全屏 wiki cover，滚动到内容区域 (#start)
        // 否则滚动到顶部
        const wikiCover = document.querySelector('#l_cover .l_cover.wiki');
        const newStartEl = document.getElementById('start');
        
        if (wikiCover && newStartEl) {
          // 立即跳转到目标位置，不使用动画（避免与导航前的滚动冲突）
          const rect = newStartEl.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({
            top: rect.top + scrollTop,
            behavior: 'auto'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
        history.pushState({ pjax: true, url: url }, '', url);
      }

      // Re-initialize lazy loading
      if (window.lazyLoadInstance) {
        window.lazyLoadInstance.update();
      }

      // Trigger complete event for other scripts to re-initialize
      // This is fired after DOM is updated and main content is ready
      triggerEvent('pjax:complete', { url });

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
   * Find the closest anchor element from event target
   */
  function findAnchorElement(target) {
    let element = target;
    while (element && element.tagName !== 'A') {
      element = element.parentElement;
    }
    return element;
  }

  /**
   * Check if link is a same-page hash link
   */
  function isSamePageHashLink(link, currentUrl) {
    if (!link || !link.href || link.tagName !== 'A') return false;
    if (link.target === '_blank') return false;

    try {
      const url = new URL(link.href);
      return url.origin === currentUrl.origin && 
             url.pathname === currentUrl.pathname && 
             !!url.hash;
    } catch (e) {
      return false;
    }
  }

  /**
   * Decode hash ID to handle Chinese and other non-ASCII characters
   * url.hash is URL-encoded (e.g., #%E4%B8%AD%E6%96%87), but getElementById needs decoded string
   */
  function decodeHashId(hash) {
    const rawId = hash.slice(1);
    try {
      return decodeURIComponent(rawId);
    } catch (e) {
      // If decoding fails, use the original value
      return rawId;
    }
  }

  /**
   * Scroll to element smoothly and update URL hash
   */
  function scrollToElement(element, hash) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    window.scrollTo({
      top: rect.top + scrollTop,
      behavior: 'smooth'
    });
    
    // Update URL hash without scrolling again
    history.pushState(null, '', hash);
  }

  /**
   * Handle same-page hash link navigation
   * Returns true if handled, false otherwise
   */
  function handleHashLink(link, currentUrl) {
    if (!isSamePageHashLink(link, currentUrl)) return false;

    try {
      const url = new URL(link.href);
      const targetId = decodeHashId(url.hash);
      const target = document.getElementById(targetId);
      
      if (target) {
        scrollToElement(target, url.hash);
        return true;
      }
    } catch (e) {
      // Invalid URL, let it fall through
    }
    
    return false;
  }

  /**
   * Handle link clicks
   */
  function handleClick(event) {
    const link = findAnchorElement(event.target);
    
    // Handle in-page hash links FIRST (before shouldHandleLink check)
    // This prevents page reloads when clicking table of contents in wiki mode
    const currentUrl = new URL(window.location.href);
    if (handleHashLink(link, currentUrl)) {
      event.preventDefault();
      return;
    }

    // Check if PJAX should handle this link
    if (!shouldHandleLink(link)) {
      return;
    }

    // Check for modifier keys (new tab/window)
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

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
