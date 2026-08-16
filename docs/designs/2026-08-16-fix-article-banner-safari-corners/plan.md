---
title: 修复 Safari 下 page 页顶部横幅 hover 方角执行计划（修订二：层叠上下文 + 强制合成）
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `source/css/_components/partial/article-banner.styl`：`.article.banner` 保留 `clip-path`，新增 `isolation: isolate` 与 `transform: translateZ(0)`；更新注释记录两轮失败方案与 WebKit 依据。
2. [x] 同步主题知识库：`content-overview.md` 横幅说明、`VERIFICATION.md` 登记行、本方案目录 spec/plan/checklist（记录 clip-path 方案经 Safari 26.5 实测仍无效）。

## 风险与回退

- 若 Safari 26.5 连「圆角父层层叠上下文 + 强制合成」也绕过，回退方案为将横幅模糊层改为 cover/置顶轮播同款常显结构（模糊层 opacity 恒 1、仅 transform 动画，`:before/:after` 无 opacity 淡入），与用户 Safari 中已验证正常的组件完全同构——该方案改变「hover 才淡入模糊」的设计，需用户确认后启用。
- 正常浏览器中 `isolation`/`transform` 视觉零变化；`transform: translateZ(0)` 仅使 `.article.banner` 成为 fixed 后代的包含块，横幅内无 fixed 元素，无影响。
