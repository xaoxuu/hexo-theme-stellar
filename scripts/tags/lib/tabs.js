/**
 * tabs.js v2 | 基于NexT修改： https://theme-next.js.org/docs/tag-plugins/tabs
 */

'use strict'

var tab_index = 0 

module.exports = ctx => function(args, content = '') {
  var arr = content.split(/<!--\s*tab (.*?)\s*-->/g).filter(item => item.trim().length > 0)
  if (arr.length < 1) {
    return ''
  }
  var tabs = []
  arr.forEach((item, i) => {
    if (i % 2 == 0) {
      tabs.push({
        header: item
      })
    } else if (tabs.length > 0) {
      var tab = tabs[tabs.length-1]
      if (tab.body == undefined) {
        tab.body = item
      } else {
        tab.body += '\n' + item
      }
    }
  })

  args = ctx.args.map(args, ['active', 'align'])
  const tabName = 'tab_' + ++tab_index
  const tabActive = Number(args.active) || 0

  let tabId = 0
  let tabNav = ''
  let tabContent = ''
  tabs.forEach((tab, i) => {
    let content = ctx.render.renderSync({ text: (tab.body || ''), engine: 'markdown' }).trim()
    const abbr = tabName + ' ' + ++tabId
    const href = abbr.toLowerCase().split(' ').join('-')
    const isActive = (tabActive > 0 && tabActive === tabId) || (tabActive === 0 && tabId === 1) ? ' active' : ''
    tabNav += `<div class="tab${isActive}"><a href="#${href}">${tab.header || abbr}</a></div>`
    tabContent += `<div class="tab-pane${isActive}" id="${href}">${content}</div>`
  })

  tabNav = `<div class="nav-tabs">${tabNav}</div>`
  tabContent = `<div class="tab-content">${tabContent}</div>`

  var el = ''
  el += '<div class="tag-plugin tabs"'
  if (args.align != undefined) {
    el += ' align="' + args.align + '"'
  }
  el += 'id="' + tabName.toLowerCase().split(' ').join('-') + '"'
  el += '>'
  el += tabNav + tabContent
  el += '</div>'
  return el
}
