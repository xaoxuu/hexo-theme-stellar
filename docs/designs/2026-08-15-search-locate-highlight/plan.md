---
title: 本地搜索定位与高亮执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 服务端：新增 `scripts/lib/search_index.js`（`buildSearchIndex`），改造 `scripts/generators/search.js` 输出 `anchors`。
2. [x] 客户端：改造 `source/js/search/local-search.js`（章节结果 + `?kw=`/锚点链接 + 缓存 v3），新增 `source/js/search/highlight.js`。
3. [x] 模板与样式：`layout/_partial/scripts/defines.ejs` 按需加载；`source/css/_components/sidebar/search.styl` 新增 `.search-result-section`。
4. [x] 单测：新增 `test/search_index.test.js`，覆盖锚点提取与正文重建一致性。
5. [x] 文档：更新 `docs/knowledge/07-外部集成/search.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/sidebar.md` 搜索小节（遵守 `$content-main`：刷新 `updated`）。
6. [x] 验证：主题 `npm run check`；主工程 `npm run g`；验收记录见 `checklist.md`。

## 风险与回退

- 重建正文与现状输出的一致性：先全局移除 iframe/hr/br 再切分，跨段边界空白合并；单测断言逐字节一致。
- 旧缓存无 `anchors`：客户端回退页面级行为，缓存键升 v3 强制刷新。
- 重复标题 id（如 `{% quot %}` 自定义标题）：跳转首个匹配，沿用现有 `getElementById` 行为。
- 异步渲染内容（mdrender 占位）不在索引内，无锚点/高亮影响。
