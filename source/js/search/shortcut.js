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

  var roots = new WeakMap();
  function mount(root) {
    root = root || document;
    if (roots.has(root)) return roots.get(root);
    var handleShortcut = function(event) {
      if (!isSearchShortcut(event)) return;
      var trigger = root.querySelector('[data-shell-action="open-search"]');
      if (!trigger) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      trigger.click();
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
