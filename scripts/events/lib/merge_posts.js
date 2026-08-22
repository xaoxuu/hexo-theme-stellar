/**
 * merge_posts.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 
 */

'use strict';

const { normalize_path } = require('../../lib/path_utils');
const { getCollectionId, isListed } = require('../../lib/content-config');

class RelatedPage {
  constructor(page, config) {
    this.id = page._id
    this.stellarConfig = config;
    this.title = page.title
    this.path = page.path
    this.path_key = normalize_path(page.path)
    this.layout = page.layout
    this.date = page.date
    this.updated = page.updated
  }
}

module.exports = ctx => {
  var topic = ctx.theme.config.topic
  const posts = ctx.locals.get('posts')
  const pageConfigs = ctx.stellar?.contentConfig?.pageConfigs || new Map();
  posts.sort('date').each(function(post) {
    const config = pageConfigs.get(post);
    if (!config || !isListed(config)) return;
    let obj = new RelatedPage(post, config);
    // 合并拥有共同 topic 的文章到 topic.tree
    const topicId = getCollectionId(config, "topic");
    if (topicId) {
      var topicObject = topic.tree[topicId]
      if (topicObject) {
        obj.page_number = topicObject.pages.length + 1
        topicObject.pages.push(obj)
      }
    }
  })
  
  // topic homepage
  for (let tid of Object.keys(topic.tree)) {
    let topicObject = topic.tree[tid]
    if (topicObject.listing?.order_by == '-date') {
      topicObject.pages = topicObject.pages.reverse()
    }
    topicObject.homepage = topicObject.pages[0]
  }

}
