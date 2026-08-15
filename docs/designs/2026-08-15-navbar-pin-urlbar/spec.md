---
title: 修复移动端 URL 栏伸缩导致 navbar 玻璃效果丢失
date: 2026-08-15
status: 已实施
---

# 修复移动端 URL 栏伸缩导致 navbar 玻璃效果丢失

## 1. 问题与目标

- 列表页 `.navbar.top` 的玻璃效果由 `init.navbarPin()` 控制：以 `window.scrollY >= pinStart` 切换 `.navbar-blur.pinned` 类（未吸顶卡片样式、吸顶玻璃）。
- 手机上浏览器顶栏（URL 栏）自动收起/展开时，`window.scrollY` 随顶栏高度变化：手指下滑展开顶栏时 `scrollY` 减小，即使 navbar 仍吸顶在视口顶部，也可能跌破 `pinStart`，`.pinned` 被移除，玻璃效果退回卡片样式。
- 成功标准：只要 navbar 实际吸顶（贴住 sticky 顶部），玻璃效果就保持，不随浏览器顶栏伸缩丢失；navbar 离开顶部时正确退回卡片样式。

## 2. 技术方案

- `source/js/main.js` 的 `init.navbarPin()`：吸顶判定从 `scrollY >= pinStart` 改为直接测量 navbar 实际视口位置——`navbar.getBoundingClientRect().top <= stickyTop + 2px` 时保持 `.pinned`。删除 `documentTop()` 与 `pinStart` 计算；`stickyTop` 仍从 `getComputedStyle(navbar).top` 读取（自动兼容桌面 `var(--gap-margin)` 与移动端 `8pt`）。
- 保留 rAF 节流 scroll 监听与 resize/pageshow 重算；新增 `window.visualViewport` 存在时的 `resize` 监听（仅调用 `update()`），覆盖顶栏伸缩不触发 scroll 的情况。
- 不改 CSS（`.pinned` 语义不变），不新增配置项、不改模板与 `languages/`。

## 3. 影响范围

- 对外行为：修复移动端顶栏伸缩时 navbar 玻璃效果误消失；桌面与无顶栏环境行为不变（吸顶玻璃、未吸顶卡片）。
- 需要同步的知识库：`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。
- 主仓库 `source/wiki/stellar/advanced-settings.md` 描述的是对外行为，本次不改变行为，无需修改。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建（hexo generate + gulp minify / Babel 转译）。
- 真机/移动仿真（Chrome Android、iOS Safari）：首页（有置顶轮播）滚动越过轮播吸顶后，手指下滑展开 URL 栏，玻璃效果保持；继续上滑离开顶部退回卡片；分类/标签/归档/Wiki 首页与无置顶轮播页面、刷新/前进后退恢复滚动位置各验证一次。
- 桌面回归：吸顶玻璃、页面流中卡片样式与深浅色模式不变。
