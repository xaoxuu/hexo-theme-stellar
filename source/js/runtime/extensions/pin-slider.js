export function mount(root, context) {
  let colorTimer;
  var colorController = null;
  var colorRevision = 0;
  var slider = root.matches?.('.pin-slider') ? root : root.querySelector('.pin-slider');
  if (!slider) return;
  var track = slider.querySelector('.pin-slider-track');
  var slides = slider.querySelectorAll('.pin-slide');
  var count = slides.length;
  if (!track || count <= 1) {
    // 单张幻灯片：直接把封面同步到 .pin-slider 自身背景（跟随 corner-shape）
    if (slides[0]) {
      slider.style.setProperty('--pin-cover-url', slides[0].style.getPropertyValue('--pin-cover-url') || '');
    }
    slider.style.visibility = 'visible';
    return;
  }
  var interval = parseInt(slider.getAttribute('data-interval'), 10) || 4000;
  var type = slider.getAttribute('data-key') || 'post';
  var group = slider.getAttribute('data-group') || 'post';
  var contentKey = type + '::' + Array.prototype.map.call(slides, function(a) {
    var link = a.querySelector('a.post-card, a.pin-slide');
    return link ? link.getAttribute('href') : a.getAttribute('href');
  }).join('|');
  var index = restorePinIndex(group, contentKey, count);
  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}
  slider.style.setProperty('--pin-duration', interval + 'ms');
  if (reduced) {
    slider.classList.add('reduced');
  }
  function goTo(n) {
    index = (n + count) % count;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    // 背景图由 .pin-slider 自身背景承载（跟随 corner-shape），随当前 slide 同步
    var active = slides[index];
    if (active) {
      slider.style.setProperty('--pin-cover-url', active.style.getPropertyValue('--pin-cover-url') || '');
    }
    var dots = slider.querySelector('.pin-slider-dots');
    var items = dots ? dots.children : [];
    for (var i = 0; i < count; i++) {
      if (!items[i]) continue;
      if (i === index) {
        items[i].classList.add('active');
        items[i].setAttribute('aria-current', 'true');
      } else {
        items[i].classList.remove('active');
        items[i].removeAttribute('aria-current');
      }
    }
    savePinIndex(group, contentKey, index, count);
    updateNavColor();
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  // 左右箭头颜色随当前幻灯片封面自适应（contrast：深色背景白箭头、浅色背景深箭头）
  var navColorRetries = 0;
  function updateNavColor() {
    var revision = ++colorRevision;
    colorController?.abort();
    colorController = new AbortController();
    var navs = slider.querySelectorAll('.pin-slider-nav');
    if (navs.length === 0) return;
    if (!window.stellar || !window.stellar.color?.getAverageColor) {
      // 懒加载的 color.js / 插件尚未就绪时重试
      if (navColorRetries < 25) {
        navColorRetries++;
        clearTimeout(colorTimer);
        colorTimer = setTimeout(updateNavColor, 200);
      }
      return;
    }
    var slide = slides[index];
    if (!slide) return;
    stellar.color.getAverageColor(slide.querySelector('.pin-slide-bg'), { signal: colorController.signal }).then(function (rgb) {
      if (revision !== colorRevision) return;
      if (!rgb) {
        for (var i = 0; i < navs.length; i++) navs[i].style.removeProperty('--text-banner');
        return;
      }
      var color = stellar.color.adaptiveTextColor(rgb, { style: 'contrast' });
      for (var i = 0; i < navs.length; i++) {
        navs[i].style.setProperty('--text-banner', color);
      }
    }).catch(error => {
      if (!colorController.signal.aborted && revision === colorRevision) context.reportError(error);
    });
  }
  window.refreshPinNavColor = updateNavColor;
  function start() {
    if (reduced) return;
    slider.classList.remove('paused');
  }
  function stop() {
    slider.classList.add('paused');
  }
  function onVis() {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  }
  var startX = null;
  var startY = null;
  function onTouchStart(e) {
    stop();
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }
  function onTouchEnd(e) {
    if (startX == null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    startX = null;
    startY = null;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        next();
      } else {
        prev();
      }
    }
    start();
  }
  var dotsEl = slider.querySelector('.pin-slider-dots');
  function onProgressEnd(e) {
    if (e.animationName === 'pin-slider-progress') {
      next();
    }
  }
  const onDotClick = function(e) {
      var btn = e.target.closest ? e.target.closest('.pin-slider-dot') : null;
      if (btn) {
        goTo(parseInt(btn.getAttribute('data-index'), 10) || 0);
      }
    };
  if (dotsEl) {
    dotsEl.addEventListener('click', onDotClick);
    dotsEl.addEventListener('animationend', onProgressEnd);
  }
  var navPrev = slider.querySelector('.pin-slider-nav.prev');
  var navNext = slider.querySelector('.pin-slider-nav.next');
  if (navPrev) {
    navPrev.addEventListener('click', prev);
  }
  if (navNext) {
    navNext.addEventListener('click', next);
  }
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', start);
  slider.addEventListener('touchstart', onTouchStart, { passive: true });
  slider.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  context.onCleanup(cleanup);
  // 初始化直接定位到缓存序号：先禁用过渡再恢复，避免每次进页面播放“从第一张滑过来”的动画
  track.style.transition = 'none';
  goTo(index);
  void track.offsetWidth;
  track.style.transition = '';
  slider.style.visibility = 'visible';
  start();
  function cleanup() {
    colorRevision++;
    colorController?.abort();
    clearTimeout(colorTimer);
    stop();
    slider.removeEventListener('mouseenter', stop);
    slider.removeEventListener('mouseleave', start);
    slider.removeEventListener('focusin', stop);
    slider.removeEventListener('focusout', start);
    slider.removeEventListener('touchstart', onTouchStart);
    slider.removeEventListener('touchend', onTouchEnd);
    if (dotsEl) {
      dotsEl.removeEventListener('click', onDotClick);
      dotsEl.removeEventListener('animationend', onProgressEnd);
    }
    if (navPrev) {
      navPrev.removeEventListener('click', prev);
    }
    if (navNext) {
      navNext.removeEventListener('click', next);
    }
    document.removeEventListener('visibilitychange', onVis);
    if (window.refreshPinNavColor === updateNavColor) {
      window.refreshPinNavColor = null;
    }
  }
  return cleanup;
}
function restorePinIndex(group, contentKey, count) {
  try {
    var raw = localStorage.getItem('stellar.pin-slider.' + group);
    if (!raw) return 0;
    var data = JSON.parse(raw);
    var sets = data && data.sets ? data.sets : {};
    var rec = sets[contentKey];
    if (rec && rec.t === count && rec.i >= 0 && rec.i < count) {
      return rec.i;
    }
  } catch (e) {}
  return 0;
}
function savePinIndex(group, contentKey, index, count) {
  try {
    var raw = localStorage.getItem('stellar.pin-slider.' + group);
    var data = raw ? JSON.parse(raw) : {};
    if (!data.sets) data.sets = {};
    data.sets[contentKey] = { i: index, t: count };
    localStorage.setItem('stellar.pin-slider.' + group, JSON.stringify(data));
  } catch (e) {}
}
