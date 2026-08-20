/*
 * Card hover spotlight adapted from React Bits Spotlight Card:
 * https://github.com/DavidHDev/react-bits
 */

(function () {
  'use strict';

  window.stellar = window.stellar || {};

  const DEFAULT_SPOTLIGHT_COLOR = 'rgba(255, 255, 255, 0.25)';
  const DEFAULT_MAX_TILT = 3;
  const MAX_TILT_LIMIT = 8;
  const mounted = new Map();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let lifecycleBound = false;

  function normalizeConfig() {
    const raw = typeof ctx !== 'undefined' && ctx.card_hover ? ctx.card_hover : {};
    let maxTilt = Number(raw.maxTilt);
    if (raw.maxTilt === null || raw.maxTilt === '' || !Number.isFinite(maxTilt)) {
      maxTilt = DEFAULT_MAX_TILT;
    }
    maxTilt = Math.max(0, Math.min(MAX_TILT_LIMIT, maxTilt));

    let spotlightColor = typeof raw.spotlightColor === 'string' && raw.spotlightColor.trim()
      ? raw.spotlightColor.trim()
      : DEFAULT_SPOTLIGHT_COLOR;
    if (window.CSS && typeof window.CSS.supports === 'function' && !window.CSS.supports('color', spotlightColor)) {
      spotlightColor = DEFAULT_SPOTLIGHT_COLOR;
    }
    return { maxTilt: maxTilt, spotlightColor: spotlightColor };
  }

  function canAnimate() {
    return !reduceMotion.matches && finePointer.matches;
  }

  function requestFrame(state) {
    if (state.frame !== null) return;
    state.frame = window.requestAnimationFrame(function () {
      state.frame = null;
      if (!state.pointer || !document.documentElement.contains(state.element)) return;
      const rect = state.element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = Math.max(0, Math.min(rect.width, state.pointer.x - rect.left));
      const y = Math.max(0, Math.min(rect.height, state.pointer.y - rect.top));
      const normalizedX = x / rect.width * 2 - 1;
      const normalizedY = y / rect.height * 2 - 1;

      state.element.style.setProperty('--card-hover-mouse-x', x + 'px');
      state.element.style.setProperty('--card-hover-mouse-y', y + 'px');
      if (state.hasTilt) {
        state.element.style.setProperty('--card-hover-rotate-x', (-normalizedY * state.maxTilt).toFixed(3) + 'deg');
        state.element.style.setProperty('--card-hover-rotate-y', (normalizedX * state.maxTilt).toFixed(3) + 'deg');
      }
    });
  }

  function cancelFrame(state) {
    if (state.frame !== null) {
      window.cancelAnimationFrame(state.frame);
      state.frame = null;
    }
  }

  function resetSpotlightPosition(state) {
    state.element.style.setProperty('--card-hover-mouse-x', '50%');
    state.element.style.setProperty('--card-hover-mouse-y', '50%');
  }

  function deactivatePointer(state) {
    cancelFrame(state);
    state.pointer = null;
    state.element.classList.remove('is-card-hover-active');
    state.element.style.setProperty('--card-hover-rotate-x', '0deg');
    state.element.style.setProperty('--card-hover-rotate-y', '0deg');
    if (!state.spotlight || state.element.matches(':focus-within')) {
      resetSpotlightPosition(state);
    }
  }

  function resetState(state) {
    deactivatePointer(state);
    resetSpotlightPosition(state);
  }

  function unmount(state) {
    resetState(state);
    state.element.removeEventListener('pointerenter', state.onPointerEnter);
    state.element.removeEventListener('pointermove', state.onPointerMove);
    state.element.removeEventListener('pointerleave', state.onPointerLeave);
    state.element.removeEventListener('focusin', state.onFocusIn);
    if (state.spotlight) {
      state.spotlight.removeEventListener('transitionend', state.onSpotlightTransitionEnd);
    }
    state.element.classList.remove('is-card-hover-ready');
    if (state.spotlight && state.spotlight.parentNode === state.element) {
      state.spotlight.remove();
    }
    mounted.delete(state.element);
  }

  function unmountAll(root) {
    Array.from(mounted.values()).forEach(function (state) {
      if (!root || state.element === root || (typeof root.contains === 'function' && root.contains(state.element))) {
        unmount(state);
      }
    });
  }

  function mount(element) {
    if (!element || mounted.has(element) || !canAnimate()) return;
    const hasSpotlight = element.classList.contains('card-hover--spotlight');
    const hasTilt = element.classList.contains('card-hover--tilt');
    if (!hasSpotlight && !hasTilt) return;

    const config = normalizeConfig();
    document.documentElement.style.setProperty('--card-hover-spotlight-color', config.spotlightColor);
    let spotlight = null;
    if (hasSpotlight) {
      spotlight = document.createElement('span');
      spotlight.className = 'card-hover__spotlight';
      spotlight.setAttribute('aria-hidden', 'true');
      element.appendChild(spotlight);
    }

    const state = {
      element: element,
      spotlight: spotlight,
      hasTilt: hasTilt,
      maxTilt: config.maxTilt,
      frame: null,
      pointer: null,
      onPointerEnter: null,
      onPointerMove: null,
      onPointerLeave: null,
      onFocusIn: null,
      onSpotlightTransitionEnd: null
    };
    state.onPointerEnter = function (event) {
      state.pointer = { x: event.clientX, y: event.clientY };
      element.classList.add('is-card-hover-active');
      requestFrame(state);
    };
    state.onPointerMove = function (event) {
      state.pointer = { x: event.clientX, y: event.clientY };
      requestFrame(state);
    };
    state.onPointerLeave = function () {
      deactivatePointer(state);
    };
    state.onFocusIn = function () {
      if (!element.classList.contains('is-card-hover-active')) {
        resetSpotlightPosition(state);
      }
    };
    state.onSpotlightTransitionEnd = function (event) {
      if (event.target !== spotlight || event.propertyName !== 'opacity') return;
      if (element.classList.contains('is-card-hover-active') || element.matches(':focus-within')) return;
      resetSpotlightPosition(state);
    };

    element.addEventListener('pointerenter', state.onPointerEnter, { passive: true });
    element.addEventListener('pointermove', state.onPointerMove, { passive: true });
    element.addEventListener('pointerleave', state.onPointerLeave, { passive: true });
    element.addEventListener('focusin', state.onFocusIn);
    if (spotlight) {
      spotlight.addEventListener('transitionend', state.onSpotlightTransitionEnd);
    }
    element.classList.add('is-card-hover-ready');
    mounted.set(element, state);
  }

  function mountAll(root) {
    bindLifecycle();
    if (!canAnimate()) {
      unmountAll();
      return;
    }
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    if (scope.nodeType === 1 && scope.matches('.card-hover')) {
      mount(scope);
    }
    scope.querySelectorAll('.card-hover').forEach(mount);
  }

  function resetAll() {
    mounted.forEach(resetState);
  }

  function handleMotionPreference() {
    if (canAnimate()) {
      mountAll(document);
    } else {
      unmountAll();
    }
  }

  function handleRenderedMarkdown(event) {
    const target = event.detail && event.detail.target ? event.detail.target : document;
    mountAll(target);
  }

  function handleVisibility() {
    if (document.hidden) resetAll();
  }

  function addMediaListener(media, listener) {
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
    } else if (typeof media.addListener === 'function') {
      media.addListener(listener);
    }
  }

  function removeMediaListener(media, listener) {
    if (typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', listener);
    } else if (typeof media.removeListener === 'function') {
      media.removeListener(listener);
    }
  }

  function bindLifecycle() {
    if (lifecycleBound) return;
    lifecycleBound = true;
    addMediaListener(reduceMotion, handleMotionPreference);
    addMediaListener(finePointer, handleMotionPreference);
    document.addEventListener('stellar:mdrender', handleRenderedMarkdown);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', resetAll);
  }

  function destroy() {
    unmountAll();
    if (!lifecycleBound) return;
    lifecycleBound = false;
    removeMediaListener(reduceMotion, handleMotionPreference);
    removeMediaListener(finePointer, handleMotionPreference);
    document.removeEventListener('stellar:mdrender', handleRenderedMarkdown);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', resetAll);
    document.documentElement.style.removeProperty('--card-hover-spotlight-color');
  }

  stellar.cardHover = {
    mountAll: mountAll,
    unmountAll: unmountAll,
    destroy: destroy
  };
})();
