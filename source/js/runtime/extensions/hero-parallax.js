const SELECTOR = '.wiki-hero';

export function mount(root, context = {}) {
  const heroes = [...root.querySelectorAll(SELECTOR)];
  if (root.matches?.(SELECTOR)) heroes.unshift(root);
  const cleanups = heroes.map(hero => {
    const background = hero.querySelector('.wiki-cover-background');
    if (!background?.matches('.image, .has-video, .has-effect')) return () => {};
    const configuredStrength = Number(background.getAttribute('data-parallax'));
    const strength = Number.isFinite(configuredStrength) ? Math.max(0, Math.min(1, configuredStrength)) : 0;
    const fades = background.matches('.has-video, .image:not(.has-effect)');
    const documentRef = hero.ownerDocument;
    const windowRef = documentRef.defaultView;
    const motion = windowRef.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = null;
    let visible = true;

    function update() {
      frame = null;
      const rect = hero.getBoundingClientRect();
      if (fades) {
        const opacity = rect.height > 0 ? Math.max(0, Math.min(1, (rect.top + rect.height) / rect.height)) : 1;
        background.style.opacity = String(opacity);
      }
      if (motion.matches || strength === 0) {
        background.style.removeProperty('transform');
        background.style.removeProperty('--hero-parallax-inset');
        background.classList.remove('has-parallax');
        return;
      }
      background.style.setProperty('--hero-parallax-inset', `${-strength * 100}%`);
      background.classList.add('has-parallax');
      const offset = Math.max(-rect.height * strength, Math.min(rect.height * strength, -rect.top * strength));
      background.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
    function schedule() {
      if (frame === null && visible && !documentRef.hidden) frame = windowRef.requestAnimationFrame(update);
    }
    const observer = new windowRef.IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      // Commit the endpoint even when a large scroll moves the Hero offscreen.
      if (frame !== null) windowRef.cancelAnimationFrame(frame);
      update();
    });
    observer.observe(hero);
    const resize = new windowRef.ResizeObserver(schedule);
    resize.observe(hero);
    windowRef.addEventListener('scroll', schedule, { passive: true });
    windowRef.addEventListener('resize', schedule);
    documentRef.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', schedule);
    update();
    return () => {
      if (frame !== null) windowRef.cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      windowRef.removeEventListener('scroll', schedule);
      windowRef.removeEventListener('resize', schedule);
      documentRef.removeEventListener('visibilitychange', schedule);
      motion.removeEventListener('change', schedule);
      background.style.removeProperty('transform');
      background.style.removeProperty('--hero-parallax-inset');
      if (fades) background.style.removeProperty('opacity');
      background.classList.remove('has-parallax');
    };
  });
  const cleanup = () => cleanups.forEach(dispose => dispose());
  context.onCleanup?.(cleanup);
  return cleanup;
}
