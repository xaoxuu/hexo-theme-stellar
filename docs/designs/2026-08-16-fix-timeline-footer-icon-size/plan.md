---
title: 修复 timeline 组件页脚评论图标尺寸异常 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 在 `source/css/_components/tag-plugins/timeline.styl` 的 `.footer .item` 内新增 `svg { width: 1em; height: 1em; vertical-align: -0.125em }`
2. [x] 在 `docs/designs/2026-08-16-fix-timeline-footer-icon-size/` 建方案文档（spec.md / plan.md / checklist.md）
3. [x] 主工程 `npm run g` 全量构建验证
4. [x] 本地预览 + 计算样式验证（jsdom 对照 + 预览服务 CSS 检查），记录到 checklist.md；视觉抽查留待用户预览确认
5. [ ] 提交前登记 `docs/knowledge/VERIFICATION.md`（仅在用户要求提交时执行）

## 风险与回退

- 风险：SVG 尺寸规则过宽影响 footer 内其他元素——已限定 `.item` 内 `svg`，仅页脚徽章图标命中；`svg` 均带 `viewBox`，1em 缩放不失真。
- 回退：删除该条 `svg` 尺寸规则即可恢复原状。
