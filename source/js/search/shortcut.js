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

  function isNarrowLayout() {
    var leftbarToggle = document.querySelector('.mobile-only.leftbar-toggle');
    return !!(leftbarToggle && window.getComputedStyle(leftbarToggle).display !== 'none');
  }

  function handleShortcut(event) {
    if (!isSearchShortcut(event)) return;

    var input = document.getElementById('search-input');
    if (!input || isNarrowLayout()) return;
    if (event.target !== input && isEditableTarget(event.target)) return;

    event.preventDefault();
    input.focus();
  }

  function init() {
    document.addEventListener('keydown', handleShortcut);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
