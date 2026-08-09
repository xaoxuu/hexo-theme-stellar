# 修复 TOC 高亮始终落在最后一个标题

## 问题

滚动文章时，侧边栏 TOC 的激活高亮失效，始终高亮最后一个标题，且不会随滚动位置变化。

## 根因

`source/js/main.js` 的 `activeTOC()` 中通过 `$(this).scrollTop()` 获取滚动距离：

- 在 `c459d0b`（[feat] layout refactoring）之前，滚动事件用 jQuery `$(document, window).scroll(handler)` 绑定，jQuery 会把 `this` 绑定为滚动元素（window/document），因此能取到正确的滚动值。
- 重构后改为原生 `window.addEventListener('scroll', function () { activeTOC() ... })`，而 `activeTOC()` 是普通函数调用，不会继承外层 `this`。
- 构建产物经 Babel 转译后文件开头注入 `"use strict"`，严格模式下普通函数调用中的 `this` 为 `undefined`，`$(undefined).scrollTop()` 返回 `undefined`。
- `seg.offset().top > scrollTop + scrollOffset` 变成与 `NaN` 比较，恒为 `false`，所有标题都通过过滤，最终 `topSeg` 取到最后一个标题并高亮。

## 变更

- `source/js/main.js`：将 `var scrollTop = $(this).scrollTop()` 改为 `var scrollTop = $(window).scrollTop()`，显式读取窗口滚动位置，不再依赖 `this` 绑定。

## 影响范围

- 仅影响侧边栏 TOC 高亮与自动滚动定位（`activeTOC` / `scrollTOC`）。
- 不改变其他滚动逻辑（`scrollTOC` 通过 `.bind(this)` 调用，`this` 由 `addEventListener` 正确绑定为 window，不受影响）。

## 验收标准

1. 打开含多级标题的文章页。
2. 页面顶部时 TOC 无高亮（或首个标题在视口内时高亮首个）。
3. 向下滚动时，高亮跟随视口内最靠上的标题切换，不再恒为最后一个。
4. 构建验证：`npm run g && npx gulp minify` 通过。

## 验证记录

- 2026-08-09：修复后执行 `npm run g && npx gulp minify`，全量构建通过（204 个页面生成，HTML/CSS/JS 压缩无报错）。
- 编译产物 `public/js/main.js` 中 TOC 逻辑已变为 `$(window).scrollTop()`，不再存在 `$(this).scrollTop()`。
- 抽查 `public/blog/20250705/index.html`：`article.md-text` 内的标题 id（如 `整理思路`）与 `#data-toc` 中 `toc-link` 的编码 href（`#%E6%95%B4...`）经 `encodeURI()` 后能够精确匹配，高亮命中链路完整。
