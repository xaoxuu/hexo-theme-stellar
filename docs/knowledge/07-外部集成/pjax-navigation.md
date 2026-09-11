---
title: 页面导航与预加载
domain: 外部集成
tags:
  - 导航
  - 预加载
  - flying_pages
  - PJAX
---

# 页面导航与预加载

## 当前导航机制

`features.partial_navigation.enabled` 默认开启。同一 Collection 且页面外壳签名一致时，只替换正文与右栏，同步页面元数据、选中导航、Runtime Manifest 和历史滚动位置。Topbar、Leftbar 与文档级 Extension 保持挂载；页面级 Extension 在替换前卸载，再按新 Manifest 挂载。

构建期只标记已知的同集合链接。含未受主题管理的可执行脚本、跨集合或外壳不一致的页面继续整页导航；请求失败、重定向、非 HTML 响应或目标签名不匹配也回退整页导航。局部插入的 HTML 不重放脚本。关闭此功能可恢复全站普通导航。

```yaml
features:
  partial_navigation:
    enabled: true
  link_prefetch:
    enabled: true
```

## Link Prefetch 链接预取

Flying Pages 由独立 Extension 在脚本加载后显式初始化，可通过 `features.link_prefetch.js` 覆盖资源。预取和局部导航各自控制；预取不保证目标页面满足局部替换条件。

## 锚点与滚动恢复

局部导航记录历史滚动位置，处理前进、后退和锚点定位。连续导航取消过期请求，并串行提交页面替换。卸载时恢复浏览器原有滚动恢复设置。

相关源码：[构建期导航](../../../scripts/lib/partial-navigation.js)、[浏览器导航](../../../source/js/runtime/extensions/partial-navigation.js)、[链接预取](../../../source/js/runtime/extensions/link-prefetch.js)、[页面初始化](../../../source/js/navigation-init.js)。

## 宿主压缩

主题在 after_init 和 before_generate 为 hexo-minify.exclude 补入 `**/js/runtime/**`，保留已有排除项。其它 Babel／压缩链仍须保留 Runtime 原生 ESM、顶层 await 和相对导入；普通脚本可按宿主策略处理。
