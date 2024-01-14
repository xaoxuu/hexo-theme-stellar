/**
 * wiki v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('wiki', function (locals) {
  const { root, wiki } = hexo.theme.config
  const wikiIdList = Object.keys(wiki.tree)
  if (wikiIdList.length == 0) {
    return {}
  }
  var ret = []
  ret.push({
    path: root.wiki.base_dir + '/index.html',
    layout: ['index_wiki'],
    data: {
      layout: 'index_wiki',
      menu_id: root.wiki.menu_id,
      filter: false
    }
  })
  if (wiki.all_tags) {
    for (let id of Object.keys(wiki.all_tags)) {
      let tag = wiki.all_tags[id]
      ret.push({
        path: tag.path,
        layout: ['index_wiki'],
        data: {
          layout: 'index_wiki',
          menu_id: root.wiki.menu_id,
          filter: true,
          tagName: tag.name
        }
      })
    }
  }
  return ret
})
