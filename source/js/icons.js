/**
 * icons.js | 非首屏图标异步加载
 *
 * 服务端 icon() 对非首屏 SVG 图标输出 <svg class="icon" data-icon="ns:key"> 占位符，
 * 本脚本按命名空间拉取构建期生成的 js/icons/{ns}.json，成功后原位替换为完整内联 SVG，
 * 最终 DOM 与全量内联一致，现有 CSS 钩子（搜索三态、菜单渐变、chat 着色等）不受影响。
 * 首屏关键图标（搜索、菜单、leftbar/rightbar、arrow-left）由模板内联，不经过本脚本。
 */
(function () {
  'use strict';

  const nodes = Array.prototype.slice.call(document.querySelectorAll('svg.icon[data-icon]'));
  if (nodes.length === 0) {
    return;
  }

  const groups = {};
  nodes.forEach((node) => {
    const key = node.getAttribute('data-icon');
    const idx = key.indexOf(':');
    if (idx < 1) {
      return;
    }
    const ns = key.slice(0, idx);
    if (!groups[ns]) {
      groups[ns] = [];
    }
    groups[ns].push(node);
  });

  const script = document.currentScript;
  const version = (script && script.getAttribute('data-version')) || '';
  const root = (typeof ctx !== 'undefined' && ctx.root) || '/';

  Object.keys(groups).forEach((ns) => {
    const url = root + 'js/icons/' + ns + '.json' + (version ? '?v=' + version : '');
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then((data) => {
        const set = data && data[ns];
        groups[ns].forEach((node) => {
          const key = node.getAttribute('data-icon');
          const svg = set && set[key];
          if (typeof svg === 'string' && svg.length > 0) {
            node.outerHTML = svg;
          } else {
            console.warn('[stellar] icon not found: ' + key);
          }
        });
      })
      .catch((err) => {
        console.warn('[stellar] icons load failed: ' + ns, err);
      });
  });
})();
