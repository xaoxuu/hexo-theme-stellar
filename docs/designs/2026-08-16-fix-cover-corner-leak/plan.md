---
title: 修复 Safari 下文章列表封面底部方角执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `source/css/_components/list.styl`：`.post-card` 新增 `clip-path: inset(0 round $border-card-l)`；`.cover:before` 基础规则新增 `transform: translateZ(0)`。
2. [x] 同步主题知识库：`post-lists-cards.md` 渐变模糊层小节补充 Safari 裁剪说明、`VERIFICATION.md` 登记、本方案目录 spec/plan/checklist。

## 风险与回退

- 依据现象证据：模糊层 hover（带 transform）时 Safari 正常裁剪、静止（无 transform）时漏角，常驻 `translateZ(0)` 即复现正常状态；卡片 `clip-path` 为与文章页横幅同款的额外防御。
- 若个别 Safari 版本仍漏角，回退为将模糊层常显结构改为与 cover 相同的已验证组合，或整体移除模糊层（需用户确认设计变化）。
