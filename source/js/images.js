(function () {
  var degraded = false;
  function images(root) {
    return [...(root.matches?.('img') ? [root] : []), ...root.querySelectorAll('img')].filter(img => !img.closest('noscript'));
  }
  function native(img) {
    img.classList.remove('lazy', 'loading');
    var src = img.getAttribute('data-src');
    img.removeAttribute('data-src');
    if (src) img.setAttribute('src', src);
    img.parentElement?.querySelector('.lazy-icon')?.remove();
  }
  function failed(img) {
    if (img.dataset.stellarImageError) return;
    var preferred = img.dataset.stellarFallback;
    img.classList.remove('loaded', 'error');
    if (preferred && !img.dataset.stellarFallbackTried && img.getAttribute('src') !== preferred) {
      img.dataset.stellarFallbackTried = 'true';
      img.src = preferred;
      return;
    }
    img.dataset.stellarImageError = 'true';
    var fallback = window.stellarIcons?.['image:onerror'];
    img.classList.remove('loading');
    img.classList.add('error');
    if (fallback) img.src = fallback.trim().startsWith('<svg') ? 'data:image/svg+xml,' + encodeURIComponent(fallback) : fallback;
    img.parentElement?.querySelector('.lazy-icon')?.remove();
  }
  function prepare(root) {
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) return;
    images(root).forEach(function (img) {
      if (degraded || img.closest('picture') || img.hasAttribute('srcset') || img.hasAttribute('no-lazy') || img.loading === 'eager' || img.getAttribute('fetchpriority') === 'high') {
        native(img);
      } else if (img.hasAttribute('data-src')) {
        img.classList.add('lazy');
      } else {
        img.classList.remove('lazy');
      }
      // A fallback can settle while the document is suspended in BFCache.
      if (img.complete && img.currentSrc && !img.hasAttribute('onerror')) {
        if (!img.naturalWidth && (!img.hasAttribute('data-src') || img.dataset.stellarFallbackTried)) failed(img);
        else if (img.dataset.stellarFallbackTried && !img.dataset.stellarImageError) {
          img.classList.remove('loading', 'error');
          img.classList.add('loaded');
          img.parentElement?.querySelector('.lazy-icon')?.remove();
        }
      }
    });
  }
  function wrap(root) {
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) return;
    images(root).forEach(function (img) {
      if (img.closest('picture') || img.parentElement?.classList.contains('lazy-box')) return;
      // Move the original node, retaining attributes and consumer listeners.
      var wrapper = img.ownerDocument.createElement('div');
      wrapper.className = 'lazy-box';
      img.replaceWith(wrapper);
      wrapper.append(img);
      if (img.hasAttribute('data-src') && !img.classList.contains('loaded') && !img.classList.contains('error')) {
        var icon = img.ownerDocument.createElement('div');
        icon.className = 'lazy-icon';
        wrapper.append(icon);
      }
    });
    prepare(root);
  }
  function fallback(root) {
    degraded = true;
    prepare(root);
  }
  function mount(root, update) {
    function errored(event) {
      var img = event.target;
      // The vendor owns the first deferred request; shared handling owns retries.
      if (img.tagName === 'IMG' && !img.hasAttribute('onerror') &&
          (!img.classList.contains('lazy') || img.dataset.stellarFallbackTried || img.dataset.stellarImageError)) failed(img);
    }
    function loaded(event) {
      var img = event.target;
      if (img.tagName === 'IMG' && img.dataset.stellarFallbackTried && !img.dataset.stellarImageError) {
        img.classList.remove('loading', 'error');
        img.classList.add('loaded');
        img.parentElement?.querySelector('.lazy-icon')?.remove();
      }
    }
    root.addEventListener('error', errored, true);
    root.addEventListener('load', loaded, true);
    prepare(root);
    var observer = new MutationObserver(function (changes) {
      var added = false;
      changes.forEach(function (change) {
        change.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          prepare(node);
          added = true;
        });
      });
      if (added) update?.();
    });
    observer.observe(root.documentElement || root, { childList: true, subtree: true });
    return function () {
      observer.disconnect();
      root.removeEventListener('error', errored, true);
      root.removeEventListener('load', loaded, true);
    };
  }
  function defer(root) {
    images(root).forEach(function (img) {
      if (degraded || img.closest('picture') || img.hasAttribute('srcset') || img.hasAttribute('no-lazy') || img.loading === 'eager' || img.getAttribute('fetchpriority') === 'high') return;
      var src = img.getAttribute('src');
      if (!src || /^data:image/i.test(src) || img.hasAttribute('data-src')) return;
      img.setAttribute('data-src', src);
      img.setAttribute('src', window.stellarImagePlaceholder);
      img.classList.add('lazy');
    });
    prepare(root);
  }
  function deferHtml(value) {
    // Template contents are inert: no image request starts before conversion.
    var template = document.createElement('template');
    template.innerHTML = value;
    defer(template.content);
    return template.innerHTML;
  }
  function html(src, fallback, classes) {
    var template = document.createElement('template');
    template.innerHTML = '<img>';
    var img = template.content.firstChild;
    img.setAttribute('src', String(src || ''));
    if (fallback) img.dataset.stellarFallback = String(fallback);
    if (classes) img.className = classes;
    defer(template.content);
    return template.innerHTML;
  }
  window.stellarImageError = failed;
  window.wrapLazyloadImages = wrap;
  window.stellarImages = Object.freeze({ prepare: prepare, mount: mount, html: html, defer: defer, deferHtml: deferHtml, fallback: fallback });
})();
