---
title: Navbar 玻璃效果触发阈值微调（2px 滚动）
date: 2026-08-17
status: 已实施
---

# Navbar 玻璃效果触发阈值微调

## 1. 问题与目标

- 无轮播区页面（如 wiki 首页）的 `.navbar.top` 在页面顶部即已吸顶，`init.navbarPin()` 的吸顶判定（`getBoundingClientRect().top <= stickyTop + 2px` 容差）在滚动 0 时立即成立，navbar 默认显示玻璃效果。
- 目标：页面未滚动时 navbar 保持卡片样式；页面滚动 ≥2px 且吸顶后切换玻璃效果；回到顶部（滚动 <2px）恢复卡片；有轮播区页面行为不变。

## 2. 技术方案

- `source/js/main.js`：`init.navbarPin()` 新增常量 `SCROLL_THRESHOLD = 2`，`update()` 中 `.pinned` 切换条件改为 `window.scrollY >= SCROLL_THRESHOLD && top <= state.stickyTop + TOLERANCE`。
- 保留现有视口位置测量与 `visualViewport.resize` 兜底：移动端顶栏伸缩只在页面实际回到顶部（`scrollY < 2`）时才回到卡片，正是期望状态，不产生误判回归。
- 不改 CSS：`.navbar-blur` 默认卡片、`.pinned` 玻璃的样式已有，仅调整触发条件。

## 3. 影响范围

- 对外行为：无轮播区列表页（wiki 等）顶部 navbar 由玻璃改为卡片，滚动 2px 后恢复玻璃；有轮播区页面行为不变。
- 不新增配置项，不涉及模板与 `languages/`。
- 需要同步的知识库：`docs/knowledge/05-前端交互/client-side-overview.md`，并在 `VERIFICATION.md` 登记；主仓库 `source/wiki/stellar/advanced-settings.md` 同步描述并刷新 `updated`。

## 4. 验证方式

- 主工程 `npm run s` 手动验收：wiki 等无轮播页面顶部为卡片、滚动 ≥2px 变玻璃、回顶恢复卡片；首页等有轮播页面行为不变。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
