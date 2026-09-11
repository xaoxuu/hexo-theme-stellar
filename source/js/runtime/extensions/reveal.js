function queryAll(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
}

const SCALE = 1;

function rootWindow(root) {
  if (root?.defaultView) return root.defaultView;
  if (root?.ownerDocument?.defaultView) return root.ownerDocument.defaultView;
  return null;
}

function prefersReducedMotion(windowRef) {
  if (typeof windowRef?.matchMedia !== 'function') return false;
  try {
    return windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    void error;
    return false;
  }
}

export function mount(root, context) {
  const { duration, interval, distance, blur } = context.extension.config;
  const elements = queryAll(root, '.slide-up');
  const windowRef = rootWindow(root);
  if (
    elements.length === 0 ||
    typeof windowRef?.IntersectionObserver !== 'function' ||
    prefersReducedMotion(windowRef)
  ) return () => {};

  const animations = new Set();
  const hiddenElements = new Map();
  const pendingInitialObservation = new WeakSet(elements);
  let observer = null;
  let nextStartTime = 0;

  function restore(element) {
    const original = hiddenElements.get(element);
    if (!original) return;
    if (original.value) element.style.setProperty('opacity', original.value, original.priority);
    else element.style.removeProperty('opacity');
    hiddenElements.delete(element);
  }

  function cleanup() {
    observer?.disconnect();
    hiddenElements.forEach((value, element) => restore(element));
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }

  try {
    observer = new windowRef.IntersectionObserver(entries => {
      const now = windowRef.performance.now();
      entries.forEach(entry => {
        if (pendingInitialObservation.has(entry.target)) {
          pendingInitialObservation.delete(entry.target);
          if (entry.isIntersecting || typeof entry.target.animate !== 'function') {
            observer.unobserve(entry.target);
          } else {
            hiddenElements.set(entry.target, {
              value: entry.target.style.getPropertyValue('opacity'),
              priority: entry.target.style.getPropertyPriority('opacity')
            });
            entry.target.style.setProperty('opacity', '0');
          }
          return;
        }
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        restore(entry.target);
        if (typeof entry.target.animate !== 'function') return;
        try {
          const keyframes = [
            { opacity: 0, transform: `translateY(${distance}px) scale(${SCALE})` },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
          ];
          if (blur > 0) {
            keyframes[0].filter = `blur(${blur}px)`;
            keyframes[1].filter = 'blur(0px)';
          }
          const animation = entry.target.animate(keyframes, {
            delay: Math.max(0, nextStartTime - now),
            duration,
            easing: 'ease-out',
            fill: 'backwards'
          });
          animations.add(animation);
          nextStartTime = Math.max(now, nextStartTime) + interval;
        } catch (error) {
          void error;
        }
      });
    });
    elements.forEach(element => observer.observe(element));
  } catch (error) {
    void error;
    cleanup();
    return () => {};
  }

  return cleanup;
}
