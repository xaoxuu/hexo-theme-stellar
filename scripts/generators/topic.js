/**
 * topic v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('topic', function (locals) {
  const { root, topic } = hexo.theme.config
  const topicIdList = Object.keys(topic.tree)
  if (topicIdList.length == 0) {
    return {}
  }
  var ret = []
  ret.push({
    path: root.topic.base_dir + '/index.html',
    layout: ['index_topic'],
    data: {
      layout: 'index_topic',
      menu_id: root.topic.menu_id
    }
  })
  return ret
})
