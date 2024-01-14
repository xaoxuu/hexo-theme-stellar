/**
 * topic v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('topic', function (locals) {
  const { topic } = hexo.theme.config
  const topicIdList = Object.keys(topic.tree)
  if (topicIdList.length == 0) {
    return {}
  }
  var ret = []
  ret.push({
    path: (hexo.theme.config.base_dir.topic) + '/index.html',
    data: {
      layout: 'index_topic'
    },
    layout: ['index_topic']
  })
  return ret
})
