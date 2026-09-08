function queryAll(root, selector) { return Array.from(root.querySelectorAll(selector)); }

export async function mount(root, context) {
  const config = context.extension.config;
  await Promise.all([
    context.assets.style(config.assets.localCss),
    context.assets.style(config.assets.css),
    context.assets.script(config.assets.js)
  ]);
  context.signal?.throwIfAborted();
  const element = root.querySelector('#swiper-api');
  const instance = new window.Swiper(element, {
    slidesPerView: 'auto',
    spaceBetween: 8,
    centeredSlides: true,
    effect: element?.getAttribute('effect') || '',
    rewind: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
  });
  return () => instance.destroy?.(true, true);
}
