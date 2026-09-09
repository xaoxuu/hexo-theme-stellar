window.stellar = window.stellar || {};
window.stellar.mountTagtree = (root, signal) => {

  const tagSwitchers = root.querySelectorAll('.tag-subtree.is-parent > a > .tag-switcher-wrapper')
  for (const tagSwitcher of tagSwitchers) {
    tagSwitcher.addEventListener('click', (e) => {
      const parent = e.target.closest('.tag-subtree.is-parent')
      parent.classList.toggle('is-expanded')
      e.preventDefault()
    }, { signal })
  }

  // Get active tag from query string, then activate it.
  const urlParams = new URLSearchParams(window.location.search)
  const activeTag = urlParams.get('tag')
  if (activeTag) {
    let tag = Array.from(root.querySelectorAll(".tag-subtree[data-tag]")).find(node => node.dataset.tag === activeTag)
    if (tag) {
      tag.querySelector('a').classList.add('is-active')
      if (tag.closest('.tag-tree-widget')?.dataset.expandActive !== 'true') {
        tag = tag.parentElement.closest('.tag-subtree.is-parent')
      }
      while (tag) {
        tag.classList.add('is-expanded')
        tag = tag.parentElement.closest('.tag-subtree.is-parent')
      }
    }
  }
};
