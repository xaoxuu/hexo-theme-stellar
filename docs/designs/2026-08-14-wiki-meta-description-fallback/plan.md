---
title: Wiki 项目描述兜底方案执行计划
date: 2026-08-14
---

# 执行计划

## 实施步骤

1. [x] 确认现状：`og_args()` 未传 description，`generate_description()` 在 `open_graph.enable` 时提前返回，JSON-LD 无项目描述兜底。
2. [ ] 修改 `layout/_partial/head.ejs`：`og_args()` 传入 wiki 项目描述；`generate_description()` 调整优先级顺序。
3. [ ] 修改 `scripts/helpers/json_ld.js`：Website schema 增加 wiki 项目描述兜底。
4. [ ] 更新 `docs/knowledge/02-布局系统/head-seo.md` 与 `docs/knowledge/VERIFICATION.md`。
5. [ ] 主题仓库 `npm run check`；主工程 `npm run g`；抽查页面描述输出。
6. [ ] 同步主仓库 `source/wiki/stellar/wiki-settings.md` 文档。

## 风险与回退

- 风险：`theme.wiki.tree` 在 head/helper 上下文不可用（理论上由 `doc_tree.js` 在 generateBefore 阶段写入，已由 `generate_title()` 使用验证）。
- 回退：仅涉及两个模板/脚本文件的小改动，可直接还原；对外行为仅在 wiki 页描述取值上变化，不影响其它页面类型。
