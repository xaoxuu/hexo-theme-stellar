---
title: 胶囊形状元素取消连续曲率圆角 执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 修改 `source/css/_components/partial/navbar.styl`：`.navbar nav a` 增加 `corner-shape: round`
2. [x] 修改 `source/css/_common/device.styl`：`.float-panel` 及其 `:before`/`:after` 增加 `corner-shape: round`
3. [x] 同步 `docs/knowledge/02-布局系统/logo-navigation-headers.md` 与 `docs/knowledge/01-样式系统/responsive-design.md`
4. [x] 在 `docs/knowledge/VERIFICATION.md` 样式变更登记表中登记
5. [x] 验证：主工程 `npm run g` + `npm run s` 预览；主题仓库 `npm run check`

## 风险与回退

- 改动仅为少量样式覆盖，影响面极小；如不需要该行为，移除对应 `corner-shape: round` 即可回退。
