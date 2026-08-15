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
