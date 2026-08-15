---
title: 恢复标题锚点等页内链接的平滑滚动
date: 2026-08-15
status: 已实施
---

# 恢复标题锚点等页内链接的平滑滚动

## 1. 问题与目标

- 要解决的问题：点击标题左侧的 `.headerlink` 锚点（`#`/`=`/`|`/`:` 徽标）、`{% navbar %}` 页内导航、脚注回链等原生 `#` 链接时，页面瞬时跳转、无平滑动画。
- 根因：`a446a2f`（remove smooth_scroll config option）删除了全局 `scroll-behavior: smooth`，但只把 TOC、回到顶部、参与讨论、wiki `#start` 按钮收敛到 JS 显式平滑（`smoothScrollTo`），标题锚点等原生链接没有 JS 处理，退化为即时跳转。
- 成功标准（可验收的行为）：点击任意同页 `#` 锚点链接（含标题左侧锚点）平滑滚动到目标（32px 偏移，`#start` 贴顶），URL hash 同步更新；已由其他处理器拦截的点击（TOC、tabs、wiki 封面按钮等）行为不变。

## 2. 技术方案

- 在 `source/js/main.js` 新增文档级 `click` 委托监听（`bindAnchorClick`，模块作用域注册一次）：
  - 命中 `a[href^="#"]` 且 `e.defaultPrevented === false` 才处理，避免与 TOC、tabs、tagtree、wiki `#start` 等已有处理器重复滚动；
  - 片段经 `decodeURIComponent` 解码（异常时按原样查找），`document.getElementById` 未命中则放行浏览器默认行为；
  - 命中后 `preventDefault()`，偏移量：`#start` 为 0，其余统一 32px（与 TOC 点击、初始 hash 定位一致），调用现有 `smoothScrollTo`（300–600ms easeOutCubic），并用 `history.pushState` 更新 URL。
- 不再重新引入全局 CSS `scroll-behavior: smooth`（会与自定义动画帧叠加变慢，见 `docs/designs/2026-08-09-toc-smooth-scroll.md` 的历史结论）。
- 涉及文件：`source/js/main.js`（行为变更）、`docs/knowledge/05-前端交互/toc-system.md`（文档同步）。

## 3. 影响范围

- 对外行为：所有同页 `#` 锚点链接从即时跳转恢复为平滑滚动；`#start` 仍贴顶、其余 32px 偏移；初始带 hash 打开仍为直接定位无动画（`layout/_partial/scripts/defines.ejs` 不动）。
- 兼容性：仅新增事件委托，无配置项变更；TOC、tabs、wiki 封面按钮、tagtree 等已有 `preventDefault` 的路径自动跳过，行为不变。
- 需要同步的知识库页面：`docs/knowledge/05-前端交互/toc-system.md`（用户交互章节补充页内锚点平滑滚动），并在 `docs/knowledge/VERIFICATION.md` 登记。

## 4. 验证方式

- 构建验证：主工程 `npx hexo generate`（或 `npm run g`）通过，`public/js/main.js` 包含新委托监听。
- 页面类型覆盖：技术文章页（标题锚点）、含 `{% navbar %}` 的页面（页内导航）、TOC/回到顶部/参与讨论/wiki `#start`（回归）、tabs/tagtree（回归不受影响）、带 `#锚点` URL 初始打开（仍为直接定位）。
- 浏览器手动验证：点击标题左侧锚点有平滑动画且 hash 更新；TOC 点击等已有行为无变化。
