// 文字自适应颜色 DOM 插件
// 扫描 [data-text-adaptive] 元素，解析背景来源（--adaptive-background → --cover-url → --bg-url →
// background-image → background-color），调用 stellar.color 计算文字颜色，
// 写入内联 --text-banner 与 --text-banner-theme；Wiki 封面另写入主题色蒙版变量。
// 属性值：
//   theme（默认）  背景图平均色 lighten/darken（两种变量同色）
//   contrast       黑白对比（两种变量同色）
//   split          大字（标题/headline）用 contrast，小字（caption/subtitle/面包屑等）用 theme
// 用户显式覆盖优先：元素已有内联 --text-banner 或内联 color 时跳过。
// 由 layout/_plugins/adaptive-text.ejs 在页面存在目标元素时懒加载。

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

// 解析图片背后的实际背景色（用于透明图的平均色合成）：
// 从元素自身沿祖先向上找第一个不透明 background-color（半透明视为继续向上），
// 最终兜底到 body 的 var(--background)，仍无则白色。
function resolveBackdrop(el) {
  var node = el;
  while (node && node.nodeType === 1) {
    var rgb = stellar.color.parse(window.getComputedStyle(node).backgroundColor);
    if (rgb && rgb.a >= 1) {
      return { r: rgb.r, g: rgb.g, b: rgb.b };
    }
    node = node.parentElement;
  }
  return { r: 255, g: 255, b: 255 };
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
  if (!el || !el.dispatchEvent || !document.createEvent) {
    return;
  }
  var event = document.createEvent('Event');
  event.initEvent('wiki-overlay-ready', true, false);
  el.dispatchEvent(event);
}

function applyToElement(el) {
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
    var backdrop = resolveBackdrop(el);
    stellar.color.getAverageColor(bg.url, { background: backdrop }).then(function (rgb) {
      if (rgb) {
        apply(rgb);
      } else if (styleName === 'split' && el.parentElement && (' ' + el.parentElement.className + ' ').indexOf(' wiki-card-cover ') !== -1) {
        // 平均色提取失败时不写变量，保留 CSS 回退色；但仍须解除 Wiki 覆盖层等待。
        notifyWikiOverlayReady(el);
      }
    });
  }
}

var adaptiveTextElements = [];
var appliedElements = new WeakSet();

function applyAdaptiveText(elements) {
  if (!window.stellar || !window.stellar.color || !elements || elements.length === 0) {
    return;
  }
  adaptiveTextElements = Array.prototype.slice.call(elements);
  for (var i = 0; i < elements.length; i++) {
    applyToElement(elements[i]);
  }
}

// 主题明暗切换时重算：透明背景图的合成背景随 data-theme 变化，颜色需重新计算
if (window.MutationObserver && document.documentElement) {
  new MutationObserver(function () {
    applyAdaptiveText(adaptiveTextElements);
    if (typeof window.refreshPinNavColor === 'function') {
      window.refreshPinNavColor();
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// 供轮播箭头等场景复用：解析元素背后实际渲染背景色
window.resolveAdaptiveBackdrop = resolveBackdrop;

window.applyAdaptiveText = applyAdaptiveText;
