const { readImageColor } = await import(`../image-color.js${new URL(import.meta.url).search}`);

function queryAll(root, selector) { return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)]; }

export async function mount(root, context) {
  const ready = card => {
    if (card._wikiImageReady && card._wikiOverlayReady && !card.classList.contains('no-cover')) card.classList.add('cover-loaded');
  };
  root.addEventListener('wiki-overlay-ready', event => {
    const card = event.target.closest('.wiki-card');
    if (card) { card._wikiOverlayReady = true; ready(card); }
  }, { signal: context.signal });
  for (const img of root.querySelectorAll('.wiki-card-cover:not(.no-cover) > img')) {
    const cover = img.parentElement;
    const card = img.closest('.wiki-card');
    if (!card) continue;
    const loaded = () => { card._wikiImageReady = true; ready(card); };
    const failed = () => {
      card._wikiImageReady = false;
      card.classList.remove('cover-loaded');
      card.classList.add('no-cover');
      cover.classList.add('no-cover', 'cover-error');
    };
    img.addEventListener('load', loaded, { once: true, signal: context.signal });
    img.addEventListener('error', failed, { once: true, signal: context.signal });
    if (img.complete) { if (img.naturalWidth > 0) loaded(); else failed(); }
  }
  const config = context.extension.config;
  await context.assets.script(config.assets.colorJs);
  context.signal?.throwIfAborted();
  window.stellar.color.getAverageColor = (image, options = {}) => readImageColor(image, options)
    .then(raw => window.stellar.color.fromHsla(raw));
  await context.assets.script(config.assets.js);
  context.signal?.throwIfAborted();
  return window.stellarAdaptiveText?.mount?.(queryAll(root, '[data-text-adaptive]')) || (() => {});
}
