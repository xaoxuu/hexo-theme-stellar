/* global hexo */
'use strict';

// 构建期生成客户端图标白名单文件：避免把 SVG 图标数据内联进每个页面的 defines。
// 与 layout/_partial/scripts/defines.ejs 中旧的白名单保持一致（客户端通过 ctx.icons 读取）。
hexo.extend.generator.register('stellar_icons', function () {
  const icons = (this.theme.config && this.theme.config.icons) || {};
  const keys = ['weibo:comment', 'default:loading-spinner', 'default:warning', 'weibo:repeat', 'weibo:like'];
  const out = {};
  // 去除 SVG 注释（避免 <!-- / </script> 解析风险），再转义 <
  for (const k of keys) {
    out[k] = ((icons[k]) || '').replace(/<!--[\s\S]*?-->/g, '');
  }
  const json = JSON.stringify(out).replace(/</g, '\\u003c');
  return {
    path: 'js/stellar-icons.js',
    data: 'window.stellarIcons = ' + json + ';\nif (typeof ctx !== "undefined" && ctx) { ctx.icons = window.stellarIcons; }\n'
  };
});

// 构建期生成按命名空间拆分的图标数据文件（js/icons/{ns}.json）：
// 供客户端加载器 /js/icons.js 对非首屏图标占位符（svg.icon[data-icon]）做异步原位替换。
// 数据源为合并后的 theme.config.icons（主题 _data/icons.yml + 站点 source/_data/icons.yml 覆盖），
// 仅收集内联 SVG 值（URL 值由服务端直接输出 <img>，无需下发）。
hexo.extend.generator.register('stellar_icon_sets', function () {
  const icons = (this.theme.config && this.theme.config.icons) || {};
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
