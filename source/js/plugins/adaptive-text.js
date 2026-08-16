// 文字自适应颜色 DOM 插件
// 扫描 [data-text-adaptive] 元素，解析背景来源（--cover-url → --bg-url →
// background-image → background-color），调用 stellar.color 计算文字颜色，
// 写入内联 --text-banner 与 --text-banner-theme。
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

// 单样式模式：--text-banner 与 --text-banner-theme 取同一颜色，保持容器内文字一致
function setTextColor(el, styleName, rgb) {
  var result = stellar.color.adaptiveTextColor(rgb, { style: styleName });
  if (result) {
    el.style.setProperty('--text-banner', result);
    el.style.setProperty('--text-banner-theme', result);
  }
}

// split 模式：大字用 contrast（黑白对比），小字用 theme（平均色 lighten/darken）
function setSplitTextColors(el, rgb) {
  var contrast = stellar.color.adaptiveTextColor(rgb, { style: 'contrast' });
  var theme = stellar.color.adaptiveTextColor(rgb, { style: 'theme' });
  if (contrast) {
    el.style.setProperty('--text-banner', contrast);
  }
  if (theme) {
    el.style.setProperty('--text-banner-theme', theme);
  }
}

function applyToElement(el) {
  // 用户显式覆盖优先：元素已有内联 --text-banner 或内联 color 时跳过
  if (el.style.getPropertyValue('--text-banner') || el.style.color) {
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
  };
  if (bg.type === 'color') {
    apply(bg.rgb);
  } else {
    stellar.color.getAverageColor(bg.url).then(function (rgb) {
      if (rgb) {
        apply(rgb);
      }
    });
  }
}

function applyAdaptiveText(elements) {
  if (!window.stellar || !window.stellar.color || !elements || elements.length === 0) {
    return;
  }
  for (var i = 0; i < elements.length; i++) {
    applyToElement(elements[i]);
  }
}

window.applyAdaptiveText = applyAdaptiveText;
