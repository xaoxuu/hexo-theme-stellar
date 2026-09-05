/* global hexo */
'use strict';

const { AI_LABELS, buildAiLabel, resolveAiKey } = require('../lib/ai_label');

// 文章 AI 成分标签：Collection / front matter 用 article.ai_label 标记，
// 文案由多语言系统提供（languages/*.yml 的 meta.ai_label.*，缺失时不渲染），
// 颜色与图标由主题内部固定。
hexo.extend.helper.register('ai_label', function(value, extraClass, noColor) {
  const key = resolveAiKey(value);
  if (!key) {
    return '';
  }
  const def = AI_LABELS[key];
  const iconHtml = (def && def.icon) ? hexo.utils.icon(def.icon) : '';
  const __ = (this && typeof this.__ === 'function') ? this.__ : hexo.theme.i18n.__(hexo.config.language);
  const i18nKey = 'meta.ai_label.' + key;
  const text = __(i18nKey);
  if (!text || text === i18nKey) {
    return '';
  }
  return buildAiLabel(key, text, extraClass, iconHtml, noColor);
});
