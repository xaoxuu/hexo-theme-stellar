/**
 * icons.js | 非首屏图标异步加载
 *
 * 服务端 icon() 对非首屏 SVG 图标输出 <svg class="icon" data-icon="ns:key"> 占位符，
 * 本脚本按命名空间拉取构建期生成的 js/icons/{ns}.json，成功后原位替换为完整内联 SVG，
 * 最终 DOM 与全量内联一致，现有 CSS 钩子（搜索三态、菜单渐变、chat 着色等）不受影响。
 * 首屏关键图标（搜索、菜单、leftbar/rightbar、arrow-left）由模板内联，不经过本脚本。
 */
(function (global) {
  'use strict';

  const script = document.currentScript;
  let version = (script && script.getAttribute('data-version')) || '';
  if (!version && script && script.src) {
    try {
      version = new URL(script.src, window.location.href).searchParams.get('v') || '';
    } catch (error) {}
  }
  const rootPath = (typeof ctx !== 'undefined' && ctx.root) || '/';

  function queryNodes(root) {
    const nodes = [];
    if (root && typeof root.matches === 'function' && root.matches('svg.icon[data-icon]')) {
      nodes.push(root);
    }
    if (root && typeof root.querySelectorAll === 'function') {
      nodes.push.apply(nodes, root.querySelectorAll('svg.icon[data-icon]'));
    }
    return nodes;
  }

  function mount(root) {
    const groups = {};
    const controller = new AbortController();
    let active = true;
    queryNodes(root).forEach((node) => {
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

    Object.keys(groups).forEach((ns) => {
      const url = rootPath + 'js/icons/' + ns + '.json' + (version ? '?v=' + version : '');
      fetch(url, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) {
            throw new Error('HTTP ' + res.status);
          }
          return res.json();
        })
        .then((data) => {
          if (!active) {
            return;
          }
          const set = data && data[ns];
          groups[ns].forEach((node) => {
            if (!active || !node.isConnected) {
              return;
            }
            const key = node.getAttribute('data-icon');
            const svg = set && set[key];
            if (typeof svg === 'string' && svg.length > 0) {
              node.outerHTML = svg;
            } else {
              console.warn('[stellar] icon not found: ' + key);
            }
          });
        })
        .catch((error) => {
          if (error && error.name === 'AbortError') {
            return;
          }
          console.warn('[stellar] icons load failed: ' + ns, error);
        });
    });

    return function cleanup() {
      active = false;
      controller.abort();
    };
  }

  global.dispatchEvent(new CustomEvent('stellar:legacy-feature-ready', {
    detail: Object.freeze({ feature: 'deferredIcons', mount: mount })
  }));
})(window);
