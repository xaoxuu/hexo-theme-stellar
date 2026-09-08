const EFFECT_SELECTOR = 'canvas[data-hero-effect]';
const MODULE_QUERY = new URL(import.meta.url).search;

function objectValue(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readObject(canvas, attribute) {
  const raw = canvas.getAttribute(attribute);
  if (!raw) return {};
  try {
    return objectValue(JSON.parse(raw));
  } catch (error) {
    void error;
    return {};
  }
}

function runtimePolicy(canvas) {
  const runtime = readObject(canvas, 'data-effect-runtime');
  return Object.freeze({
    pauseWhenHidden: runtime.pauseWhenHidden !== false,
    respectReducedMotion: runtime.respectReducedMotion !== false
  });
}

function effectCanvases(root) {
  const canvases = [];
  if (root?.matches?.(EFFECT_SELECTOR)) canvases.push(root);
  root?.querySelectorAll?.(EFFECT_SELECTOR).forEach(canvas => canvases.push(canvas));
  return canvases;
}

function versionedModule(context, module) {
  const resolved = context.assets.resolve(module);
  if (!resolved) throw new TypeError('[stellar hero effect] renderer module is required');
  if (!MODULE_QUERY) return resolved;
  return `${resolved}${resolved.includes('?') ? '&' : '?'}${MODULE_QUERY.slice(1)}`;
}

function reducedMotion(windowRef) {
  return windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function createLifecycle(canvas, renderer, runtime) {
  const background = canvas.parentElement;
  const interactionTarget = canvas.closest('.wiki-hero') || background;
  const documentRef = canvas.ownerDocument;
  const windowRef = documentRef?.defaultView || window;
  if (!background || !interactionTarget || !documentRef) return null;

  const pointer = { x: 0.5, y: 0.5, active: false };
  let animationFrame = null;
  let inViewport = true;
  let destroyed = false;

  function shouldRender() {
    return !destroyed && (!runtime.pauseWhenHidden || (inViewport && !documentRef.hidden));
  }

  function frame(time) {
    animationFrame = null;
    if (!shouldRender()) return;
    renderer.render(time, pointer);
    animationFrame = windowRef.requestAnimationFrame(frame);
  }

  function start() {
    if (shouldRender() && animationFrame === null) {
      animationFrame = windowRef.requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (animationFrame === null) return;
    windowRef.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function resize() {
    renderer.resize(background.getBoundingClientRect(), windowRef.devicePixelRatio || 1);
  }

  function onMouseMove(event) {
    const rect = background.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    pointer.active = true;
  }

  function onMouseLeave() {
    pointer.active = false;
  }

  function onVisibilityChange() {
    if (documentRef.hidden) stop();
    else start();
  }

  if (renderer.pointer === true) {
    interactionTarget.addEventListener('mousemove', onMouseMove);
    interactionTarget.addEventListener('mouseleave', onMouseLeave);
  }
  if (runtime.pauseWhenHidden) documentRef.addEventListener('visibilitychange', onVisibilityChange);

  let resizeObserver = null;
  if (windowRef.ResizeObserver) {
    resizeObserver = new windowRef.ResizeObserver(resize);
    resizeObserver.observe(background);
  } else {
    windowRef.addEventListener('resize', resize);
  }

  let viewportObserver = null;
  if (runtime.pauseWhenHidden && windowRef.IntersectionObserver) {
    viewportObserver = new windowRef.IntersectionObserver(entries => {
      inViewport = entries[0]?.isIntersecting === true;
      if (inViewport) start();
      else stop();
    }, { threshold: 0.01 });
    viewportObserver.observe(background);
  }

  resize();
  start();

  return function cleanup() {
    if (destroyed) return;
    destroyed = true;
    stop();
    if (renderer.pointer === true) {
      interactionTarget.removeEventListener('mousemove', onMouseMove);
      interactionTarget.removeEventListener('mouseleave', onMouseLeave);
    }
    if (runtime.pauseWhenHidden) documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    windowRef.removeEventListener('resize', resize);
    resizeObserver?.disconnect();
    viewportObserver?.disconnect();
    renderer.destroy();
  };
}

async function mountCanvas(canvas, context) {
  const type = canvas.getAttribute('data-hero-effect') || '';
  const definition = readObject(canvas, 'data-effect-resource');
  if (!definition || typeof definition.module !== 'string') {
    throw new TypeError(`[stellar hero effect] unregistered effect ${type || '<missing>'}`);
  }
  const runtime = runtimePolicy(canvas);
  const windowRef = canvas.ownerDocument?.defaultView || window;
  if (runtime.respectReducedMotion && reducedMotion(windowRef)) return null;
  const module = await import(versionedModule(context, definition.module));
  if (typeof module.createRenderer !== 'function') {
    throw new TypeError(`[stellar hero effect] ${type} must export createRenderer(canvas, options, defaults)`);
  }
  context.signal?.throwIfAborted();
  const renderer = module.createRenderer(canvas, readObject(canvas, 'data-effect-options'), objectValue(definition.defaults));
  if (!renderer) return null;
  if (typeof renderer.resize !== 'function' || typeof renderer.render !== 'function' || typeof renderer.destroy !== 'function') {
    renderer.destroy?.();
    throw new TypeError(`[stellar hero effect] ${type} returned an invalid renderer`);
  }
  return createLifecycle(canvas, renderer, runtime);
}

export async function mount(root, context) {
  const cleanups = [];
  await Promise.all(effectCanvases(root).map(async canvas => {
    try {
      const cleanup = await mountCanvas(canvas, context);
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup);
        context.onCleanup?.(cleanup);
      }
    } catch (error) {
      context.reportError(error);
    }
  }));
  if (!context.onCleanup) return () => {
    for (let index = cleanups.length - 1; index >= 0; index--) cleanups[index]();
  };
}
