/* global hexo */
'use strict';

const { clientAssets, resetClientAssets } = require('../lib/client-assets');

hexo.extend.filter.register('before_generate', resetClientAssets, 2);
// The existing client data request also carries site-wide config; each page keeps only page values.
hexo.extend.generator.register('stellar_icons', function () {
  return Object.values(clientAssets(this)).map(({ path, data }) => ({ path, data }));
});

// 构建期生成按命名空间拆分的图标数据文件（js/icons/{ns}.json）：
// 供 deferred-icons Runtime Extension 对非首屏图标占位符做异步原位替换。
// 数据源为合并后的 stellar.data.icons（主题 _data/icons.yml + 站点 source/_data/icons.yml 覆盖），
// 仅收集内联 SVG 值（URL 值由服务端直接输出 <img>，无需下发）。
hexo.extend.generator.register('stellar_icon_sets', function () {
  const icons = this.stellar?.data?.icons || {};
  const sets = {};
  for (const key of Object.keys(icons)) {
    const value = icons[key];
    if (typeof value !== 'string' || !value.trim().startsWith('<svg')) {
      continue;
    }
    const ns = key.split(':')[0];
    if (ns.length === 0) {
      continue;
    }
    if (!sets[ns]) {
      sets[ns] = {};
    }
    // 去除 SVG 注释，避免注释内容在注入 HTML 时引发解析问题
    sets[ns][key] = value.replace(/<!--[\s\S]*?-->/g, '');
  }
  return Object.keys(sets).map((ns) => ({
    path: `js/icons/${ns}.json`,
    data: JSON.stringify({ [ns]: sets[ns] })
  }));
});

// Preserve the merged image:onerror source, including attribution inside SVG data.
hexo.extend.generator.register('stellar_image_fallback', function () {
  return require('../lib/image-fallback').imageFallbackAsset(this.utils.iconData('image:onerror')) || [];
});
