function queryAll(root, selector) { return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)]; }

export async function mount(root, context) {
  const config = context.extension.config;
  await context.assets.script(config.assets.js);
  context.signal?.throwIfAborted();
  const theme = config.colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : config.theme;
  window.mermaid.initialize({
    startOnLoad: false,
    theme,
    logLevel: 3,
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'linear' },
    gantt: { axisFormat: '%Y/%m/%d' },
    sequence: { actorMargin: 50 }
  });
  await window.mermaid.run({ nodes: queryAll(root, '.mermaid') });
  return () => {};
}
