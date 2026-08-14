'use strict';

const { escapeHTML } = require('hexo-util');

// 文章 AI 成分标签（ai_label）：颜色规范化 + 标签 HTML 生成。
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

// 解析实际生效的标签键：文章设置 ai_label 时优先使用，否则取配置 default（为空则不渲染）
function resolveAiKey(value, labelConfig) {
  if (value && typeof value === 'string') {
    return value;
  }
  return (labelConfig && labelConfig.default) || '';
}

function buildAiLabel(value, labelConfig, text, extraClass, iconHtml, noColor) {
  if (!value || typeof value !== 'string' || !labelConfig || typeof labelConfig !== 'object') {
    return '';
  }
  const def = labelConfig[value];
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

module.exports = { buildAiLabel, normalizeColor, resolveAiKey };
