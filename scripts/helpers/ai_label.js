/* global hexo */
'use strict';

const { buildAiLabel, resolveAiKey } = require('../lib/ai_label');

// 文章 AI 成分标签：front-matter 用 ai_label: manual / reviewed / polished / generated 标记，
// 未设置时取配置 content.article.ai_label.default（为空则不渲染）；
// 文案由多语言系统提供（languages/*.yml 的 meta.ai_label.*，缺失时不渲染），
// 颜色与可选图标由冻结配置 content.article.ai_label 提供。
hexo.extend.helper.register('ai_label', function(value, extraClass, noColor) {
  const labelConfig = hexo.stellar.config.content.article.aiLabel;
  const key = resolveAiKey(value, labelConfig);
  if (key && (!labelConfig || !labelConfig[key])) {
    console.warn('[ai_label] 未知的 ai_label 值: ' + key);
  }
  if (!key) {
    return '';
  }
  const def = labelConfig && labelConfig[key];
  const iconHtml = (def && def.icon) ? hexo.utils.icon(def.icon) : '';
  const __ = (this && typeof this.__ === 'function') ? this.__ : hexo.theme.i18n.__(hexo.config.language);
  const i18nKey = 'meta.ai_label.' + key;
  const text = __(i18nKey);
  if (!text || text === i18nKey) {
    return '';
  }
  return buildAiLabel(key, labelConfig, text, extraClass, iconHtml, noColor);
});
