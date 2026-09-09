// 文字自适应颜色 DOM 插件
// 扫描 [data-text-adaptive] 元素，解析背景来源（--adaptive-background → --cover-url → --bg-url →
// background-image → background-color），调用 stellar.color 计算文字颜色，
// 写入内联 --text-banner 与 --text-banner-theme；Wiki 封面另写入主题色蒙版变量。
// 属性值：
//   theme（默认）  背景图平均色 lighten/darken（两种变量同色）
//   contrast       黑白对比（两种变量同色）
//   split          大字（标题/headline）用 contrast，小字（caption/subtitle/面包屑等）用 theme
// 用户显式覆盖优先：元素已有内联 --text-banner 或内联 color 时跳过。
// 由 runtime feature adapter 在页面存在目标元素时按需加载并挂载。

function parseCssUrl(value) {
  if (!value) {
    return null;
  }
  var m = String(value).trim().match(/url\((['"]?)(.*?)\1\)/i);
  return m ? m[2] : null;
}

function resolveBackground(el) {
  var style = window.getComputedStyle(el);
  var adaptiveBackground = stellar.color.parse(style.getPropertyValue('--adaptive-background'));
  if (adaptiveBackground) {
    return { type: 'color', rgb: adaptiveBackground };
  }
  var cover = parseCssUrl(style.getPropertyValue('--cover-url'));
  if (cover) {
    return { type: 'image', url: cover };
  }
  var pinCover = parseCssUrl(style.getPropertyValue('--pin-cover-url'));
  if (pinCover) {
    return { type: 'image', url: pinCover };
  }
  var bg = parseCssUrl(style.getPropertyValue('--bg-url'));
  if (bg) {
    return { type: 'image', url: bg };
  }
  var bgImage = style.backgroundImage;
  if (bgImage && bgImage !== 'none') {
    var url = parseCssUrl(bgImage);
    if (url && url !== 'none') {
      return { type: 'image', url: url };
    }
  }
  var bgColor = style.backgroundColor;
  if (bgColor && bgColor !== 'transparent' && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(bgColor)) {
    var rgb = stellar.color.parse(bgColor);
    if (rgb) {
      return { type: 'color', rgb: rgb };
    }
  }
  return null;
}

// Restrict lookup to the owning visual component, never a same-URL image elsewhere on the page.
function resolveImage(el, url) {
  var owner = el.closest('.banner, .cover, .wiki-card-cover, .pin-slide, .wiki-hero');
  if (!owner) return null;
  var expected;
  try { expected = new URL(url, el.ownerDocument.baseURI).href; } catch (e) { return null; }
  return Array.from(owner.querySelectorAll('img')).find(function (image) {
    return [image.currentSrc, image.getAttribute('data-src'), image.getAttribute('src')].some(function (src) {
      try { return src && new URL(src, el.ownerDocument.baseURI).href === expected; } catch (e) { return false; }
    });
  }) || null;
}

// 单样式模式：--text-banner 与 --text-banner-theme 取同一颜色，保持容器内文字一致
function setTextColor(el, styleName, rgb) {
  var result = stellar.color.adaptiveTextColor(rgb, { style: styleName });
  if (result) {
    el.style.setProperty('--text-banner', result);
    el.style.setProperty('--text-banner-theme', result);
  }
}

// split 模式：大字用低饱和 theme（接近黑白，保留一点主色倾向），小字用完整 theme
function setSplitTextColors(el, rgb) {
  // 大字更接近黑白：只保留 5% 饱和度（值越大越接近完整主题色，越小越接近黑白，0 为纯灰）
  var large = stellar.color.adaptiveTextColor(rgb, { style: 'theme', saturationScale: 0.05 });
  var theme = stellar.color.adaptiveTextColor(rgb, { style: 'theme' });
  if (large) {
    el.style.setProperty('--text-banner', large);
  }
  if (theme) {
    el.style.setProperty('--text-banner-theme', theme);
  }
}

// Wiki 卡片的 Today 风格内容层使用封面平均色：保留色相，增强弱饱和度后压低明度，
// 让满不透明蒙版下的白色文字始终可读。变量写到 .wiki-card：蒙版用深色版本，
// hover 边框使用同源但提高 20 个明度点的版本。
function setWikiOverlayColor(el, rgb) {
  var node = el.parentElement;
  while (node && node.nodeType === 1) {
    if ((' ' + node.className + ' ').indexOf(' wiki-card ') !== -1) {
      var themed = stellar.color.enhanceSaturation(rgb, { minSaturation: 0.45, boostBelow: 0.35 });
      var overlay = stellar.color.darken(themed, 0.26);
      var border = stellar.color.lighten(themed, 0.46);
      if (overlay) {
        node.style.setProperty('--wiki-overlay-color', overlay);
      }
      if (border) {
        node.style.setProperty('--wiki-border-color', border);
      }
      return;
    }
    node = node.parentElement;
  }
}

// Wiki 卡片主题色确定后（包括提取失败时的 CSS 回退）通知索引页。
// 覆盖层会同时等待原图 load，避免先用默认主题色绘制、再切换为平均色。
function notifyWikiOverlayReady(el) {
  var ownerDocument = el && el.ownerDocument;
  if (!el || !el.dispatchEvent || !ownerDocument || !ownerDocument.createEvent) {
    return;
  }
  var event = ownerDocument.createEvent('Event');
  event.initEvent('wiki-overlay-ready', true, false);
  el.dispatchEvent(event);
}

function applyToElement(el, isActive, signal) {
  // 用户显式覆盖优先：首次处理时元素已有内联 --text-banner 或内联 color 则跳过
  // （插件自身写入的变量不视为用户覆盖，主题切换重算时需重新应用）
  var isFirst = !appliedElements.has(el);
  if (isFirst && (el.style.getPropertyValue('--text-banner') || el.style.color)) {
    return;
  }
  var bg = resolveBackground(el);
  if (!bg) {
    return;
  }
  var styleName = el.getAttribute('data-text-adaptive') || 'theme';
  var apply = function (rgb) {
    if (styleName === 'split') {
      setSplitTextColors(el, rgb);
    } else {
      setTextColor(el, styleName, rgb);
    }
    if (styleName === 'split' && el.parentElement && (' ' + el.parentElement.className + ' ').indexOf(' wiki-card-cover ') !== -1) {
      setWikiOverlayColor(el, rgb);
      notifyWikiOverlayReady(el);
    }
    appliedElements.add(el);
  };
  if (bg.type === 'color') {
    apply(bg.rgb);
  } else {
    stellar.color.getAverageColor(resolveImage(el, bg.url), { signal: signal }).then(function (rgb) {
      if (!isActive() || signal?.aborted || resolveBackground(el)?.url !== bg.url) return;
      if (rgb) {
        apply(rgb);
      } else {
        if (appliedElements.has(el)) {
          el.style.removeProperty('--text-banner');
          el.style.removeProperty('--text-banner-theme');
        }
        if (styleName === 'split' && el.parentElement && (' ' + el.parentElement.className + ' ').indexOf(' wiki-card-cover ') !== -1) {
          var card = el.closest('.wiki-card');
          card?.style.removeProperty('--wiki-overlay-color');
          card?.style.removeProperty('--wiki-border-color');
          // Pixel access is best effort; always release the overlay's wait.
          notifyWikiOverlayReady(el);
        }
      }
    });
  }
}

var appliedElements = new WeakSet();
var pendingElements = new WeakMap();

function applyAdaptiveText(elements, isActive, controllers) {
  if (!window.stellar || !window.stellar.color || !elements || elements.length === 0) {
    return;
  }
  var active = typeof isActive === 'function' ? isActive : function () { return true; };
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var pending = controllers || pendingElements;
    pending.get(el)?.abort();
    var controller = new AbortController();
    pending.set(el, controller);
    applyToElement(el, active, controller.signal);
  }
}

function mountAdaptiveText(elements) {
  var active = true;
  var mountedElements = Array.prototype.slice.call(elements || []);
  var ownerDocument = mountedElements[0] && mountedElements[0].ownerDocument;
  var observer = null;
  var isActive = function () { return active; };
  var controllers = new Map();
  var refresh = function () { applyAdaptiveText(mountedElements, isActive, controllers); };
  refresh();
  var onImageLoad = function (event) {
    if (event.target?.tagName !== 'IMG') return;
    var affected = mountedElements.filter(function (el) {
      var bg = resolveBackground(el);
      return bg?.type === 'image' && resolveImage(el, bg.url) === event.target;
    });
    applyAdaptiveText(affected, isActive, controllers);
  };
  ownerDocument?.addEventListener('load', onImageLoad, true);
  ownerDocument?.addEventListener('error', onImageLoad, true);
  // 主题明暗切换时重算：透明背景图的合成背景随 data-theme 变化，颜色需重新计算
  if (window.MutationObserver && ownerDocument && ownerDocument.documentElement) {
    observer = new MutationObserver(function () {
      refresh();
      if (typeof window.refreshPinNavColor === 'function') {
        window.refreshPinNavColor();
      }
    });
    observer.observe(ownerDocument.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  return function () {
    active = false;
    controllers.forEach(function (controller) { controller.abort(); });
    ownerDocument?.removeEventListener('load', onImageLoad, true);
    ownerDocument?.removeEventListener('error', onImageLoad, true);
    mountedElements = [];
    observer?.disconnect();
    observer = null;
  };
}

// 供轮播箭头等场景复用：解析元素背后实际渲染背景色

window.applyAdaptiveText = applyAdaptiveText;
window.stellarAdaptiveText = { mount: mountAdaptiveText };
