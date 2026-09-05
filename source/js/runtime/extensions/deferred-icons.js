/** 非首屏图标异步加载。 */

const RUNTIME_QUERY = new URL(import.meta.url).search;

function queryNodes(root) {
  const nodes = [];
  if (typeof root?.matches === 'function' && root.matches('svg.icon[data-icon]')) nodes.push(root);
  if (typeof root?.querySelectorAll === 'function') nodes.push(...root.querySelectorAll('svg.icon[data-icon]'));
  return nodes;
}

export function mount(root, context) {
  const groups = {};
  const controller = new AbortController();
  let active = true;
  queryNodes(root).forEach(node => {
    const key = node.getAttribute('data-icon');
    const index = key.indexOf(':');
    if (index < 1) return;
    const namespace = key.slice(0, index);
    if (!groups[namespace]) groups[namespace] = [];
    groups[namespace].push(node);
  });

  Object.keys(groups).forEach(namespace => {
    const path = `/js/icons/${namespace}.json`;
    const url = `${context.assets.resolve(path)}${RUNTIME_QUERY}`;
    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!active) return;
        const icons = data?.[namespace];
        groups[namespace].forEach(node => {
          if (!active || !node.isConnected) return;
          const key = node.getAttribute('data-icon');
          const svg = icons?.[key];
          if (typeof svg === 'string' && svg.length > 0) node.outerHTML = svg;
          else console.warn(`[stellar] icon not found: ${key}`);
        });
      })
      .catch(error => {
        if (error?.name !== 'AbortError') console.warn(`[stellar] icons load failed: ${namespace}`, error);
      });
  });

  return () => {
    active = false;
    controller.abort();
  };
}
