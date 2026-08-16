---
title: 间距令牌简化为 --gap-base + --gap-page 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案文档（本目录 `spec.md` / `plan.md` / `checklist.md`）
2. [x] `source/css/_custom.styl`：删除旧令牌，新增 `--gap-base` / `--gap-page`
3. [x] `source/css` 全部引用迁移：页面级规则用 `--gap-page`，内部引用用 `--gap-base`；`--width-sidebar` 简化
4. [x] `source/js/main.js` 注释同步 `--gap-page`
5. [x] 知识库同步：design-tokens / responsive-design / styling-overview / sidebar-system / custom-styling-overrides / VERIFICATION
6. [x] 主题仓库 `npm run check` + 主工程 `npm run g`
7. [x] CDP 布局实测（六档宽度 × 三种页面类型）

## 风险与回退

- 风险：删除公开令牌影响外部自定义 CSS；已记入 CHANGELOG 升级注意，并提供 `--gap-base` / `--gap-page` 迁移说明。
- 回退：改动集中在 3 个 Stylus 文件与知识库文档，可整体 revert 后重新构建。
