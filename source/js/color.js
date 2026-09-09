/* global module */
// 文字自适应颜色通用能力（浏览器挂载 window.stellar.color，Node 复用纯计算）
// 由 runtime adaptive-text adapter 按需加载；图片取样与缓存由 runtime/image-color.js 负责。
// 样式1（contrast）：背景深色 → 白色文字，背景浅色 → 深色文字。
// 样式2（theme）：以背景图平均色为基色，背景偏暗 → lighten 到高亮度，
//                背景偏亮 → darken 到低亮度（保留色相与饱和度）。
(function () {
  'use strict';

  var color = {};

  // 颜色字符串 → {r,g,b,a}（a 为 0~1 透明度，默认 1）；
  // 支持 #rgb/#rrggbb/#rrggbbaa、rgb()/rgba()、hsl()/hsla()（逗号与空格/斜杠语法）。
  // 解析失败返回 null。
  color.parse = function (input) {
    if (input == null) {
      return null;
    }
    var str = String(input).trim();
    var a = 1;
    if (str.charAt(0) === '#') {
      var hex = str.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map(function (c) {
          return c + c;
        }).join('');
      }
      if (hex.length === 6 || hex.length === 8) {
        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) {
          a = parseInt(hex.slice(6, 8), 16) / 255;
        }
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return { r: r, g: g, b: b, a: a };
        }
      }
      return null;
    }
    var m = str.match(/rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,\s/]\s*([\d.]+%?))?\s*\)/i);
    if (m) {
      var r2 = Number(m[1]);
      var g2 = Number(m[2]);
      var b2 = Number(m[3]);
      if (!isNaN(r2) && !isNaN(g2) && !isNaN(b2)) {
        if (m[4] != null) {
          a = m[4].charAt(m[4].length - 1) === '%' ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
        }
        return { r: r2, g: g2, b: b2, a: a };
      }
    }
    var hm = str.match(/hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)(?:\s*[,\s/]\s*([\d.]+%?))?\s*\)/i);
    if (hm) {
      var hue = Number(hm[1]);
      var sat = hm[2].charAt(hm[2].length - 1) === '%' ? Number(hm[2].slice(0, -1)) / 100 : Number(hm[2]);
      var lig = hm[3].charAt(hm[3].length - 1) === '%' ? Number(hm[3].slice(0, -1)) / 100 : Number(hm[3]);
      if (!isNaN(hue) && !isNaN(sat) && !isNaN(lig)) {
        if (hm[4] != null) {
          a = hm[4].charAt(hm[4].length - 1) === '%' ? Number(hm[4].slice(0, -1)) / 100 : Number(hm[4]);
        }
        var h = ((hue % 360) + 360) % 360 / 360;
        var rgb = hslToRgb(h, Math.max(0, Math.min(1, sat)), Math.max(0, Math.min(1, lig)));
        return { r: rgb.r, g: rgb.g, b: rgb.b, a: a };
      }
    }
    return null;
  };

  // WCAG 相对亮度（0~1）
  color.luminance = function (rgb) {
    if (rgb == null) {
      return null;
    }
    var linearize = function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
  };

  // 亮度是否偏暗，threshold 默认 0.5
  color.isDark = function (rgb, threshold) {
    var lum = color.luminance(rgb);
    if (lum == null) {
      return false;
    }
    return lum < (threshold == null ? 0.5 : threshold);
  };

  function rgbToHsl(rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    if (s === 0) {
      var gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }
    var hue2rgb = function (p, q, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    };
  }

  function rgbString(rgb) {
    return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
  }

  // 设定 HSL 明度目标（0~1），保留色相与饱和度
  color.withLightness = function (rgb, lightness) {
    if (rgb == null) {
      return null;
    }
    var hsl = rgbToHsl(rgb);
    var target = Math.max(0, Math.min(1, lightness));
    return rgbString(hslToRgb(hsl.h, hsl.s, target));
  };

  // 浅色化：把明度调整到 lightness（默认 0.85）
  color.lighten = function (rgb, lightness) {
    return color.withLightness(rgb, lightness == null ? 0.85 : lightness);
  };

  // 深色化：把明度调整到 lightness（默认 0.3）
  color.darken = function (rgb, lightness) {
    return color.withLightness(rgb, lightness == null ? 0.3 : lightness);
  };

  // 主题色饱和度增强：平均色被大面积中性色盖过时饱和度极低（色相仍有效），
  // 把低饱和度抬升到最低可见值（保留色相），让主题文字带出图片的主色倾向；
  // 完全中性（无可靠色相）与已足够饱和的颜色不做处理。
  color.enhanceSaturation = function (rgb, options) {
    if (rgb == null) {
      return null;
    }
    var opts = options || {};
    var minS = opts.minSaturation == null ? 0.3 : opts.minSaturation;
    var boostBelow = opts.boostBelow == null ? 0.2 : opts.boostBelow;
    var epsilon = opts.neutralEpsilon == null ? 0.02 : opts.neutralEpsilon;
    var hsl = rgbToHsl(rgb);
    if (hsl.s >= boostBelow || hsl.s < epsilon) {
      return { r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a == null ? 1 : rgb.a };
    }
    var out = hslToRgb(hsl.h, Math.max(hsl.s, minS), hsl.l);
    return { r: out.r, g: out.g, b: out.b, a: rgb.a == null ? 1 : rgb.a };
  };

  // 自适应文字颜色
  // bg：{r,g,b} 或颜色字符串
  // options：
  //   style           'theme'（默认）/ 'contrast'
  //   threshold       明暗判定阈值，默认按 effectiveThreshold（彩色背景 0.65 / 中性背景 0.6，
  //                   偏向采纳浅色文字，避免中灰背景频繁翻转）
  //   lightColor      样式1 深色背景时的文字色，默认 #ffffff
  //   darkColor       样式1 浅色背景时的文字色，默认 #111111
  //   lightLightness  样式2 深色背景时的目标明度，默认 0.85
  //   darkLightness   样式2 浅色背景时的目标明度，默认 0.3
  //   saturationScale 样式2 饱和度缩放（0~1，默认 1）：调小更接近黑白，仅保留一点主色倾向
  color.adaptiveTextColor = function (bg, options) {
    var opts = options || {};
    var rgb = (bg != null && typeof bg === 'object') ? bg : color.parse(bg);
    if (rgb == null) {
      return null;
    }
    var style = opts.style || 'theme';
    var threshold = opts.threshold == null ? color.effectiveThreshold(rgb) : opts.threshold;
    var dark = color.isDark(rgb, threshold);
    if (style === 'contrast') {
      return dark ? (opts.lightColor || '#ffffff') : (opts.darkColor || '#111111');
    }
    var base = color.enhanceSaturation(rgb);
    var hsl = rgbToHsl(base);
    if (opts.saturationScale != null) {
      hsl.s = hsl.s * Math.max(0, Math.min(1, opts.saturationScale));
    }
    var target = dark
      ? (opts.lightLightness == null ? 0.85 : opts.lightLightness)
      : (opts.darkLightness == null ? 0.3 : opts.darkLightness);
    return rgbString(hslToRgb(hsl.h, hsl.s, target));
  };

  // 有效明暗阈值：彩色背景（饱和度 > 0.2）更偏向浅色文字，阈值上浮 0.05；
  // 中性灰背景保持基础阈值，避免浅灰图配浅字。
  color.effectiveThreshold = function (rgb, base) {
    var threshold = base == null ? 0.6 : base;
    var hsl = rgbToHsl(rgb);
    return hsl.s > 0.2 ? threshold + 0.05 : threshold;
  };

  // Storage units: hue degrees, saturation/lightness percent, alpha 0–1.
  color.toHsla = function (rgba) {
    var hsl = rgbToHsl(rgba);
    return [hsl.h * 360, hsl.s * 100, hsl.l * 100, rgba.a / 255]
      .map(function (value) { return Math.round(value * 10000) / 10000; });
  };

  color.validHsla = function (value) {
    return Array.isArray(value) && value.length === 4 && value.every(function (channel, index) {
      return Number.isFinite(channel) && channel >= 0 && channel <= [360, 100, 100, 1][index];
    });
  };

  // Alpha is retained as metadata, but adaptive text does not composite a backdrop.
  color.fromHsla = function (hsla) {
    return color.validHsla(hsla) ? hslToRgb(hsla[0] / 360, hsla[1] / 100, hsla[2] / 100) : null;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = color;
    return;
  }

  var root = typeof window !== 'undefined' ? window : {};
  root.stellar = root.stellar || {};
  root.stellar.color = color;
})();
