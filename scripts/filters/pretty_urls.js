// scripts/override-page-generator.js

hexo.extend.generator.register('page', function (locals) {
  return locals.pages.map(page => {
    const path = (
      page.path.endsWith('.html') && !page.path.endsWith('/index.html')
    )
      ? page.path.replace(/\.html$/, '/index.html')
      : page.path;

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
