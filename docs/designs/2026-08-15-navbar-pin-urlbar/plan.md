---
title: 修复移动端 URL 栏伸缩导致 navbar 玻璃效果丢失 执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 修改 `source/js/main.js`：`init.navbarPin()` 改为基于 `getBoundingClientRect().top` 的视口位置判定，删除 `documentTop()`/`pinStart`；新增 `visualViewport.resize` 兜底监听。
2. [x] 同步知识库：`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md` 更新 navbarPin 实现描述；`docs/knowledge/VERIFICATION.md` 登记本次修正。
3. [x] 主题仓库 `npm run check` 验证（lint + 单测 + 知识库硬事实核查）。
4. [x] 主工程 `npm run g` 全量构建验证（含 gulp minify / Babel 转译）。
5. [x] 填写 `checklist.md` 验证记录。

## 风险与回退

- 容差 2px 若在真机顶栏动画瞬间仍有抖动，可微调；回退方案为恢复 `scrollY >= pinStart` 判定。
- `visualViewport` 为渐进增强，旧浏览器自动跳过，不影响现有行为。
