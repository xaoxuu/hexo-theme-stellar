---
title: 左栏 UI 风格（glass / card）执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 编写方案文档（本目录 spec.md / plan.md / checklist.md）
2. [x] `_config.yml`：`style.leftbar` 下新增 `ui-style: card` 及注释
3. [x] `layout/layout.ejs`：按 `ui-style === 'card'` 追加 `leftbar-card` 类
4. [x] `source/css/_components/sidebar/sidebar.styl`：新增 `.l_left.leftbar-card` 规则
5. [x] 同步知识库 `docs/knowledge/02-布局系统/sidebar-system.md` 与 `layout-overview.md`
6. [x] 验证：`npm run check`、`verify.py`、主工程 `npm run g` 通过；`npm run s` 待预览
7. [x] 提交：主题仓库 `feat(sidebar): 左栏新增纯色卡片风格（ui-style: card）`

## 风险与回退

- 主题默认值变更影响升级站点：回退方案为显式设置 `ui-style: glass`，或在发布前改回默认 `glass`。
- 卡片风格与移动端抽屉样式叠加：`.l_left.leftbar-card` 特异性更高，统一生效；如观感不符可增加媒体查询收窄作用域。
