---
title: Navbar 玻璃效果触发阈值微调执行计划
date: 2026-08-17
---

# 执行计划

## 实施步骤

1. 修改 `source/js/main.js`：`navbarPin.update()` 增加 `SCROLL_THRESHOLD = 2`，`.pinned` 条件改为 `window.scrollY >= SCROLL_THRESHOLD && top <= stickyTop + TOLERANCE`，同步更新注释。
2. 同步知识库：更新 `docs/knowledge/05-前端交互/client-side-overview.md` 的 navbar 状态切换描述，在 `VERIFICATION.md` 登记。
3. 主仓库同步 `source/wiki/stellar/advanced-settings.md` 描述并刷新 `updated`。
4. 运行 `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查；主工程 `npm run s` 冒烟验收。
5. 改动保留在工作区供用户审查，不自动提交。

## 风险与回退

- 移动端顶栏伸缩改变 `scrollY`：阈值仅 2px，只在页面实际回到顶部时才回到卡片，符合预期；如发现误判可回退为仅视口位置判定。
