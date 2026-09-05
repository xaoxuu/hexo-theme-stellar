function queryAll(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

const DISTANCE = '8px';
const DURATION_MS = 1000;
const INTERVAL_MS = 100;
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

export function mount(root) {
  const elements = queryAll(root, '.slide-up');
  const windowRef = rootWindow(root);
  if (
    elements.length === 0 ||
    typeof windowRef?.IntersectionObserver !== 'function' ||
    prefersReducedMotion(windowRef)
  ) return () => {};

  const animations = new Set();
  const pendingInitialObservation = new WeakSet(elements);
  let observer = null;

  try {
    observer = new windowRef.IntersectionObserver(entries => {
      let sequenceIndex = 0;
      entries.forEach(entry => {
        if (pendingInitialObservation.has(entry.target)) {
          pendingInitialObservation.delete(entry.target);
          if (entry.isIntersecting) observer.unobserve(entry.target);
          return;
        }
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (typeof entry.target.animate !== 'function') return;
        try {
          const animation = entry.target.animate([
            { opacity: 0, transform: `translateY(${DISTANCE}) scale(${SCALE})` },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
          ], {
            delay: sequenceIndex * INTERVAL_MS,
            duration: DURATION_MS,
            easing: 'ease-out',
            fill: 'backwards'
          });
          animations.add(animation);
          sequenceIndex += 1;
        } catch (error) {
          void error;
        }
      });
    });
    elements.forEach(element => observer.observe(element));
  } catch (error) {
    void error;
    observer?.disconnect();
    return () => {};
  }

  return () => {
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
}
