---
title: 移动端侧边栏悬浮按钮 outline 图标执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 曾新增 `solar:sidebar-outline`、`solar:sidebar-minimalistic-outline` 并改 `menubtn.ejs` 引用。
2. [x] 发现丢失 `path#sep` 位移动画，还原：移除 outline 键、恢复 `default:leftbar` / `default:rightbar` 原键原值。
3. [x] `VERIFICATION.md` 登记（尝试与回退）。
4. [x] 验证：`npm run check`、主工程 `npm run g`、产物抽查（HTML 含 `id="sep"` 路径）。

## 风险与回退

- 作用域：仅 menubtn 两个按钮；动画依赖原 SVG 的 `path#sep`，替换图标会丢失，故保持原图。
