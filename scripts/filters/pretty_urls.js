// scripts/override-page-generator.js

hexo.extend.generator.register('page', function (locals) {
  return locals.pages.map(page => {
    let path = page.path;
    if (path === 'index.html' || path === 'index/') {
      // 站点根的 index 页：trailing_index/trailing_html 关闭后 Hexo 给出 "index/"，
      // 直接落到 index.html，否则会输出成 index/index.html。
      path = 'index.html';
    } else if (path.endsWith('.html') && !path.endsWith('/index.html')) {
      path = path.replace(/\.html$/, '/index.html');
    }

    const layout = (
      page.layout === false ||
      page.layout === 'false' ||
      typeof page.layout === 'undefined'
    ) ? false : page.layout;

    const isRawOutput = /\.(txt|json|xml|js|css)$/.test(path);

    return {
      path,
      layout,
      data: isRawOutput ? page.content : page
    };
  });
});
