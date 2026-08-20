/**
 * dropdown.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * {% dropdown [direction:up/down] [align:left/right] title %}
 * - icon:key [title](url)
 * {% enddropdown %}
 */

'use strict'

function parseItem(line) {
  const matches = line.match(/^\s*(?:[-*]\s+)?(?:icon:([^\s]+)\s+)?\[([^\]]+)\]\(([^)\s]+)\)(?:\s+icon:([^\s]+))?\s*$/)
  if (!matches) {
    return null
  }
  return {
    icon: matches[1] || matches[4],
    title: matches[2],
    url: matches[3]
  }
}

module.exports = ctx => function(args, content = '') {
  const { escapeHTML, url_for } = require('hexo-util')
  args = ctx.args.map(args, ['icon', 'direction', 'align', 'open'], ['title'])
  if (!args.title) {
    return ''
  }

  const items = content.split(/\r?\n/).map(parseItem).filter(Boolean)
  if (items.length === 0) {
    return ''
  }

  const direction = ['up', 'down'].includes(args.direction) ? args.direction : 'auto'
  const align = ['left', 'right'].includes(args.align) ? args.align : 'auto'
  const title = escapeHTML(args.title)
  const toUrl = url_for.bind(ctx)
  var el = `<details class="tag-plugin dropdown" direction="${direction}" align="${align}"`
  if (args.open === 'true') {
    el += ' open'
  }
  el += '>'
  el += `<summary class="dropdown-trigger" title="${title}" aria-label="${title}">`
  el += `<span>${title}</span>`
  el += '<svg class="dropdown-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  el += '</summary>'
  el += '<div class="dropdown-menu ui-collection" data-ui-surface="glass" data-layout="list" data-variant="nav" data-density="compact">'
  for (const item of items) {
    const url = String(item.url)
    el += `<a class="dropdown-item ui-collection__item card-hover card-hover--spotlight" href="${escapeHTML(toUrl(url))}`
    if (url.includes('://')) {
      el += '" target="_blank" rel="external nofollow noopener noreferrer">'
    } else {
      el += '" rel="noopener noreferrer">'
    }
    if (item.icon) {
      el += `<span class="ui-collection__leading">${ctx.utils.icon(item.icon, 'no-lazy', true)}</span>`
    }
    el += `<span class="ui-collection__content"><span class="ui-collection__title">${escapeHTML(item.title)}</span></span></a>`
  }
  el += '</div></details>'
  return el
}
