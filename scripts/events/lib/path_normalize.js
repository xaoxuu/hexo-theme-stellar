'use strict';

/**
 * 页面路径归一化：将 xxx.html 归一为目录形式 xxx/
 * 必须在 generateBefore 最早阶段执行（先于 doc_tree / notebooks 等读取 page.path），
 * 直接改写 Page model 存储，保证 page.permalink、JSON-LD、sitemap、search.json
 * 与 canonical（尾斜杠格式）一致。
 */
module.exports = ctx => {
  const data = ctx.model('Page').data || {}
  Object.values(data).forEach(page => {
    if (!page || typeof page.path !== 'string') {
      return
    }
    if (page.layout === false || page.layout === 'false') {
      return
    }
    if (page.path.endsWith('.html') && !page.path.endsWith('/index.html')) {
      page.path = page.path.replace(/\.html$/, '/')
    }
  })
}
