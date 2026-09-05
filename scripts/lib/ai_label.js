'use strict';

const { escapeHTML } = require('hexo-util');

const AI_LABELS = Object.freeze({
  manual: Object.freeze({ color: '#03a9f4', icon: 'default:shield-user' }),
  reviewed: Object.freeze({ color: '#4caf50', icon: 'default:shield-check' }),
  polished: Object.freeze({ color: '#4caf50', icon: 'default:shield-up' }),
  generated: Object.freeze({ color: '#ff9800', icon: 'default:shield-warning' })
});

// 文章 AI 成分标签（ai_label）：展示样式由主题内部固定。
// 文案由调用方传入（多语言系统提供），经 HTML 转义后输出；
// 文字使用配置色（无背景），缺 # 自动补全；可选 iconHtml 渲染在文案前；
// noColor 时输出不带内联样式（继承默认文字色，用于 banner 含图片场景）；
// 样式由调用方通过 extraClass 传入上下文类。

function normalizeColor(color) {
  if (color == null) {
    return '';
  }
  let text = String(color).trim();
  if (!text) {
    return '';
  }
  if (!text.startsWith('#')) {
    text = '#' + text;
  }
  return text;
}

function resolveAiKey(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(AI_LABELS, value) ? value : '';
}

function buildAiLabel(value, text, extraClass, iconHtml, noColor) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  const def = AI_LABELS[value];
  if (!def || typeof def !== 'object' || !text) {
    return '';
  }
  const cls = ['ai-label'];
  if (extraClass) {
    cls.unshift(extraClass);
  }
  const safeText = escapeHTML(String(text));
  const color = normalizeColor(def.color);
  const icon = iconHtml || '';
  const className = cls.join(' ');
  if (!noColor && color) {
    return `<span class="${className}" style="color:${color}">${icon}${safeText}</span>`;
  }
  return `<span class="${className}">${icon}${safeText}</span>`;
}

module.exports = { AI_LABELS, buildAiLabel, normalizeColor, resolveAiKey };
