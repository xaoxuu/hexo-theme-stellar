---
title: 激活指示小圆点执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 模板替换：`layout/_partial/widgets/tree.ejs`、`related.ejs`、`components/link.ejs` 三处 `icon('default:bookmark.active')` → `<span class="active-dot"></span>`
2. [x] 样式：`source/css/_components/widgets/list.styl`、`widgets/components.styl` 新增 `.active-dot`（与 menu.styl 声明一致）
3. [x] 文档：`docs/designs/2026-08-15-active-dot/`（本目录）+ `docs/knowledge/VERIFICATION.md` 登记
4. [x] 主工程文档同步：`source/wiki/stellar/sidebar.md` 激活指示描述更新
5. [ ] 验证：`npm run check`、`verify.py`、主工程 `npm run g`、`npm run s` 视觉验收

## 风险与回退

- 风险：圆点视觉与旧书签不一致（8px 渐变圆点 vs 1rem 书签）——属于用户选定的目标样式，与 menubar 一致。
- 回退：恢复三处 `icon('default:bookmark.active')` 并删除新增 `.active-dot` 样式即可。
