(() => {
  const tagtreeConf = window.__STELLAR_TAGTREE__ || {};

  const tagSwitchers = document.querySelectorAll('.tag-subtree.is-parent > a > .tag-switcher-wrapper')
  for (const tagSwitcher of tagSwitchers) {
    tagSwitcher.addEventListener('click', (e) => {
      const parent = e.target.closest('.tag-subtree.is-parent')
      parent.classList.toggle('is-expanded')
      e.preventDefault()
    })
  }

  // Get active tag from query string, then activate it.
  const urlParams = new URLSearchParams(window.location.search)
  const activeTag = urlParams.get('tag')
  if (activeTag) {
    let tag = document.querySelector(`.tag-subtree[data-tag="${activeTag}"]`)
    if (tag) {
      tag.querySelector('a').classList.add('is-active')
      if (!tagtreeConf.expand_active) {
        tag = tag.parentElement.closest('.tag-subtree.is-parent')
      }
      while (tag) {
        tag.classList.add('is-expanded')
        tag = tag.parentElement.closest('.tag-subtree.is-parent')
      }
    }
  }
})()
