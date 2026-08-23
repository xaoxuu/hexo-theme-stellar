(function() {
  function isSearchShortcut(event) {
    if (event.defaultPrevented || event.isComposing) return false;
    if (event.altKey || event.shiftKey) return false;
    if (!event.metaKey && !event.ctrlKey) return false;
    return typeof event.key === 'string' && event.key.toLowerCase() === 'k';
  }

  function isEditableTarget(target) {
    if (!target || typeof target.closest !== 'function') return false;
    return target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null;
  }

  function isNarrowLayout(root) {
    var leftbarToggle = root.querySelector('.mobile-only.leftbar-toggle');
    return !!(leftbarToggle && window.getComputedStyle(leftbarToggle).display !== 'none');
  }

  var roots = new WeakMap();
  function mount(root) {
    root = root || document;
    if (roots.has(root)) return roots.get(root);
    var handleShortcut = function(event) {
      if (!isSearchShortcut(event)) return;
      var input = root.querySelector('#search-input');
      if (!input || isNarrowLayout(root)) return;
      if (event.target !== input && isEditableTarget(event.target)) return;
      event.preventDefault();
      input.focus();
    };
    root.addEventListener('keydown', handleShortcut);
    var cleanup = function() {
      root.removeEventListener('keydown', handleShortcut);
      roots.delete(root);
    };
    roots.set(root, cleanup);
    return cleanup;
  }
  window.stellarSearchShortcut = { mount: mount };
})();
